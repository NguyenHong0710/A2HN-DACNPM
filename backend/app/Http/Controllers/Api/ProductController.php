<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Exception;

class ProductController extends Controller
{
    /**
     * 1. LẤY DANH SÁCH SẢN PHẨM (GET /api/products)
     */
    public function index()
    {
        $products = Product::orderBy('created_at', 'desc')->get();

        foreach ($products as $product) {
            if (is_array($product->images)) {
                $product->images = array_map(function ($img) {
                    return str_starts_with($img, 'http') ? $img : url($img);
                }, $product->images);
            } else {
                $product->images = [];
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => $products
        ]);
    }

    /**
     * 2. LẤY CHI TIẾT MỘT SẢN PHẨM (GET /api/products/{id})
     * ĐÂY LÀ HÀM QUAN TRỌNG ĐỂ SỬA LỖI 500 CỦA BẠN
     */
    public function show($id)
    {
        try {
            $product = Product::find($id);

            if (!$product) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Không tìm thấy sản phẩm'
                ], 404);
            }

            // Xử lý URL ảnh để Frontend hiển thị được
            if (is_array($product->images)) {
                $product->images = array_map(function ($img) {
                    return str_starts_with($img, 'http') ? $img : url($img);
                }, $product->images);
            } else {
                $product->images = [];
            }

            return response()->json([
                'status' => 'success',
                'data' => $product
            ]);

        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Lỗi server: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 3. THÊM SẢN PHẨM (POST /api/products)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'admin_id' => 'required',
            'name' => 'required|string|max:255',
            'category' => 'required|string',
            'price' => 'required|numeric',
            'stock' => 'required|integer',
            'unit' => 'required|string',
            'origin' => 'nullable|string',
            'description' => 'nullable|string',
            'status' => 'required|string',
        ]);

        $imagePaths = [];

        if ($request->hasFile('new_images')) {
            foreach ($request->file('new_images') as $image) {
                $path = $image->store('products', 'public');
                $imagePaths[] = 'storage/' . $path;
            }
        }

        $product = Product::create(array_merge($validated, [
            'images' => $imagePaths,
            'approval_status' => 'pending',
            'is_banned' => false
        ]));

        return response()->json([
            'status' => 'success',
            'message' => 'Thêm sản phẩm thành công',
            'data' => $product
        ], 201);
    }

    /**
     * 4. CẬP NHẬT SẢN PHẨM (PUT /api/products/{id})
     */
    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string',
            'price' => 'required|numeric',
            'stock' => 'required|integer',
            'unit' => 'required|string',
            'origin' => 'nullable|string',
            'description' => 'nullable|string',
            'status' => 'required|string',
        ]);

        $imagePaths = $request->input('existing_images', []);

        // Xử lý loại bỏ domain nếu có
        $imagePaths = array_map(function($url) {
            return str_replace(url('/'), '', $url); 
        }, $imagePaths);

        if ($request->hasFile('new_images')) {
            foreach ($request->file('new_images') as $image) {
                $path = $image->store('products', 'public');
                $imagePaths[] = 'storage/' . $path;
            }
        }

        $product->update(array_merge($validated, [
            'images' => $imagePaths
        ]));

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật sản phẩm thành công',
            'data' => $product
        ]);
    }

    /**
     * 5. XÓA SẢN PHẨM (DELETE /api/products/{id})
     */
    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        
        if (is_array($product->images)) {
            foreach ($product->images as $img) {
                $path = str_replace('storage/', '', $img);
                Storage::disk('public')->delete($path);
            }
        }

        $product->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Đã xóa sản phẩm'
        ]);
    }

    /**
     * 6. CẬP NHẬT TỒN KHO (POST /api/products/{id}/add-stock)
     */
    public function addStock(Request $request, $id)
    {
        $request->validate([
            'quantity_added' => 'required|integer|min:1'
        ]);

        $product = Product::findOrFail($id);
        $product->stock += $request->quantity_added;
        $product->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật tồn kho thành công',
            'data' => $product
        ]);
    }
}