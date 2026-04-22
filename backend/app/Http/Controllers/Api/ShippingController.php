<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shipping;
use App\Models\Hoadon;
use Illuminate\Http\Request;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log; // Thêm Log để dễ debug

class ShippingController extends Controller
{
    public function index()
    {
        try {
            // Sử dụng eager loading để tránh lỗi N+1 và lấy dữ liệu lồng nhau cho React
            $shippings = Shipping::with(['hoadon.chiTiet'])
                ->whereIn('status', ['Đang giao', 'Đã giao', 'Giao thành công'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $shippings
            ], 200);
        } catch (Exception $e) {
            Log::error("Shipping Index Error: " . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Không thể lấy danh sách vận chuyển'], 500);
        }
    }

    public function update(Request $request)
    {
        // 1. Validate chặt chẽ
        $request->validate([
            'id'     => 'required|exists:shippings,id', // Kiểm tra ID phải tồn tại trong bảng shippings
            'status' => 'required|string'
        ]);

        try {
            return DB::transaction(function () use ($request) {
                // 2. Tìm đơn vận chuyển
                $shipping = Shipping::lockForUpdate()->find($request->id);

                if (!$shipping) {
                    return response()->json(['status' => 'error', 'message' => 'Đơn vận chuyển không tồn tại'], 404);
                }

                // 3. Cập nhật bảng Shipping
                // Dùng $request->only để lọc dữ liệu tránh bị ghi đè null ngoài ý muốn
                $updateData = $request->only(['status', 'note', 'method', 'estimatedTime']);
                $shipping->update($updateData);

                // 4. ĐỒNG BỘ sang bảng Hoadon
                /** * LƯU Ý: Phải kiểm tra đúng tên cột khóa ngoại của bạn. 
                 * Nếu bảng shippings của bạn dùng 'hoadon_id' thay vì 'orderId' thì sửa lại dòng dưới.
                 */
                $foreignKey = isset($shipping->orderId) ? $shipping->orderId : $shipping->hoadon_id;

                if ($foreignKey) {
                    $hoadon = Hoadon::find($foreignKey);
                    if ($hoadon) {
                        $hoadon->update([
                            'deliveryStatus' => $request->status
                        ]);
                    }
                }

                return response()->json([
                    'status' => 'success',
                    'message' => 'Cập nhật trạng thái thành công',
                    'data' => $shipping->load('hoadon') // Trả về kèm data mới để React update UI
                ]);
            });

        } catch (Exception $e) {
            Log::error("Shipping Update Error ID {$request->id}: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Lỗi hệ thống khi cập nhật: ' . $e->getMessage()
            ], 500);
        }
    }
}