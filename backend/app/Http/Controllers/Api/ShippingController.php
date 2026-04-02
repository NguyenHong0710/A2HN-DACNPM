<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shipping; // Import Model vào đây
use Illuminate\Http\Request;
use Exception;

class ShippingController extends Controller
{
    public function index()
    {
        try {
            // Lấy kèm thông tin hóa đơn và chi tiết để phục vụ việc IN
            $shippings = Shipping::with('hoadon.chiTiet')->get();
            
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
        try {
            $shipping = Shipping::find($request->id);
            if (!$shipping) {
                return response()->json(['status' => 'error', 'message' => 'Không tìm thấy'], 404);
            }

            $shipping->update([
                'method' => $request->method,
                'status' => $request->status,
                'estimatedTime' => $request->estimatedTime ? str_replace('T', ' ', $request->estimatedTime) : null,
                'note' => $request->note,
            ]);

            return response()->json(['status' => 'success', 'message' => 'Cập nhật thành công']);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}