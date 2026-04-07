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
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\NewsController; // Thêm controller Tin Tức
Route::get('/news', [NewsController::class, 'index']); // Xem danh sách bài viết
Route::get('/news/{id}', [NewsController::class, 'show']); // Xem chi tiết 1 bài viết
// Nhóm các API cho Promotions
Route::prefix('promotions')->group(function () {
    Route::get('/', [PromotionController::class, 'index']);           // Lấy danh sách
    Route::get('/products', [PromotionController::class, 'getProducts']); // Lấy SP để đưa vào Select Box
    Route::post('/create', [PromotionController::class, 'store']);        // Tạo mã mới
    Route::post('/update', [PromotionController::class, 'update']);       // Cập nhật mã
    Route::delete('/delete', [PromotionController::class, 'destroy']);    // Xóa mã
    Route::post('/toggle-status', [PromotionController::class, 'toggleStatus']); // Bật/tắt
});
// --- 1. XÁC THỰC (PUBLIC) ---
Route::post('/login', [AuthController::class, 'login']); 
Route::post('/register/init', [AuthController::class, 'registerInit']);
Route::post('/register/verify', [AuthController::class, 'registerVerify']);
Route::post('/vouchers/validate', [PromotionController::class, 'validateVoucher']);
// --- 2. PUBLIC ROUTES (XEM SẢN PHẨM/DANH MỤC KHÔNG CẦN LOGIN) ---
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

    // --- HỒ SƠ CÁ NHÂN ---
    Route::get('/profile', [ProfileController::class, 'index']); 
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar']);

    // --- QUẢN LÝ DANH MỤC (ADMIN) ---
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::patch('/categories/{id}/status', [CategoryController::class, 'updateStatus']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // --- QUẢN LÝ SẢN PHẨM (ADMIN) ---
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::post('/products/{id}/add-stock', [ProductController::class, 'addStock']);
    // --- QUẢN LÝ NGƯỜI DÙNG (ADMIN) ---
    Route::get('/users', [UserController::class, 'index']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::put('/users/{id}/change-role', [UserController::class, 'changeRole']);
    Route::put('/users/{id}/change-password', [UserController::class, 'changePassword']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::get('/admin/logs', [UserController::class, 'getActivityLogs']);
    Route::delete('/admin/logs/cleanup', [UserController::class, 'deleteOldLogs']);

    // --- QUẢN LÝ HÓA ĐƠN (INVOICES) ---
    // Route lấy danh sách cho trang Hóa Đơn (khớp với React)
    Route::get('/all-invoices', [HoadonController::class, 'index']);
    Route::get('/get_invoices', [HoadonController::class, 'index']); 
    Route::post('/update_order_status', [HoadonController::class, 'update']);
    
    // Route cho khách hàng
    Route::post('/create_invoice', [HoadonController::class, 'store']); // Tạo đơn hàng mới
    Route::get('/my-invoices', [HoadonController::class, 'getMyInvoices']);
    Route::post('/cancel_order', [HoadonController::class, 'cancelOrder']);

    // --- QUẢN LÝ VẬN CHUYỂN (SHIPPING) ---
    // Route lấy danh sách (khớp với fetch trong Shipping.js)
    Route::get('/get_shipping', [ShippingController::class, 'index']);
    
    // Route cập nhật trạng thái/chi tiết (khớp với handleSave/handleUpdateStatusQuick)
    Route::post('/update_shipping', [ShippingController::class, 'update']);

    // --- THỐNG KÊ (DASHBOARD) ---
    Route::prefix('admin')->group(function () {
        Route::get('/revenue', [DoanhthuController::class, 'getRevenue']);
        Route::get('/inventory', [DoanhthuController::class, 'getInventory']);
        Route::get('/top-products', [DoanhthuController::class, 'getTopProducts']);
        Route::post('/update-stock', [DoanhthuController::class, 'updateStock']);
    });

    // --- CÁC ROUTE TIỆN ÍCH KHÁC ---
    Route::get('/notifications', function () {
        return response()->json(['status' => 'success', 'data' => []]);
    });

    Route::get('/get_conversations', function (Request $request) {
        return response()->json(['status' => 'success', 'data' => []]);
    });
});