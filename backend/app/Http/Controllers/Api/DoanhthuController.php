<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Hoadon; 
use App\Models\Product;
use App\Models\ChiTietHoadon;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DoanhthuController extends Controller
{
    /**
     * API: Lấy thống kê doanh thu, biểu đồ và danh sách đơn hàng
     * Link: http://localhost:8000/api/admin/revenue?filter=Tháng
     */
    public function getRevenue(Request $request)
    {
        try {
            $filter = $request->query('filter', 'Tháng');
            $now = Carbon::now();

            // 1. STATS - Lọc các hóa đơn không bị hủy (Khớp với deliveryStatus tiếng Việt của bạn)
            $validOrders = Hoadon::where('deliveryStatus', '!=', 'Đã hủy')->get();
            
            $totalGrossRevenue = (float)$validOrders->sum('amount'); 
            $platformFee = $totalGrossRevenue * 0.08; 
            $netRevenue = $totalGrossRevenue - $platformFee;
            
            // Đếm đơn hàng đang chờ (Khớp với giá trị 'Chờ lấy hàng' mặc định)
            $pendingCount = Hoadon::where('deliveryStatus', 'Chờ lấy hàng')->count();

            // 2. CHART DATA
            $labels = [];
            $chartData = [];

            if ($filter === 'Năm') {
                $labels = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
                $chartData = array_fill(0, 12, 0);
                $data = Hoadon::where('deliveryStatus', '!=', 'Đã hủy')
                    ->whereYear('created_at', $now->year)
                    ->selectRaw('MONTH(created_at) as time, SUM(amount) as total')
                    ->groupBy('time')->pluck('total', 'time');
                foreach ($data as $time => $total) { $chartData[$time - 1] = (float)$total; }
            } 
            elseif ($filter === 'Tháng') {
                $daysInMonth = $now->daysInMonth;
                for ($i = 1; $i <= $daysInMonth; $i++) { $labels[] = "Ngày $i"; }
                $chartData = array_fill(0, $daysInMonth, 0);
                $data = Hoadon::where('deliveryStatus', '!=', 'Đã hủy')
                    ->whereMonth('created_at', $now->month)
                    ->whereYear('created_at', $now->year)
                    ->selectRaw('DAY(created_at) as time, SUM(amount) as total')
                    ->groupBy('time')->pluck('total', 'time');
                foreach ($data as $time => $total) { $chartData[$time - 1] = (float)$total; }
            } 
            else { // Tuần
                $labels = ['T2','T3','T4','T5','T6','T7','CN'];
                $chartData = array_fill(0, 7, 0);
                $data = Hoadon::where('deliveryStatus', '!=', 'Đã hủy')
                    ->whereBetween('created_at', [$now->startOfWeek(), $now->endOfWeek()])
                    ->selectRaw('DAYOFWEEK(created_at) as time, SUM(amount) as total')
                    ->groupBy('time')->pluck('total', 'time');
                foreach ($data as $time => $total) {
                    $index = ($time == 1) ? 6 : $time - 2;
                    if(isset($chartData[$index])) $chartData[$index] = (float)$total;
                }
            }

            // 3. RECENT ORDERS
            $recentOrders = Hoadon::with(['chiTiet.product']) 
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get()
                ->map(function ($order) {
                    return [
                        'id' => $order->id,
                        'date' => $order->created_at->format('d/m/Y H:i'),
                        'customer' => $order->customer,
                        'amount' => (float)$order->amount,
                        'status' => $order->deliveryStatus,
                        'items' => $order->chiTiet->map(function ($item) {
                            return [
                                'name' => $item->product ? $item->product->name : 'Sản phẩm đã xóa',
                                'quantity' => (int)($item->quantity ?? 1),
                                'price' => (float)$item->price
                            ];
                        })
                    ];
                });

            return response()->json([
                'status' => 'success',
                'stats' => [
                    'total_gross' => $totalGrossRevenue,
                    'net_revenue' => $netRevenue,
                    'platform_fee' => $platformFee,
                    'pending_count' => $pendingCount
                ],
                'labels' => $labels,
                'chart_data' => $chartData,
                'orders' => $recentOrders
            ]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function getInventory()
    {
        $inventory = Product::select('id', 'name', 'stock')->orderBy('stock', 'asc')->get();
        return response()->json(['status' => 'success', 'data' => $inventory]);
    }

    public function getTopProducts()
    {
        $topProducts = Product::join('chi_tiet_hoadons', 'products.id', '=', 'chi_tiet_hoadons.product_id')
            ->join('hoadons', 'hoadons.id', '=', 'chi_tiet_hoadons.hoadon_id')
            ->where('hoadons.deliveryStatus', '!=', 'Đã hủy')
            ->select('products.name', DB::raw('SUM(chi_tiet_hoadons.quantity) as sold'), DB::raw('SUM(chi_tiet_hoadons.quantity * chi_tiet_hoadons.price) as revenue'))
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('sold')->take(5)->get();

        return response()->json(['status' => 'success', 'data' => $topProducts]);
    }

    public function updateStock(Request $request)
    {
        $request->validate(['product_id' => 'required', 'quantity_added' => 'required|integer|min:1']);
        $product = Product::find($request->product_id);
        if (!$product) return response()->json(['status' => 'error', 'message' => 'Sản phẩm không tồn tại'], 404);
        $product->stock += $request->quantity_added;
        $product->save();
        return response()->json(['status' => 'success', 'message' => 'Cập nhật kho thành công', 'new_stock' => $product->stock]);
    }
}