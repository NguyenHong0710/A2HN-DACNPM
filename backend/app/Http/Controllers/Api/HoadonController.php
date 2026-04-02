<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hoadon;
use Illuminate\Http\Request;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\Shipping;
class HoadonController extends Controller
{
    /**
     * TẠO ĐƠN HÀNG MỚI (Dành cho trang Checkout)
     * Xử lý lưu hóa đơn và chi tiết hóa đơn trong một Transaction
     */
    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            // Lấy thông tin user từ Token (Sanctum)
            $user = $request->user();

            if (!$user) {
                return response()->json(['status' => 'error', 'message' => 'Vui lòng đăng nhập để đặt hàng'], 401);
            }

            // --- BƯỚC 1: TÍNH TOÁN TỔNG TIỀN TỪ DANH SÁCH SẢN PHẨM ---
            // Việc tính toán ở Backend giúp tránh lỗi null và ngăn chặn việc gian lận giá từ Frontend
            $calculatedAmount = 0;
            if ($request->has('items') && is_array($request->items)) {
                foreach ($request->items as $item) {
                    $price = $item['price'] ?? 0;
                    $qty = $item['qty'] ?? ($item['quantity'] ?? 1);
                    $calculatedAmount += ($price * $qty);
                }
            } else {
                return response()->json(['status' => 'error', 'message' => 'Giỏ hàng trống hoặc dữ liệu không hợp lệ'], 400);
            }

            // 2. Tạo hóa đơn chính
            // Sử dụng $calculatedAmount thay vì $request->total_amount để đảm bảo không bị NULL
            $hoadon = Hoadon::create([
                'user_id'         => $user->id,
                'customer'        => $request->fullName,
                'phone'           => $request->phone,
                'address'         => $request->address,
                'amount'          => $calculatedAmount, 
                'payment_method'  => $request->payment_method,
                'deliveryStatus'  => 'pending', 
            ]);

            // 3. Lưu chi tiết từng sản phẩm trong đơn hàng
            foreach ($request->items as $item) {
                // Gọi quan hệ chiTiet() đã định nghĩa trong Model Hoadon
                $hoadon->chiTiet()->create([
                    'name'  => $item['name'] ?? 'Sản phẩm không tên',
                    'qty'   => $item['qty'] ?? ($item['quantity'] ?? 1),
                    'price' => $item['price'] ?? 0,
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
            return response()->json([
                'status' => 'error',
                'message' => 'Lỗi hệ thống khi tạo đơn hàng: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy toàn bộ hóa đơn (Dành cho Admin/Dashboard)
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
            Log::error("Admin Index Error: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Lỗi hệ thống khi lấy danh sách hóa đơn: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Lấy hóa đơn của RIÊNG người dùng đang đăng nhập (Dành cho trang Profile)
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
                'data' => $this->formatInvoices($invoices)
            ]);
        } catch (Exception $e) {
            Log::error("GetMyInvoices Error: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Lỗi khi lấy lịch sử đơn hàng: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cập nhật trạng thái đơn hàng (Dành cho Admin/Shipper)
     */
    // App/Http/Controllers/Api/HoadonController.php

public function update(Request $request)
{
    DB::beginTransaction();
    try {
        // 1. Tìm hóa đơn gốc dựa trên ID từ bảng quản lý
        $hoadon = Hoadon::find($request->id);
        if (!$hoadon) {
            return response()->json(['status' => 'error', 'message' => 'Không tìm thấy hóa đơn'], 404);
        }

        // 2. Cập nhật trạng thái cho bảng Hóa đơn
        $hoadon->update(['deliveryStatus' => $request->status]);

        // 3. ĐỒNG BỘ SANG VẬN CHUYỂN: Kiểm tra xem đã có vận đơn chưa
        $shipping = Shipping::where('orderId', $hoadon->id)->first();

        if ($shipping) {
            // Nếu đã có, chỉ cập nhật trạng thái mới
            $shipping->update(['status' => $request->status]);
        } else {
            // Nếu chưa có (đơn mới), TẠO MỚI bản ghi vận chuyển để trang Shipping có dữ liệu
            Shipping::create([
    'id'       => 'SHIP-' . $hoadon->id . '-' . time(), 
    'orderId'  => $hoadon->id,
    'customer' => $hoadon->customer,
    'phone'    => $hoadon->phone,
    'address'  => $hoadon->address,
    'status'   => $request->status,
    'method'   => 'Giao hàng tiêu chuẩn',
    
    // TRUYỀN NGÀY GIỜ CHUẨN (Không truyền chuỗi "2-4 ngày" nữa)
    'estimatedTime' => now()->addDays(3), 
]);
        }

        DB::commit();
        return response()->json(['status' => 'success', 'message' => 'Cập nhật và đồng bộ vận chuyển thành công!']);
    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json(['status' => 'error', 'message' => 'Lỗi: ' . $e->getMessage()], 500);
    }
}
    /**
     * Hủy đơn hàng (Dành cho Người dùng ở trang Profile)
     */
    public function cancelOrder(Request $request)
    {
        try {
            $user = $request->user();
            $order = Hoadon::where('id', $request->id)
                           ->where('user_id', $user->id)
                           ->first();

            if (!$order) {
                return response()->json(['status' => 'error', 'message' => 'Không tìm thấy đơn hàng'], 404);
            }

            if ($order->deliveryStatus !== 'pending') {
                return response()->json(['status' => 'error', 'message' => 'Chỉ có thể hủy đơn hàng khi đang chờ xử lý'], 400);
            }

            $order->update(['deliveryStatus' => 'cancelled']);

            return response()->json(['status' => 'success', 'message' => 'Đã hủy đơn hàng thành công']);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Hàm phụ trợ để format dữ liệu đồng nhất trả về cho Frontend
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
                    ];
                }) : []
            ];
        });
    }
}