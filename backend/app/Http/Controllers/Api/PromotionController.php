<?php

namespace App\Http\Controllers\Api; // <-- Đã có \Api chuẩn xác

use Illuminate\Http\Request;
use App\Models\Promotion;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class PromotionController extends Controller
{
    // 1. Lấy danh sách Voucher
    public function index(Request $request)
    {
        $admin_id = $request->query('admin_id', 1); // Lấy admin_id từ URL, mặc định là 1

        // Dùng leftJoin để lấy thêm tên sản phẩm nếu scope là 'product'
        $promotions = DB::table('promotions')
            ->leftJoin('products', 'promotions.product_id', '=', 'products.id')
            ->where('promotions.admin_id', $admin_id)
            ->select('promotions.*', 'products.name as product_name')
            ->orderBy('promotions.id', 'desc')
            ->get();

        return response()->json($promotions);
    }

    // 2. Lấy danh sách Sản phẩm cho vào Dropdown (Phần phạm vi áp dụng)
    public function getProducts(Request $request)
    {
        $admin_id = $request->query('admin_id', 1);
        
        // Giả sử bạn có bảng products, truy vấn trực tiếp bằng DB facade
        $products = DB::table('products')
            ->where('admin_id', $admin_id)
            ->select('id', 'name', 'price')
            ->get();
            
        return response()->json($products);
    }

    // 3. Tạo mới Voucher
    public function store(Request $request)
    {
        try {
            $promotion = Promotion::create([
                'admin_id'    => $request->admin_id,
                'code'        => $request->code,
                'name'        => $request->name,
                'type'        => $request->type,
                'value'       => $request->value,
                'scope'       => $request->scope,
                'product_id'  => $request->productId ?: null,
                'start_date'  => $request->startDate ?: null,
                'end_date'    => $request->endDate ?: null,
                'usage_limit' => $request->limit ?: 100,
                'status'      => 1
            ]);

            return response()->json(['status' => 'success', 'data' => $promotion]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    // 4. Cập nhật Voucher
    public function update(Request $request)
    {
        try {
            $promotion = Promotion::findOrFail($request->id);
            $promotion->update([
                'code'        => $request->code,
                'name'        => $request->name,
                'type'        => $request->type,
                'value'       => $request->value,
                'scope'       => $request->scope,
                'product_id'  => $request->productId ?: null,
                'start_date'  => $request->startDate ?: null,
'end_date'    => $request->endDate ?: null,
                'usage_limit' => $request->limit ?: 100,
            ]);

            return response()->json(['status' => 'success', 'data' => $promotion]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    // 5. Xóa Voucher
    public function destroy(Request $request)
    {
        try {
            $id = $request->query('id');
            Promotion::destroy($id);
            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    // 6. Bật/Tắt trạng thái Voucher
    public function toggleStatus(Request $request)
    {
        try {
            $promotion = Promotion::findOrFail($request->id);
            $promotion->status = $request->status;
            $promotion->save();
            
            return response()->json(['status' => 'success']);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    // ====================================================================
    // 7. KIỂM TRA MÃ VOUCHER KHI KHÁCH HÀNG ÁP DỤNG Ở TRANG CHECKOUT (MỚI)
    // ====================================================================
    public function validateVoucher(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'total' => 'required|numeric' // Tổng tiền từ React
        ]);

        $code = $request->input('code');
        $orderTotal = $request->input('total');

        // Tìm mã voucher trong Database bằng model Promotion
        $voucher = Promotion::where('code', $code)->first();

        // 1. Kiểm tra mã có tồn tại không
        if (!$voucher) {
            return response()->json(['message' => 'Mã ưu đãi không tồn tại.'], 404);
        }

        // 2. Kiểm tra trạng thái (status = 0 là đang tắt)
        if ($voucher->status == 0) {
            return response()->json(['message' => 'Mã ưu đãi đã hết hạn hoặc bị vô hiệu hóa.'], 400);
        }

        // 3. Tính toán số tiền được giảm
        $discountAmount = 0;
        
        // Dựa vào code của bạn, giá trị giảm đang được lưu ở cột 'value'
        if ($voucher->type === 'percent') {
            // Nếu bạn có loại giảm theo phần trăm
            $discountAmount = ($orderTotal * $voucher->value) / 100;
        } else {
            // Mặc định giảm theo số tiền cố định
            $discountAmount = $voucher->value;
        }

        // Đảm bảo tiền giảm không lớn hơn tổng tiền đơn hàng
        if ($discountAmount > $orderTotal) {
            $discountAmount = $orderTotal;
        }
// Trả về kết quả cho React
        return response()->json([
            'code' => $voucher->code,
            'discount_amount' => $discountAmount, // Checkout.js đang hứng biến này
            'message' => 'Áp dụng thành công'
        ], 200);
    }
}
