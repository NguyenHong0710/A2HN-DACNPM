<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shipping;
use App\Models\Hoadon; // Đảm bảo import đầy đủ các Model
use Illuminate\Http\Request;
use Exception;
use Illuminate\Support\Facades\DB; 

class ShippingController extends Controller
{
   public function index()
{
    try {
        // Load thêm quan hệ chiTiet để React có dữ liệu sản phẩm hiển thị
        // THÊM: Điều kiện lọc (whereIn) để chắc chắn chỉ hiển thị các đơn đang hoặc đã giao bên trang Vận chuyển
        $shippings = Shipping::with(['hoadon.chiTiet'])
            ->whereIn('status', ['Đang giao', 'Đã giao', 'Giao thành công']) 
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json([
            'status' => 'success',
            'data' => $shippings
        ], 200);
    } catch (Exception $e) {
        return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
    }
}

    public function update(Request $request)
    {
        // 1. Kiểm tra đầu vào
        $request->validate([
            'id' => 'required',
            'status' => 'required'
        ]);

        try {
            return DB::transaction(function () use ($request) {
                // Lấy ID chính xác từ request
                $id = $request->input('id');
                $shipping = Shipping::find($id);
                
                if (!$shipping) {
                    return response()->json([
                        'status' => 'error', 
                        'message' => 'Không tìm thấy đơn vận chuyển có ID: ' . $id
                    ], 404);
                }

                // 2. Cập nhật bảng Shipping
                // Sử dụng fill() để chỉ cập nhật những gì React gửi lên, tránh ghi đè null
                $shipping->fill([
                    'status' => $request->status,
                    'note'   => $request->note ?? $shipping->note,
                    'method' => $request->method ?? $shipping->method,
                    'estimatedTime' => $request->estimatedTime ?? $shipping->estimatedTime
                ]);
                $shipping->save();

                // 3. ĐỒNG BỘ: Cập nhật bảng Hoadon qua quan hệ
                // Sử dụng orderId (giả định cột khóa ngoại của bạn là orderId)
                $hoadon = Hoadon::find($shipping->orderId); 
                if ($hoadon) {
                    $hoadon->update([
                        'deliveryStatus' => $request->status
                    ]);
                }

                return response()->json([
                    'status' => 'success', 
                    'message' => 'Đã cập nhật trạng thái vận chuyển và hóa đơn thành công'
                ]);
            });

        } catch (Exception $e) {
            return response()->json([
                'status' => 'error', 
                'message' => 'Lỗi Server: ' . $e->getMessage()
            ], 500);
        }
    }
}