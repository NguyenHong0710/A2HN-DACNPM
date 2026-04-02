<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hoadon;
use App\Models\ChiTietHoadon;
use Illuminate\Http\Request;
use App\Models\Shipping;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class HoadonController extends Controller
{
    /**
     * TẠO ĐƠN HÀNG MỚI
     */
    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Vui lòng đăng nhập để đặt hàng'
                ], 401);
            }

            // --- TÍNH TỔNG TIỀN ---
            $calculatedAmount = 0;
            if ($request->has('items') && is_array($request->items)) {
                foreach ($request->items as $item) {
                    $price = $item['price'] ?? 0;
                    $qty = $item['qty'] ?? ($item['quantity'] ?? 1);
                    $calculatedAmount += ($price * $qty);
                }
            } else {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Giỏ hàng trống hoặc dữ liệu không hợp lệ'
                ], 400);
            }

            // --- TẠO HÓA ĐƠN ---
            $hoadon = Hoadon::create([
                'user_id'         => $user->id,
                'customer'        => $request->fullName,
                'phone'           => $request->phone,
                'address'         => $request->address,
                'amount'          => $calculatedAmount,
                'payment_method'  => $request->payment_method,
                'deliveryStatus'  => 'pending',
            ]);

            // --- UPDATE USER ---
            $user->update([
                'name'    => $request->fullName,
                'phone'   => $request->phone,
                'address' => $request->address,
            ]);

            // --- LƯU CHI TIẾT SẢN PHẨM ---
            foreach ($request->items as $item) {
                $rawImage = $item['images'] ?? $item['image'] ?? $item['product_image'] ?? $item['thumb'] ?? null;
                $imagePath = is_array($rawImage) ? ($rawImage[0] ?? null) : $rawImage;

                $hoadon->chiTiet()->create([
                    'name'   => $item['name'] ?? 'Sản phẩm không tên',
                    'qty'    => $item['qty'] ?? ($item['quantity'] ?? 1),
                    'price'  => $item['price'] ?? 0,
                    'images' => $imagePath,
                ]);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Đặt hàng thành công!',
                'order_id' => $hoadon->id
            ], 201);

        } catch (Exception $e) {
            DB::rollBack();
            Log::error("Store Order Error: " . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Lỗi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * ADMIN: Lấy tất cả hóa đơn
     */
    public function index()
    {
        try {
            $invoices = Hoadon::with('chiTiet')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $this->formatInvoices($invoices)
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * USER: Lấy đơn hàng của mình
     */
    public function getMyInvoices(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Tài khoản chưa xác thực'
                ], 401);
            }

            $invoices = Hoadon::with('chiTiet')
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $this->formatInvoices($invoices)
            ]);
        } catch (Exception $e) {
            Log::error("GetMyInvoices Error: " . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Lỗi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cập nhật trạng thái đơn hàng
     */
    public function updateStatus(Request $request)
    {
        DB::beginTransaction();
        try {
            $hoadon = Hoadon::find($request->id);

            if (!$hoadon) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Không tìm thấy hóa đơn'
                ], 404);
            }

            $newStatus = $request->status ?? $request->deliveryStatus;

            if ($newStatus) {
                $hoadon->update([
                    'deliveryStatus' => $newStatus
                ]);

                $shipping = Shipping::where('orderId', $hoadon->id)->first();
                $shippingStatus = ($newStatus === 'Đã xác nhận') ? 'Chờ lấy hàng' : $newStatus;

                if (!$shipping) {
                    Shipping::create([
                        'id'            => 'SHIP-' . $hoadon->id . '-' . time(),
                        'orderId'       => $hoadon->id,
                        'customer'      => $hoadon->customer ?? 'Khách hàng',
                        'phone'         => $hoadon->phone,
                        'address'       => $hoadon->address ?? '',
                        'method'        => 'Giao hàng tiêu chuẩn',
                        'status'        => $shippingStatus,
                        'estimatedTime' => now()->addDays(3),
                        'note'          => 'Auto tạo từ hóa đơn'
                    ]);
                } else {
                    $shipping->update([
                        'status' => $shippingStatus
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Cập nhật thành công',
                'current_status' => $hoadon->deliveryStatus
            ]);

        } catch (Exception $e) {
            DB::rollBack();
            Log::error("Update Status Error: " . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Hủy đơn hàng
     */
    public function cancelOrder(Request $request)
    {
        try {
            $user = $request->user();

            $order = Hoadon::where('id', $request->id)
                ->where('user_id', $user->id)
                ->first();

            if (!$order) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Không tìm thấy đơn hàng'
                ], 404);
            }

            if ($order->deliveryStatus !== 'pending') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Chỉ được hủy khi đang chờ xử lý'
                ], 400);
            }

            $order->update([
                'deliveryStatus' => 'cancelled'
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Đã hủy thành công'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Format dữ liệu
     */
    private function formatInvoices($invoices)
    {
        return $invoices->map(function ($inv) {
            return [
                'id' => $inv->id,
                'customer' => $inv->customer ?? 'Khách hàng',
                'date' => $inv->created_at ? $inv->created_at->format('d/m/Y H:i') : 'N/A',
                'amount' => (float)($inv->amount ?? 0),
                'payment_method' => $inv->payment_method ?? '',
                'deliveryStatus' => $inv->deliveryStatus ?? 'pending',
                'address' => $inv->address ?? '',
                'phone' => $inv->phone ?? '',
                'items' => $inv->chiTiet ? $inv->chiTiet->map(function ($item) {
                    return [
                        'name'  => $item->name,
                        'qty'   => $item->qty,
                        'price' => (float)$item->price,
                        'image' => $item->images,
                    ];
                }) : []
            ];
        });
    }
}