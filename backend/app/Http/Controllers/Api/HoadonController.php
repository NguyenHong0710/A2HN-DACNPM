<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hoadon;
use App\Models\ChiTietHoadon; // Đảm bảo đã import model này
use Illuminate\Http\Request;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\Shipping;

class HoadonController extends Controller
{
    /**
     * TẠO ĐƠN HÀNG MỚI (Dành cho trang Checkout)
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
                foreach ($request->items as $item) {
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

            // 3. Lưu chi tiết từng sản phẩm (SỬA Ở ĐÂY)
            foreach ($request->items as $item) {
                $hoadon->chiTiet()->create([
                    'name'  => $item['name'] ?? 'Sản phẩm không tên',
                    'qty'   => $item['qty'] ?? ($item['quantity'] ?? 1),
                    'price' => $item['price'] ?? 0,
                    'images' => $item['images'] ?? null, // <--- THÊM DÒNG NÀY ĐỂ LƯU VÀO DB
                ]);
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
            return response()->json(['status' => 'error', 'message' => 'Lỗi: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Lấy toàn bộ hóa đơn (Admin)
     */
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

    /**
     * Lấy hóa đơn của RIÊNG người dùng (Order History)
     */
    public function getMyInvoices(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['status' => 'error', 'message' => 'Tài khoản chưa xác thực.'], 401);
            }

            $invoices = Hoadon::with('chiTiet')
                ->where('user_id', $user->id) 
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $this->formatInvoices($invoices) // <--- formatInvoices sẽ lấy ảnh ra cho bạn
            ]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Cập nhật trạng thái
     */
    public function update(Request $request)
    {
        DB::beginTransaction();
        try {
            $hoadon = Hoadon::find($request->id);
            if (!$hoadon) return response()->json(['status' => 'error', 'message' => 'Không tìm thấy'], 404);

            $hoadon->update(['deliveryStatus' => $request->status]);

            $shipping = Shipping::where('orderId', $hoadon->id)->first();
            if ($shipping) {
                $shipping->update(['status' => $request->status]);
            } else {
                Shipping::create([
                    'id'           => 'SHIP-' . $hoadon->id . '-' . time(), 
                    'orderId'      => $hoadon->id,
                    'customer'     => $hoadon->customer,
                    'phone'        => $hoadon->phone,
                    'address'      => $hoadon->address,
                    'status'       => $request->status,
                    'method'       => 'Giao hàng tiêu chuẩn',
                    'estimatedTime' => now()->addDays(3), 
                ]);
            }

            DB::commit();
            return response()->json(['status' => 'success', 'message' => 'Cập nhật thành công!']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Hủy đơn hàng
     */
    public function cancelOrder(Request $request)
    {
        try {
            $user = $request->user();
            $order = Hoadon::where('id', $request->id)->where('user_id', $user->id)->first();
            if (!$order || $order->deliveryStatus !== 'pending') {
                return response()->json(['status' => 'error', 'message' => 'Không thể hủy'], 400);
            }
            $order->update(['deliveryStatus' => 'cancelled']);
            return response()->json(['status' => 'success', 'message' => 'Đã hủy thành công']);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Format dữ liệu trả về cho Frontend (SỬA Ở ĐÂY)
     */
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