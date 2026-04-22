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
use App\Http\Controllers\Api\ReviewController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// --- 1. PUBLIC ROUTES (KHÔNG CẦN LOGIN) ---
Route::get('/news', [NewsController::class, 'index']);
Route::get('/news/{id}', [NewsController::class, 'show']);

// Nhóm Public Promotions
Route::prefix('promotions')->group(function () {
    Route::get('/', [PromotionController::class, 'index']);
    Route::get('/products', [PromotionController::class, 'getProducts']);
    // THÊM DÒNG NÀY VÀO ĐÂY ĐỂ REACT GỌI ĐƯỢC DANH SÁCH HẠNG
    Route::get('/membership-tiers', [PromotionController::class, 'getMembershipTiers']);
});

/** * ROUTE FIX LỖI 401: Lấy danh sách khách hàng để tặng voucher
 * Đưa ra ngoài middleware auth để React có thể gọi mà không cần gửi auth_token ngay lập tức.
 */
Route::get('/admin/users-for-assignment', [PromotionController::class, 'getUsersForAssignment']);

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register/init', [AuthController::class, 'registerInit']);
Route::post('/register/verify', [AuthController::class, 'registerVerify']);
Route::post('/vouchers/validate', [PromotionController::class, 'validateVoucher']);

Route::get('/categories', [CategoryController::class, 'index']);
// --- 1. XÁC THỰC (PUBLIC) ---
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register/init', [AuthController::class, 'registerInit']);
Route::post('/register/verify', [AuthController::class, 'registerVerify']);
Route::post('/vouchers/validate', [PromotionController::class, 'validateVoucher']);
// --- 2. PUBLIC ROUTES (XEM SẢN PHẨM/DANH MỤC KHÔNG CẦN LOGIN) ---
Route::get('/categories', [CategoryController::class, 'index']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register/init', [AuthController::class, 'registerInit']);
Route::post('/register/verify', [AuthController::class, 'registerVerify']);

// Tin tức
Route::get('/news', [NewsController::class, 'index']);
Route::get('/news/{id}', [NewsController::class, 'show']);

// Nhóm Public Promotions & Vouchers
Route::get('/vouchers/validate', [PromotionController::class, 'validateVoucher']);
Route::prefix('promotions')->group(function () {
    Route::get('/', [PromotionController::class, 'index']);
    Route::get('/products', [PromotionController::class, 'getProducts']);
    Route::get('/membership-tiers', [PromotionController::class, 'getMembershipTiers']);
});

// Sản phẩm & Danh mục
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{id}', [CategoryController::class, 'show']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/search', [ProductController::class, 'search']);
Route::get('/products/{id}', [ProductController::class, 'show']);

// Xem đánh giá sản phẩm (Công khai)
Route::get('/products/{id}/reviews', [ReviewController::class, 'index']);

// Tặng voucher (Để ngoài auth cho React gọi danh sách khách hàng nếu cần)
Route::get('/admin/users-for-assignment', [PromotionController::class, 'getUsersForAssignment']);


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
    Route::get('/all-invoices', [HoadonController::class, 'index']); // Cho Admin
    Route::get('/get_invoices', [HoadonController::class, 'index']);
    Route::post('/create_invoice', [HoadonController::class, 'store']); // Cho User đặt hàng
    Route::get('/my-invoices', [HoadonController::class, 'getMyInvoices']); // Lịch sử mua hàng
    Route::post('/update_order_status', [HoadonController::class, 'updateStatus']);
    Route::post('/cancel_order', [HoadonController::class, 'cancelOrder']);

    // --- QUẢN LÝ VẬN CHUYỂN ---
    Route::get('/get_shipping', [ShippingController::class, 'index']);
    Route::post('/update_shipping', [ShippingController::class, 'update']);

    // --- HỆ THỐNG ĐÁNH GIÁ (CẦN AUTH) ---
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);
    Route::get('/all-reviews-admin', [ReviewController::class, 'getAllReviewsForAdmin']);
    Route::post('/reviews/{id}/reply', [ReviewController::class, 'reply']);

    // --- QUẢN LÝ SẢN PHẨM & DANH MỤC (ADMIN) ---
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::post('/products/{id}/add-stock', [ProductController::class, 'addStock']);

    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::patch('/categories/{id}/status', [CategoryController::class, 'updateStatus']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // --- QUẢN LÝ NGƯỜI DÙNG (ADMIN) ---
    Route::get('/users', [UserController::class, 'index']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::put('/users/{id}/change-role', [UserController::class, 'changeRole']);
    Route::put('/users/{id}/change-password', [UserController::class, 'changePassword']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::get('/admin/logs', [UserController::class, 'getActivityLogs']);
    Route::delete('/admin/logs/cleanup', [UserController::class, 'deleteOldLogs']);

    // --- QUẢN LÝ HÓA ĐƠN (INVOICES) ---
    Route::get('/all-invoices', [HoadonController::class, 'index']);
    Route::get('/get_invoices', [HoadonController::class, 'index']);
    Route::post('/update_order_status', [HoadonController::class, 'update']);

    // Route cho khách hàng
    Route::post('/create_invoice', [HoadonController::class, 'store']);
    Route::get('/my-invoices', [HoadonController::class, 'getMyInvoices']);
    Route::post('/cancel_order', [HoadonController::class, 'cancelOrder']);

    // --- QUẢN LÝ VẬN CHUYỂN (SHIPPING) ---
    Route::get('/get_shipping', [ShippingController::class, 'index']);

    // Route cập nhật trạng thái/chi tiết (khớp với handleSave/handleUpdateStatusQuick)
    Route::post('/update_shipping', [ShippingController::class, 'update']);

    // --- HỆ THỐNG ĐÁNH GIÁ (CẦN AUTH) ---
    Route::post('/reviews', [ReviewController::class, 'store']); // <-- THÊM DÒNG NÀY
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']); // <-- THÊM DÒNG NÀY
    Route::get('/all-reviews-admin', [ReviewController::class, 'getAllReviewsForAdmin']);
Route::post('/reviews/{id}/reply', [ReviewController::class, 'reply']);
    // --- THỐNG KÊ (DASHBOARD) ---
    Route::prefix('admin')->group(function () {
        Route::get('/revenue', [DoanhthuController::class, 'getRevenue']);
        Route::get('/inventory', [DoanhthuController::class, 'getInventory']);
        Route::get('/top-products', [DoanhthuController::class, 'getTopProducts']);
        Route::post('/update-stock', [DoanhthuController::class, 'updateStock']);

        // Route xử lý việc tặng voucher vẫn giữ trong đây để bảo mật (chặn spam)
        Route::post('/assign-voucher', [PromotionController::class, 'assignVoucher']);
    });

    // Thông báo
    Route::get('/notifications', function () {
        return response()->json(['status' => 'success', 'data' => []]);
    });
});
