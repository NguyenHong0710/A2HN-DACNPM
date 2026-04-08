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
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\NewsController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// --- 1. XÁC THỰC & PUBLIC ROUTES ---
Route::post('/login', [App\Http\Controllers\Api\UserController::class, 'login'])->name('login');
Route::post('/register/init', [AuthController::class, 'registerInit']);
Route::post('/register/verify', [AuthController::class, 'registerVerify']);

// Tin tức & Khuyến mãi công khai
Route::get('/news', [NewsController::class, 'index']);
Route::get('/news/{id}', [NewsController::class, 'show']);
Route::get('/vouchers/validate', [PromotionController::class, 'validateVoucher']);

// Sản phẩm & Danh mục
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{id}', [CategoryController::class, 'show']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/search', [ProductController::class, 'search']);
Route::get('/products/{id}', [ProductController::class, 'show']);

// --- 2. PROTECTED ROUTES (YÊU CẦU ĐĂNG NHẬP) ---
Route::middleware(['auth:sanctum'])->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return response()->json($request->user());
    });

    // Hồ sơ cá nhân
    Route::get('/profile', [ProfileController::class, 'index']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar']);

   // --- QUẢN LÝ HÓA ĐƠN (INVOICES) ---
    // Tìm đoạn này trong file api.php và thay thế chính xác:
        Route::get('/all-invoices', [HoadonController::class, 'index']);
        Route::get('/get_invoices', [HoadonController::class, 'index']);
        Route::post('/create_invoice', [HoadonController::class, 'store']);
        Route::get('/my-invoices', [HoadonController::class, 'getMyInvoices']);
        Route::post('/update_order_status', [HoadonController::class, 'updateStatus']); 
        Route::post('/cancel_order', [HoadonController::class, 'cancelOrder']);
    // Quản lý vận chuyển
    Route::get('/get_shipping', [ShippingController::class, 'index']);
    Route::post('/update_shipping', [ShippingController::class, 'update']);

    // Quản lý Khuyến mãi (Promotions)
    Route::prefix('promotions')->group(function () {
        Route::get('/', [PromotionController::class, 'index']);
        Route::get('/products', [PromotionController::class, 'getProducts']);
        Route::post('/create', [PromotionController::class, 'store']);
        Route::post('/update', [PromotionController::class, 'update']);
        Route::delete('/delete', [PromotionController::class, 'destroy']);
        Route::post('/toggle-status', [PromotionController::class, 'toggleStatus']);
    });

    // Quản lý Sản phẩm (Admin)
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::post('/products/{id}/add-stock', [ProductController::class, 'addStock']);

    // Quản lý Danh mục (Admin)
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::patch('/categories/{id}/status', [CategoryController::class, 'updateStatus']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // Quản lý người dùng (Admin)
    Route::get('/users', [UserController::class, 'index']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::put('/users/{id}/change-role', [UserController::class, 'changeRole']);
    Route::put('/users/{id}/change-password', [UserController::class, 'changePassword']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::get('/admin/logs', [UserController::class, 'getActivityLogs']);
    Route::delete('/admin/logs/cleanup', [UserController::class, 'deleteOldLogs']);

    // Thống kê Dashboard
    Route::prefix('admin')->group(function () {
        Route::get('/revenue', [DoanhthuController::class, 'getRevenue']);
        Route::get('/inventory', [DoanhthuController::class, 'getInventory']);
        Route::get('/top-products', [DoanhthuController::class, 'getTopProducts']);
        Route::post('/update-stock', [DoanhthuController::class, 'updateStock']);
    });

    // Review & Notifications
    Route::get('/notifications', function () {
        return response()->json(['status' => 'success', 'data' => []]);
    });
});

// Đánh giá sản phẩm (Public hoặc Auth tùy bạn chọn, ở đây để Public theo code cũ)
Route::post('/submit-review', function (Request $request) {
    try {
        \App\Models\Review::create([
            'product_id' => $request->product_id ?? 1,
            'customer_name' => $request->customer_name ?? 'Khách Hàng',
            'rating' => $request->rating,
            'comment' => $request->comment,
            'status' => 'pending'
        ]);
        return response()->json(['status' => 'success', 'message' => 'Đã lưu đánh giá']);
    } catch (\Exception $e) {
        return response()->json(['status' => 'error', 'message' => $e->getMessage()]);
    }
});