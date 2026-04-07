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
        'items' => 'required|array', // Thay vì gửi 'total', hãy gửi cả danh sách 'items'
    ]);

    $code = $request->input('code');
    $items = $request->input('items'); // Mảng các sản phẩm [{id: 1, price: 100, qty: 1}, ...]

    $voucher = Promotion::where('code', $code)->first();

    if (!$voucher) {
        return response()->json(['message' => 'Mã không tồn tại.'], 404);
    }

    $discountAmount = 0;

    // TRƯỜNG HỢP 1: Voucher áp dụng cho sản phẩm cụ thể
    if ($voucher->scope === 'product') {
        // Tìm xem sản phẩm đó có trong giỏ hàng không
        $targetItem = null;
        foreach ($items as $item) {
            if ($item['product_id'] == $voucher->product_id) {
                $targetItem = $item;
                break;
            }
        }

        if (!$targetItem) {
            return response()->json(['message' => 'Mã này không áp dụng cho các sản phẩm trong giỏ.'], 400);
        }

        // CHỈ TÍNH GIẢM GIÁ TRÊN SẢN PHẨM NÀY
        $itemTotal = $targetItem['price'] * $targetItem['qty'];
        if ($voucher->type === 'percent') {
            $discountAmount = ($itemTotal * $voucher->value) / 100;
        } else {
            $discountAmount = $voucher->value;
        }
    } 
    // TRƯỜNG HỢP 2: Voucher áp dụng toàn hệ thống
    else {
        $orderTotal = collect($items)->sum(function($item) {
            return $item['price'] * $item['qty'];
        });

        if ($voucher->type === 'percent') {
            $discountAmount = ($orderTotal * $voucher->value) / 100;
        } else {
            $discountAmount = $voucher->value;
        }
    }

    return response()->json([
    'code' => $voucher->code,
    'discount_amount' => $discountAmount,
    'product_id' => $voucher->product_id, // Thêm dòng này để React nhận biết sản phẩm
    'message' => 'Áp dụng thành công'
], 200);
}
}
