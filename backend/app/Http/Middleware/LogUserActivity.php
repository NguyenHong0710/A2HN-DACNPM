<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\ActivityLog;
use App\Models\Product; // Import để lấy thông tin sản phẩm
use Illuminate\Support\Facades\Auth;

class LogUserActivity
{
    public function handle($request, Closure $next)
    {
        $response = $next($request);

        // Chỉ log khi request thành công (status 2xx)
        if ($response->status() >= 200 && $response->status() < 300) {
            $user = Auth::user();
            $actionInfo = $this->parseAction($request);

            ActivityLog::create([
                'user_id'     => $user ? $user->id : null,
                'user_name'   => $user ? $user->name : 'Khách vãng lai',
                'action'      => $actionInfo['action'],
                'target_name' => $actionInfo['target_name'],
                'method'      => $request->method(),
                'url'         => $request->path(),
                'ip_address'  => $request->ip(),
                'user_agent'  => $request->header('User-Agent'),
            ]);
        }

        return $response;
    }

    private function parseAction($request)
    {
        $action = "Truy cập hệ thống";
        $targetName = null;

        // 1. Log xem sản phẩm (Dựa trên route chi tiết sản phẩm)
        if ($request->is('api/products/*') && $request->isMethod('get')) {
            $id = $request->segment(3); // Lấy ID từ URL api/products/{id}
            $product = Product::find($id);
            if ($product) {
                $action = "Xem chi tiết sản phẩm";
                $targetName = $product->name; // Lấy từ cột 'name' bạn chụp trong bảng products
            }
        }

        // 2. Log tìm kiếm
        if ($request->is('api/products/search')) {
            $action = "Tìm kiếm sản phẩm";
            $targetName = "Từ khóa: " . $request->query('q');
        }

        // 3. Log đặt hàng (Dựa trên bảng chi_tiet_hoadons của bạn)
        if ($request->is('api/orders') && $request->isMethod('post')) {
            $action = "Thực hiện đặt hàng";
        }

        return ['action' => $action, 'target_name' => $targetName];
    }
}