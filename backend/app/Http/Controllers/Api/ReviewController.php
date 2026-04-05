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
    {
        $review = Review::findOrFail($id);
        $review->reply = $request->reply_content;
        $review->save();

        return response()->json(['status' => 'success', 'message' => 'Đã gửi phản hồi']);
    }
}
