<?php


namespace App\Http\Controllers\Api\Admin;
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Review;

class ReviewController
{
    // 1. Lấy danh sách toàn bộ đánh giá
    public function index()
    {
        $reviews = Review::with('product:id,name') // Lấy kèm tên sản phẩm
        $reviews = Review::with('user:id,name')
            ->where('product_id', $productId)
            // Nếu bạn có dùng trường status, hãy bỏ comment dòng dưới để chỉ hiện các review đã duyệt
            // ->where('status', 'approved')
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
     * 2. Gửi đánh giá mới
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
        $product = Product::find($productId);

        // Kiểm tra đã mua hàng và nhận hàng chưa
        $hasPurchased = DB::table('hoadons')
            ->join('chi_tiet_hoadons', 'hoadons.id', '=', 'chi_tiet_hoadons.hoadon_id')
            ->where('hoadons.user_id', $userId)
            ->where('chi_tiet_hoadons.name', $product->name)
            ->where('hoadons.deliveryStatus', 'LIKE', 'Đã giao%')
            ->exists();

        if (!$hasPurchased) {
            return response()->json(['message' => 'Bạn cần mua sản phẩm này và nhận hàng thành công mới có thể đánh giá.'], 403);
        }

        // Kiểm tra xem đã đánh giá chưa để tránh spam
        if (Review::where('user_id', $userId)->where('product_id', $productId)->exists()) {
            return response()->json(['message' => 'Bạn đã đánh giá sản phẩm này rồi.'], 400);
        }

        try {
            $review = Review::create([
                'user_id' => $userId,
                'product_id' => $productId,
                'rating' => $request->rating,
                'comment' => $request->comment,
                'status' => 'pending' // Mặc định chờ duyệt nếu cần
            ]);
            return response()->json(['message' => 'Cảm ơn bạn đã đánh giá!', 'data' => $review->load('user:id,name')], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi: ' . $e->getMessage()], 500);
        }
    }

    /**
     * 3. Lấy toàn bộ đánh giá kèm thống kê
     */
    public function getAllReviewsForAdmin()
    {
        $reviews = Review::with(['user:id,name', 'product:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Tính toán thống kê nhỏ cho Admin
        $stats = [
            'total' => $reviews->count(),
            'pending' => $reviews->where('status', 'pending')->count(),
            'average_rating' => $reviews->avg('rating') ? round($reviews->avg('rating'), 1) : 0
        ];

        return response()->json([
            'status' => 'success',
            'stats' => $stats,
            'data' => $reviews
        ]);
    }
    // 4. Xóa vĩnh viễn đánh giá
    public function destroy($id)
    {
        $review = Review::findOrFail($id);
        $review->delete();

        return response()->json(['status' => 'success', 'message' => 'Đã xóa đánh giá thành công']);
    }

    // 2. Cập nhật trạng thái (Duyệt / Ẩn)
    public function updateStatus(Request $request, $id)
    {
        $review = Review::findOrFail($id);
        $review->status = $request->status; // 'approved' hoặc 'hidden'
        $review->save();

        return response()->json(['status' => 'success', 'message' => 'Đã cập nhật trạng thái']);
    }

    // 3. Admin trả lời đánh giá
    public function reply(Request $request, $id)
    /**
     * 6. Xóa đánh giá
     */
    public function destroy($id)
    {
        $review = Review::findOrFail($id);
        $review->reply = $request->reply_content;
        $review->save();

        return response()->json(['status' => 'success', 'message' => 'Đã gửi phản hồi']);
    }
}
