<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\HoadonController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ShippingController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DoanhthuController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// --- 1. XÁC THỰC (AUTH) ---
Route::post('/login', [AuthController::class, 'login']); 
Route::post('/register/init', [AuthController::class, 'registerInit']);
Route::post('/register/verify', [AuthController::class, 'registerVerify']);

// --- 2. PUBLIC ROUTES (XEM KHÔNG CẦN LOGIN) ---
Route::get('/categories', [CategoryController::class, 'index']); 
Route::get('/categories/{id}', [CategoryController::class, 'show']);
Route::get('/products', [ProductController::class, 'index']); 
Route::get('/products/search', [ProductController::class, 'search']); 
Route::get('/products/{id}', [ProductController::class, 'show']);

// --- 3. PROTECTED ROUTES (YÊU CẦU ĐĂNG NHẬP) ---
Route::middleware(['auth:sanctum'])->group(function () {
    
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return response()->json($request->user());
    });

    // Quản lý Hồ sơ
    Route::get('/profile', [ProfileController::class, 'index']); 
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar']);

    // --- QUẢN LÝ DANH MỤC (SỬA LỖI 500 & 401 Ở ĐÂY) ---
    // Lưu ý: Không dùng prefix('categories') lồng thêm một lần nữa nếu đã gọi API trực tiếp
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::patch('/categories/{id}/status', [CategoryController::class, 'updateStatus']); // Đây là route lỗi 500
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // --- QUẢN LÝ SẢN PHẨM ---
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    // --- ADMIN DASHBOARD & ĐƠN HÀNG ---
    Route::prefix('admin')->group(function () {
        Route::get('/revenue', [DoanhthuController::class, 'getRevenue']);
        Route::get('/inventory', [DoanhthuController::class, 'getInventory']);
        Route::get('/top-products', [DoanhthuController::class, 'getTopProducts']);
        Route::get('/all-invoices', [HoadonController::class, 'index']);
        Route::get('/all-shipping', [ShippingController::class, 'index']);
    });
Route::get('/notifications', function () {
        return response()->json([
            'status' => 'success',
            'data' => [] // Trả về mảng rỗng để React không bị lỗi map()
        ]);
    });

    Route::get('/get_conversations', function (Request $request) {
        return response()->json([
            'status' => 'success',
            'data' => [] // Trả về mảng rỗng
        ]);
    });
    // Các thao tác khác
    Route::post('/all-invoices', [HoadonController::class, 'store']);
    Route::get('/my-invoices', [HoadonController::class, 'getMyInvoices']);
    Route::post('/update_order_status', [HoadonController::class, 'updateStatus']);
    Route::post('/cancel_order', [HoadonController::class, 'cancelOrder']);
    Route::post('/update_shipping', [ShippingController::class, 'update']);

    // Quản lý User
    Route::get('/users', [UserController::class, 'index']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
});