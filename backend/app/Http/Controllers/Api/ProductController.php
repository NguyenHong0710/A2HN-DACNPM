<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB; // Thêm DB để xử lý query phức tạp
use Exception;

class ProductController extends Controller
{
    /**
     * 1. LẤY DANH SÁCH SẢN PHẨM (Sửa lỗi lọc Category & Khôi phục Best-seller)
     */
    public function index(Request $request)
    {
        $sortBy = $request->query('sort_by', 'newest');
        $category = $request->query('category', 'All'); 
        $query = Product::query();

        // --- BƯỚC 1: LỌC THEO CATEGORY (Sửa lỗi bạn gặp phải) ---
        if ($category !== 'All') {
            $query->where('category', $category);
        }

        // --- BƯỚC 2: XỬ LÝ CÁC TRƯỜNG HỢP SORT/FILTER ---
        
        // Trường hợp 1: Lọc theo giá
        if ($sortBy === 'price') {
            $minPrice = $request->query('min_price', 0);
            $maxPrice = $request->query('max_price', 5000000);

            $query->where('price', '>=', (float)$minPrice)
                  ->where('price', '<=', (float)$maxPrice)
                  ->orderBy('price', 'asc');
        } 
        
        // Trường hợp 2: Bán chạy nhất (Khôi phục lại chuẩn danh sách groupBy của bạn)
        elseif ($sortBy === 'best-seller') {
            $query->leftJoin('chi_tiet_hoadons', 'products.name', '=', 'chi_tiet_hoadons.name')
                  ->select(
                      'products.id',
                      'products.name',
                      'products.price',
                      'products.images',
                      'products.category',
                      'products.status',
                      'products.created_at',
                      DB::raw('SUM(IFNULL(chi_tiet_hoadons.qty, 0)) as total_sold')
                  )
                  ->groupBy(
                      'products.id',
                      'products.name',
                      'products.price',
                      'products.images',
                      'products.category',
                      'products.status',
                      'products.created_at'
                  )
                  ->having('total_sold', '>', 0) 
                  ->orderBy('total_sold', 'desc');
        }
        
        // Trường hợp 3: Mặc định / Mới nhất
        else {
            $query->orderBy('created_at', 'desc');
        }

        // --- BƯỚC 3: PHÂN TRANG & XỬ LÝ ẢNH ---
        $perPage = 15;
        $paginatedData = $query->paginate($perPage);

        $paginatedData->getCollection()->transform(function ($product) {
            if (is_array($product->images)) {
                $product->images = array_map(function ($img) {
                    if (str_starts_with($img, 'http')) return $img;
                    $path = str_replace('storage/', '', $img);
                    return url('storage/' . $path);
                }, $product->images);
            } else {
                $product->images = [];
            }
            return $product;
        });

        return response()->json([
            'status' => 'success',
            'active_category' => $category,
            'pagination' => [
                'total' => $paginatedData->total(),
                'per_page' => $paginatedData->perPage(),
                'current_page' => $paginatedData->currentPage(),
                'last_page' => $paginatedData->lastPage(),
            ],
            'data' => $paginatedData->items()
        ]);
    }
    /**
     * 2. LẤY CHI TIẾT MỘT SẢN PHẨM (Giữ nguyên)
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
     * 3. THÊM SẢN PHẨM (Giữ nguyên)
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
     * 4. CẬP NHẬT SẢN PHẨM (Giữ nguyên)
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
     * 5. XÓA SẢN PHẨM (Giữ nguyên)
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
     * 6. CẬP NHẬT TỒN KHO (Giữ nguyên)
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

    /**
     * 7. TÌM KIẾM SẢN PHẨM (Giữ nguyên)
     */
    public function search(Request $request)
    {
        $query = $request->query('q');

        if (!$query) {
            return response()->json([
                'status' => 'success',
                'data' => []
            ]);
        }

        $products = Product::where(function($q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%");
            })
            ->orderBy('created_at', 'desc')
            ->get();

        foreach ($products as $product) {
            if (is_array($product->images)) {
                $product->images = array_map(function ($img) {
                    if (str_starts_with($img, 'http')) return $img;
                    return url($img);
                }, $product->images);
            } else {
                $product->images = [];
            }
        }

        return response()->json([
            'status' => 'success',
            'count' => $products->count(),
            'data' => $products
        ]);
    }
    
}