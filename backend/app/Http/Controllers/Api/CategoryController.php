<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class CategoryController extends Controller
{
    // Lấy danh sách
    public function index()
    {
        $categories = Category::orderBy('id', 'desc')->get()->map(function($category) {
            $category->count = 0; 
            // Nếu ảnh đã có http (do hàm store/update xử lý) thì để nguyên, nếu chưa thì nối url
            if ($category->image && !str_starts_with($category->image, 'http')) {
                $category->image = url('storage/' . $category->image);
            }
            return $category;
        });

        return response()->json($categories, 200);
    }

    // --- HÀM MỚI THÊM ĐỂ SỬA LỖI 500 ---
    public function updateStatus(Request $request, $id)
    {
        try {
            $category = Category::find($id);

            if (!$category) {
                return response()->json(['message' => 'Không tìm thấy danh mục'], 404);
            }

            // Validate dữ liệu gửi lên
            $request->validate([
                'status' => 'required|in:0,1,true,false'
            ]);

            // Chuyển đổi về kiểu boolean/integer tùy DB
            $newStatus = ($request->status === true || $request->status == 1) ? 1 : 0;
            
            $category->status = $newStatus;
            $category->save();

            return response()->json([
                'message' => 'Cập nhật trạng thái thành công',
                'status' => $category->status
            ], 200);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi Server: ' . $e->getMessage()], 500);
        }
    }

    // Thêm mới
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'slug' => 'required|string|unique:categories,slug',
            'status' => 'required',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->only(['name', 'slug']);
        $data['status'] = ($request->status === 'true' || $request->status == 1) ? 1 : 0;

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('categories', 'public');
            $data['image'] = $path;
        }

        $category = Category::create($data);
        $category->image = $category->image ? url('storage/' . $category->image) : null;
        $category->count = 0;

        return response()->json($category, 201);
    }

    // Cập nhật
    public function update(Request $request, $id)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json(['message' => 'Không tìm thấy danh mục'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'sometimes|required|string|unique:categories,slug,' . $id,
            'status' => 'sometimes',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->only(['name', 'slug']);
        if ($request->has('status')) {
            $data['status'] = ($request->status === 'true' || $request->status == 1) ? 1 : 0;
        }

        if ($request->hasFile('image')) {
            if ($category->image) {
                Storage::disk('public')->delete($category->image);
            }
            $path = $request->file('image')->store('categories', 'public');
            $data['image'] = $path;
        }

        $category->update($data);
        $category->image = $category->image ? url('storage/' . $category->image) : null;
        $category->count = 0;

        return response()->json($category, 200);
    }

    // Xóa
    public function destroy($id)
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json(['message' => 'Không tìm thấy danh mục'], 404);
        }

        if ($category->image) {
            Storage::disk('public')->delete($category->image);
        }

        $category->delete();
        return response()->json(['message' => 'Đã xóa danh mục'], 200);
    }
}