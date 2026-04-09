<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Exception;

class ProductController extends Controller
{
    /**
     * 1. LẤY DANH SÁCH SẢN PHẨM (Đã sửa lỗi thiếu cột cho Admin)
     */
    public function index(Request $request)
    {
        $sortBy = $request->query('sort_by', 'all');
        $sortOrder = $request->query('sort_order', 'default');
        $category = $request->query('category', 'All');
        $perPage = $request->query('per_page', 9); 
        $minPrice = $request->query('min_price', 0); 
        $maxPrice = $request->query('max_price', 100000000); // Tăng hạn mức giá tối đa

        // CẬP NHẬT: Thêm đầy đủ các cột cần thiết để trang quản lý không bị mất dữ liệu
        $query = Product::select([
            'products.id', 
            'products.name', 
            'products.price', 
            'products.images', 
            'products.category', 
            'products.status', 
            'products.stock',       // Cột kho
            'products.unit',        // Cột đơn vị
            'products.description', // Cột mô tả
            'products.origin',      // Cột xuất xứ
            'products.created_at'
        ]);

        // 1. Lọc theo Category
        if ($category !== 'All') {
            $query->where('products.category', $category);
        }

        // 2. Lọc theo Khoảng giá
        $query->whereBetween('products.price', [(float)$minPrice, (float)$maxPrice]);

        // 3. Xử lý logic Best-seller
        if ($sortBy === 'best-seller') {
            $query->join('chi_tiet_hoadons', 'products.name', '=', 'chi_tiet_hoadons.name')
                  ->join('shippings', 'chi_tiet_hoadons.hoadon_id', '=', 'shippings.orderId')
                  ->selectRaw('SUM(chi_tiet_hoadons.qty) as total_sold')
                  ->where('shippings.status', 'Đã giao') 
                  // Group by tất cả các cột đã select để tránh lỗi SQL Strict Mode
                  ->groupBy(
                      'products.id', 'products.name', 'products.price', 'products.images', 
                      'products.category', 'products.status', 'products.stock', 
                      'products.unit', 'products.description', 'products.origin', 'products.created_at'
                  )
                  ->orderByDesc('total_sold')
                  ->having('total_sold', '>', 0);
        } 
        elseif ($sortOrder === 'price-asc') {
            $query->orderBy('products.price', 'asc');
        } 
        elseif ($sortOrder === 'price-desc') {
            $query->orderBy('products.price', 'desc');
        } 
        else {
            if ($sortBy !== 'best-seller') {
                $query->latest('products.created_at');
            }
        }

        $paginatedData = $query->paginate($perPage)->withQueryString();

        return response()->json([
            'status' => 'success',
            'data' => $paginatedData->items(),
            'pagination' => [
                'total' => $paginatedData->total(),
                'current_page' => $paginatedData->currentPage(),
                'last_page' => $paginatedData->lastPage(),
                'per_page' => (int)$paginatedData->perPage(),
            ]
        ]);
    }

    /**
     * 2. LẤY CHI TIẾT MỘT SẢN PHẨM
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
     * 3. TÌM KIẾM SẢN PHẨM
     */
    public function search(Request $request)
    {
        $searchTerm = $request->query('q');

        if (!$searchTerm) {
            return response()->json(['status' => 'success', 'data' => []]);
        }

        $products = Product::where('name', 'LIKE', "%{$searchTerm}%")
            ->latest()
            ->limit(20) 
            ->get();

        return response()->json([
            'status' => 'success',
            'count' => $products->count(),
            'data' => $products
        ]);
    }

    /**
     * 4. THÊM SẢN PHẨM
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
            'images' => $imagePaths, // Lưu mảng path (Model nên có casts images => array)
            'approval_status' => 'approved',
            'is_banned' => false
        ]));

        return response()->json([
            'status' => 'success',
            'message' => 'Thêm sản phẩm thành công',
            'data' => $product
        ], 201);
    }

    /**
     * 5. CẬP NHẬT SẢN PHẨM
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

        $existingImages = $request->input('existing_images', []);
        $imagePaths = array_map(function($url) {
            return str_replace(url('/') . '/', '', $url); 
        }, $existingImages);

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
     * 6. XÓA SẢN PHẨM
     */
    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        
        // Xóa file vật lý
        $images = $product->images; 
        if (is_array($images)) {
            foreach ($images as $img) {
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
     * 7. CẬP NHẬT TỒN KHO
     */
    public function addStock(Request $request, $id)
    {
        $request->validate(['quantity_added' => 'required|integer|min:1']);

        $product = Product::findOrFail($id);
        $product->increment('stock', $request->quantity_added);

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật tồn kho thành công',
            'data' => $product
        ]);
    }
}