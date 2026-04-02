<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hoadon;
use Illuminate\Http\Request;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

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

            // 1. Tạo hóa đơn chính
            // ID sẽ tự động tăng trong DB nhờ thiết lập Auto Increment đã làm ở phpMyAdmin
            $hoadon = Hoadon::create([
                'user_id'         => $user->id,
                'customer'        => $request->fullName,
                'phone'           => $request->phone,
                'address'         => $request->address,
                'amount'          => $request->total_amount,
                'payment_method'  => $request->payment_method,
                'deliveryStatus'  => 'pending', 
            ]);

            // 2. Lưu chi tiết từng sản phẩm trong đơn hàng
            if ($request->has('items') && is_array($request->items)) {
                foreach ($request->items as $item) {
                    // Gọi quan hệ chiTiet() đã định nghĩa trong Model Hoadon
                    $hoadon->chiTiet()->create([
                        'name'  => $item['name'] ?? 'Sản phẩm không tên',
                        'qty'   => $item['qty'] ?? ($item['quantity'] ?? 1),
                        'price' => $item['price'] ?? 0,
                    ]);
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

            // Lọc theo user_id để đảm bảo tính bảo mật
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
    public function updateStatus(Request $request)
    {
        try {
            // Frontend gửi order_code (tương ứng với ID), tìm trong DB để update
            $order = Hoadon::find($request->order_code);

            if (!$order) {
                return response()->json(['status' => 'error', 'message' => 'Không tìm thấy hóa đơn'], 404);
            }

            $order->update(['deliveryStatus' => $request->status]);

            return response()->json(['status' => 'success', 'message' => 'Cập nhật trạng thái thành công']);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Hủy đơn hàng (Dành cho Người dùng ở trang Profile)
     */
    public function cancelOrder(Request $request)
    {
        try {
            $user = $request->user();
            // Chỉ tìm đơn hàng thuộc về chính người dùng đó
            $order = Hoadon::where('id', $request->id)
                           ->where('user_id', $user->id)
                           ->first();

            if (!$order) {
                return response()->json(['status' => 'error', 'message' => 'Không tìm thấy đơn hàng'], 404);
            }

            // Chỉ cho phép hủy nếu đơn hàng đang ở trạng thái 'pending' (chờ xử lý)
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