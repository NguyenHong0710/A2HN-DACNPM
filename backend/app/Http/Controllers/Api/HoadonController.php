<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hoadon;
use App\Models\ChiTietHoadon;
use App\Models\Product; 
use Illuminate\Http\Request;
use App\Models\Shipping;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

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
                return response()->json(['status' => 'error', 'message' => 'Vui lòng đăng nhập để đặt hàng'], 401);
            }

            $calculatedAmount = 0;
            if ($request->has('items') && is_array($request->items)) {
                // Bước 1: Kiểm tra tồn kho
                foreach ($request->items as $item) {
                    if (isset($item['id'])) {
                        $product = Product::find($item['id']);
                        if ($product && $product->stock < ($item['qty'] ?? 1)) {
                            return response()->json([
                                'status' => 'error', 
                                'message' => "Sản phẩm '{$product->name}' hiện không đủ số lượng trong kho!"
                            ], 400);
                        }
                    }

                    $price = $item['price'] ?? 0;
                    $qty = $item['qty'] ?? ($item['quantity'] ?? 1);
                    $calculatedAmount += ($price * $qty);
                }
            } else {
                return response()->json(['status' => 'error', 'message' => 'Giỏ hàng trống'], 400);
            }

            // 2. Tạo hóa đơn chính
            $hoadon = Hoadon::create([
                'user_id'         => $user->id,
                'customer'        => $request->fullName,
                'phone'           => $request->phone,
                'address'         => $request->address,
                'amount'          => $calculatedAmount,
                'payment_method'  => $request->payment_method,
                'deliveryStatus'  => 'pending',
            ]);

            // Cập nhật thông tin user
            $user->update([
                'name'    => $request->fullName,
                'phone'   => $request->phone,
                'address' => $request->address,
            ]);

            // 3. Lưu chi tiết sản phẩm và trừ tồn kho tạm thời
            foreach ($request->items as $item) {
                $rawImage = $item['images'] ?? $item['image'] ?? $item['product_image'] ?? $item['thumb'] ?? null;
                $imagePath = is_array($rawImage) ? ($rawImage[0] ?? null) : $rawImage;

                $hoadon->chiTiet()->create([
                    'name'   => $item['name'] ?? 'Sản phẩm không tên',
                    'qty'    => $item['qty'] ?? ($item['quantity'] ?? 1),
                    'price'  => $item['price'] ?? 0,
                    'images' => $imagePath,
                ]);

                if (isset($item['id'])) {
                    $product = Product::find($item['id']);
                    if ($product) {
                        $product->decrement('stock', $item['qty'] ?? 1);
                    }
                }
            }

            DB::commit();
            return response()->json([
                'status' => 'success',
                'message' => 'Tuyệt tác của bạn đã được tiếp nhận!',
                'order_id' => $hoadon->id
            ], 201);

        } catch (Exception $e) {
            DB::rollBack();
            Log::error("Store Order Error: " . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Lỗi hệ thống: ' . $e->getMessage()], 500);
        }
    }

    public function index()
    {
        try {
            $invoices = Hoadon::with('chiTiet')->orderBy('created_at', 'desc')->get();
            return response()->json([
                'status' => 'success',
                'data' => $this->formatInvoices($invoices)
            ]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function getMyInvoices(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) return response()->json(['status' => 'error', 'message' => 'Tài khoản chưa xác thực.'], 401);

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
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Cập nhật trạng thái đơn hàng (Admin)
     */
    public function updateStatus(Request $request)
    {
        DB::beginTransaction();
        try {
            $hoadon = Hoadon::with('chiTiet')->find($request->id);
            if (!$hoadon) return response()->json(['status' => 'error', 'message' => 'Không tìm thấy hóa đơn'], 404);

            $oldStatus = $hoadon->deliveryStatus;
            $newStatus = $request->status;

            // 1. Cập nhật trạng thái hóa đơn
            $hoadon->update(['deliveryStatus' => $newStatus]);

            // 2. Đồng bộ sang bảng Shipping
            $shippingStatus = ($newStatus === 'Đã xác nhận') ? 'Chờ lấy hàng' : $newStatus;
            $shipping = Shipping::where('orderId', $hoadon->id)->first();

            if (!$shipping) {
                Shipping::create([
                    'id'            => 'SHIP-' . $hoadon->id . '-' . time(),
                    'orderId'       => $hoadon->id,
                    'customer'      => $hoadon->customer ?? 'Khách hàng',
                    'phone'         => $hoadon->phone,
                    'address'       => $hoadon->address ?? 'Chưa cập nhật',
                    'method'        => 'Giao hàng tiêu chuẩn',
                    'status'        => $shippingStatus,
                    'estimatedTime' => now()->addDays(3),
                    'note'          => 'Tự động tạo từ Hóa đơn'
                ]);
            } else {
                $shipping->update(['status' => $shippingStatus]);
            }

            DB::commit();
            return response()->json(['status' => 'success', 'message' => 'Cập nhật trạng thái thành công!']);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error("Update Status Error: " . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function cancelOrder(Request $request)
    {
        DB::beginTransaction();
        try {
            $user = $request->user();
            $order = Hoadon::with('chiTiet')->where('id', $request->id)->where('user_id', $user->id)->first();
            
            if (!$order || $order->deliveryStatus !== 'pending') {
                return response()->json(['status' => 'error', 'message' => 'Không thể hủy đơn hàng này'], 400);
            }

            // Hoàn lại tồn kho khi hủy đơn
            foreach ($order->chiTiet as $item) {
                $product = Product::where('name', $item->name)->first();
                if ($product) {
                    $product->increment('stock', $item->qty);
                }
            }

            $order->update(['deliveryStatus' => 'cancelled']);
            
            DB::commit();
            return response()->json(['status' => 'success', 'message' => 'Đã hủy đơn hàng và hoàn lại kho.']);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    private function formatInvoices($invoices)
    {
        return $invoices->map(function ($inv) {
            return [
                'id' => $inv->id,
                'customer' => $inv->customer ?? 'Khách hàng Lumina',
                'date' => $inv->created_at ? $inv->created_at->format('d/m/Y H:i') : 'N/A',
                'amount' => (float)($inv->amount ?? 0),
                'payment_method' => $inv->payment_method ?? 'N/A',
                'deliveryStatus' => $inv->deliveryStatus ?? 'pending',
                'address' => $inv->address ?? 'N/A',
                'phone' => $inv->phone ?? 'N/A',
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