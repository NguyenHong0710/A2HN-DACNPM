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
     * Chỉ tính doanh thu cho các đơn hàng "Đã giao"
     */
    public function getRevenue(Request $request)
    {
        try {
            $filter = $request->query('filter', 'Tháng');
            $now = Carbon::now();

<<<<<<< HEAD
            // 1. STATS - CHỈ LẤY ĐƠN HÀNG "ĐÃ GIAO" ĐỂ TÍNH TIỀN
            $deliveredOrders = Hoadon::where('deliveryStatus', 'Đã giao')->get();
            
            $totalGrossRevenue = (float)$deliveredOrders->sum('amount'); 
            $platformFee = $totalGrossRevenue * 0.08; // Phí sàn 8%
            $netRevenue = $totalGrossRevenue - $platformFee;
            
            // Đếm đơn hàng đang chờ xử lý (Chờ lấy hàng)
=======
            // 1. STATS - Lọc các hóa đơn không bị hủy (Khớp với deliveryStatus tiếng Việt của bạn)
            $validOrders = Hoadon::where('deliveryStatus', '!=', 'Đã hủy')->get();

            $totalGrossRevenue = (float)$validOrders->sum('amount');
            $platformFee = $totalGrossRevenue * 0.08;
            $netRevenue = $totalGrossRevenue - $platformFee;

            // Đếm đơn hàng đang chờ (Khớp với giá trị 'Chờ lấy hàng' mặc định)
>>>>>>> 068dc82 (feat: update dashboard)
            $pendingCount = Hoadon::where('deliveryStatus', 'Chờ lấy hàng')->count();

            // 2. CHART DATA (Dữ liệu biểu đồ linh hoạt)
            $labels = [];
            $chartData = [];

            if ($filter === 'Năm') {
                // Lấy dữ liệu 5 năm gần nhất
                for ($i = 4; $i >= 0; $i--) {
                    $year = $now->copy()->subYears($i)->year;
                    $labels[] = "Năm " . $year;
                    $total = Hoadon::where('deliveryStatus', 'Đã giao')
                                    ->whereYear('created_at', $year)
                                    ->sum('amount');
                    $chartData[] = (float)$total;
                }
            } 
            elseif ($filter === 'Tháng') {
                // Lấy 12 tháng trong năm hiện tại
                $labels = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
                $chartData = array_fill(0, 12, 0);
                $data = Hoadon::where('deliveryStatus', 'Đã giao')
                    ->whereYear('created_at', $now->year)
                    ->selectRaw('MONTH(created_at) as time, SUM(amount) as total')
                    ->groupBy('time')->pluck('total', 'time');
                foreach ($data as $time => $total) { $chartData[$time - 1] = (float)$total; }
<<<<<<< HEAD
            } 
            else { 
                // Mặc định: Lấy 30 ngày gần nhất (Filter Ngày)
                for ($i = 29; $i >= 0; $i--) {
                    $date = $now->copy()->subDays($i);
                    $labels[] = $date->format('d/m');
                    $total = Hoadon::where('deliveryStatus', 'Đã giao')
                                    ->whereDate('created_at', $date->format('Y-m-d'))
                                    ->sum('amount');
                    $chartData[] = (float)$total;
                }
            }

            // 3. RECENT ORDERS
            $recentOrders = Hoadon::with(['chiTiet'])
    ->where('deliveryStatus', 'Đã giao') // Chỉ lấy những đơn đã giao thành công
    ->orderBy('created_at', 'desc')
    ->take(10)
    ->get()
=======
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

            // 3. ĐƠN HÀNG GẦN ĐÂY
            $recentOrders = Hoadon::with(['chiTiet.product'])
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get()
>>>>>>> 068dc82 (feat: update dashboard)
                ->map(function ($order) {
                    return [
                        'id' => $order->id,
                        'date' => $order->created_at->format('d/m/Y H:i'),
                        'customer' => $order->customer,
                        'amount' => (float)$order->amount,
                        'status' => $order->deliveryStatus,
                        'items' => $order->chiTiet->map(function ($item) {
                            return [
                                'name' => $item->product ? $item->product->name : ($item->name ?? 'Sản phẩm đã xóa'),
                                'quantity' => (int)($item->qty ?? 1),
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

    /**
     * Lấy danh sách sản phẩm bán chạy - Chỉ tính từ đơn "Đã giao"
     */
    public function getTopProducts()
    {
        try {
            $topProducts = DB::table('chi_tiet_hoadons')
                ->join('hoadons', 'hoadons.id', '=', 'chi_tiet_hoadons.hoadon_id')
                ->where('hoadons.deliveryStatus', 'Đã giao')
                ->select(
                    'chi_tiet_hoadons.name',
                    DB::raw('SUM(chi_tiet_hoadons.qty) as total_sold'),
                    DB::raw('SUM(chi_tiet_hoadons.qty * chi_tiet_hoadons.price) as total_revenue')
                )
                ->groupBy('chi_tiet_hoadons.name')
                ->orderByDesc('total_sold')
                ->take(5)
                ->get();

            return response()->json([
                'status' => 'success', 
                'data' => $topProducts
            ]);

        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * CẬP NHẬT: Lấy danh sách tồn kho kèm số lượng đã bán thực tế
     */
    public function getInventory()
    {
        try {
            // Lấy toàn bộ sản phẩm
            $products = Product::select('id', 'name', 'stock')->get();

            $data = $products->map(function($product) {
                // Tính tổng số lượng đã bán từ các hóa đơn "Đã giao"
                $soldCount = DB::table('chi_tiet_hoadons')
                    ->join('hoadons', 'hoadons.id', '=', 'chi_tiet_hoadons.hoadon_id')
                    ->where('chi_tiet_hoadons.name', $product->name) // Khớp theo tên sản phẩm
                    ->where('hoadons.deliveryStatus', 'Đã giao')
                    ->sum('chi_tiet_hoadons.qty');

                return [
                    'id'    => $product->id,
                    'name'  => $product->name,
                    'stock' => (int)$product->stock,  // Số lượng còn lại trong kho
                    'sold'  => (int)$soldCount        // Số lượng đã bán thành công
                ];
            })->sortBy('stock')->values(); // Sắp xếp theo hàng sắp hết trước

            return response()->json([
                'status' => 'success',
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

<<<<<<< HEAD
=======
    public function getTopProducts()
{
    try {
        $topProducts = DB::table('chi_tiet_hoadons')
            ->join('hoadons', 'hoadons.id', '=', 'chi_tiet_hoadons.hoadon_id')
            ->where('hoadons.deliveryStatus', '!=', 'Đã hủy')
            ->select(
                'chi_tiet_hoadons.name', // Lấy tên trực tiếp từ bảng chi tiết
                DB::raw('SUM(chi_tiet_hoadons.qty) as total_sold'),
                DB::raw('SUM(chi_tiet_hoadons.qty * chi_tiet_hoadons.price) as total_revenue')
            )
            ->groupBy('chi_tiet_hoadons.name') // Nhóm theo tên sản phẩm
            ->orderByDesc('total_sold')
            ->take(5)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $topProducts
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Lỗi: ' . $e->getMessage()
        ], 500);
    }
}

>>>>>>> 068dc82 (feat: update dashboard)
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
