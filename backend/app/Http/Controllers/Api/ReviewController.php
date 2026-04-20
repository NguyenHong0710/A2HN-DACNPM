<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Review;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ReviewController extends Controller
{
    /**
     * Lấy danh sách đánh giá của 1 sản phẩm
     */
    public function index($productId)
    {
        $reviews = Review::with('user:id,name')
            ->where('product_id', $productId)
            ->orderBy('created_at', 'desc')
            ->get();

        $avgRating = $reviews->avg('rating') ?: 0;

        return response()->json([
            'average_rating' => round($avgRating, 1),
            'total_reviews' => $reviews->count(),
            'reviews' => $reviews
        ]);
    }

    /**
     * Gửi đánh giá mới
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:5|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $userId = auth()->id();
        $productId = $request->product_id;

        // Lấy thông tin sản phẩm để lấy cột 'name' so sánh với bảng chi_tiet_hoadons
        $product = Product::find($productId);
        if (!$product) {
            return response()->json(['message' => 'Sản phẩm không tồn tại.'], 404);
        }

        /**
         * FIX LỖI: Truy vấn dựa trên cột 'name' vì bảng chi_tiet_hoadons không có product_id
         * Sử dụng LIKE 'Đã giao%' để xử lý dấu cách thừa trong Database của bạn.
         */
        $hasPurchased = DB::table('hoadons')
            ->join('chi_tiet_hoadons', 'hoadons.id', '=', 'chi_tiet_hoadons.hoadon_id')
            ->where('hoadons.user_id', $userId)
            ->where('chi_tiet_hoadons.name', $product->name) // So sánh theo TÊN sản phẩm
            ->where('hoadons.deliveryStatus', 'LIKE', 'Đã giao%')
            ->exists();

        if (!$hasPurchased) {
            return response()->json([
                'message' => 'Bạn cần mua sản phẩm này và nhận hàng thành công mới có thể đánh giá.'
            ], 403);
        }

        $alreadyReviewed = Review::where('user_id', $userId)
            ->where('product_id', $productId)
            ->exists();

        if ($alreadyReviewed) {
            return response()->json(['message' => 'Bạn đã đánh giá sản phẩm này rồi.'], 400);
        }

        try {
            $review = Review::create([
                'user_id' => $userId,
                'product_id' => $productId,
                'rating' => $request->rating,
                'comment' => $request->comment,
            ]);

            $review->load('user:id,name');

            return response()->json([
                'message' => 'Cảm ơn bạn đã đánh giá sản phẩm!',
                'data' => $review
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi hệ thống: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Lấy toàn bộ đánh giá cho Admin
     */
    public function getAllReviewsForAdmin()
    {
        if (auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Bạn không có quyền này.'], 403);
        }

        $reviews = Review::with(['user:id,name', 'product:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $reviews]);
    }

    /**
     * Admin phản hồi đánh giá
     */
    public function reply(Request $request, $id)
    {
        $request->validate(['reply' => 'required|string|max:1000']);

        try {
            $review = Review::findOrFail($id);
            $review->update(['reply' => $request->reply]);

            return response()->json(['message' => 'Đã gửi phản hồi!', 'data' => $review]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Xóa đánh giá
     */
    public function destroy($id)
    {
        $review = Review::findOrFail($id);

        if (auth()->id() !== $review->user_id && auth()->user()->role !== 'admin') {
            return response()->json(['message' => 'Không có quyền xóa.'], 403);
        }

        $review->delete();
        return response()->json(['message' => 'Đã xóa đánh giá.']);
    }
}