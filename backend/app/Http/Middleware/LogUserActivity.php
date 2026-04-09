<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\ActivityLog;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;

class LogUserActivity
{
    public function handle($request, Closure $next)
    {
        $response = $next($request);

        // CHỈ LOG KHI ĐÃ ĐĂNG NHẬP VÀ TRẠNG THÁI THÀNH CÔNG
        if (Auth::check() && $response->status() >= 200 && $response->status() < 300) {
            
            $user = Auth::user();
            $actionInfo = $this->parseAction($request);

            ActivityLog::create([
                'user_id'     => $user->id,
                'user_name'   => $user->name,
                'action'      => $actionInfo['action'],
                // Luôn ưu tiên lưu Email của User vào đây để Frontend hiển thị
                'target_name' => $user->email, 
                'method'      => $request->method(),
                'url'         => $request->path(),
                'ip_address'  => $request->ip(),
                'user_agent'  => $request->header('User-Agent'),
            ]);
        }

        return $response;
    }
    public function cleanup()
{
    try {
        // Cách 1: Xóa sạch bảng và reset ID về 1 (Khuyên dùng nếu muốn xóa hết)
        \App\Models\ActivityLog::truncate();

        // Cách 2: Nếu truncate bị lỗi do khóa ngoại, dùng:
        // \App\Models\ActivityLog::query()->delete();

        return response()->json([
            'message' => 'Toàn bộ nhật ký hệ thống đã được xóa sạch!'
        ], 200);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Lỗi khi xóa nhật ký: ' . $e->getMessage()
        ], 500);
    }
}
    private function parseAction($request)
    {
        $action = "Truy cập hệ thống";

        if ($request->is('api/products/*') && $request->isMethod('get')) {
            $id = $request->segment(3); 
            $product = Product::find($id);
            if ($product) $action = "Xem sản phẩm: " . $product->name;
        }

        if ($request->is('api/products/search')) {
            $action = "Tìm kiếm: " . $request->query('q');
        }

        if ($request->is('api/orders') && $request->isMethod('post')) {
            $action = "Thực hiện đặt hàng";
        }

        return ['action' => $action];
    }
}