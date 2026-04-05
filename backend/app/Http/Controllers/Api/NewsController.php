<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NewsController extends Controller
{
    // API lấy danh sách tất cả tin tức (Public)
    public function index()
    {
        // Tạm thời trả về mảng rỗng để hết lỗi, sau này query từ Database
        return response()->json([
            'status' => 'success',
            'data' => []
        ]);
    }

    // API xem chi tiết 1 bài viết (Public)
    public function show($id)
    {
        return response()->json([
            'status' => 'success',
            'data' => null
        ]);
    }

    // API thêm bài viết mới (Admin)
    public function store(Request $request)
    {
        return response()->json(['message' => 'Đã tạo bài viết thành công']);
    }

    // API cập nhật bài viết (Admin)
    public function update(Request $request, $id)
    {
        return response()->json(['message' => 'Đã cập nhật bài viết']);
    }

    // API xóa bài viết (Admin)
    public function destroy($id)
    {
        return response()->json(['message' => 'Đã xóa bài viết']);
    }
}