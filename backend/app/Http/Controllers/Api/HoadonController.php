<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hoadon;
use App\Models\ChiTietHoadon;
use App\Models\Product; 
use App\Models\Shipping;
use Illuminate\Http\Request;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class HoadonController extends Controller
{
    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['status' => 'error', 'message' => 'Vui lòng đăng nhập để đặt hàng'], 401);
            }

            $calculatedAmount = 0;
            if ($request->has('items') && is_array($request->items)) {
                foreach ($request->items as $item) {
                    if (isset($item['id'])) {
                        $product = Product::find($item['id']);
                        if ($product && $product->stock < ($item['qty'] ?? 1)) {
                            return response()->json([
                                'status' => 'error', 
                                'message' => "Sản phẩm '{$product->name}' hiện không đủ số lượng trong kho!"
                            ], 400);
                        }
                    }
                    $price = $item['price'] ?? 0;
                    $qty = $item['qty'] ?? ($item['quantity'] ?? 1);
                    $calculatedAmount += ($price * $qty);
                }
            } else {
                return response()->json(['status' => 'error', 'message' => 'Giỏ hàng trống'], 400);
            }

            $hoadon = Hoadon::create([
                'user_id'         => $user->id,
                'customer'        => $request->fullName,
                'phone'           => $request->phone,
                'address'         => $request->address,
                'amount'          => $calculatedAmount,
                'payment_method'  => $request->payment_method,
                'deliveryStatus'  => 'pending',
            ]);

            $user->update([
                'name'    => $request->fullName,
                'phone'   => $request->phone,
                'address' => $request->address,
            ]);

            foreach ($request->items as $item) {
                $rawImage = $item['images'] ?? $item['image'] ?? $item['product_image'] ?? $item['thumb'] ?? null;
                $imagePath = is_array($rawImage) ? ($rawImage[0] ?? null) : $rawImage;

                $hoadon->chiTiet()->create([
                    'name'   => $item['name'] ?? 'Sản phẩm không tên',
                    'qty'    => $item['qty'] ?? ($item['quantity'] ?? 1),
                    'price'  => $item['price'] ?? 0,
                    'images' => $imagePath,
                ]);

                if (isset($item['id'])) {
                    $product = Product::find($item['id']);
                    if ($product) {
                        $product->decrement('stock', $item['qty'] ?? 1);
                    }
                }
            }

            DB::commit();
            return response()->json(['status' => 'success', 'message' => 'Đặt hàng thành công!', 'order_id' => $hoadon->id], 201);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error("Store Order Error: " . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Lỗi hệ thống'], 500);
        }
    }

    public function updateStatus(Request $request)
    {
        DB::beginTransaction();
        try {
            $hoadon = Hoadon::find($request->id);
            if (!$hoadon) return response()->json(['status' => 'error', 'message' => 'Không tìm thấy hóa đơn'], 404);

            $newStatus = $request->status ?? $request->deliveryStatus;
            if ($newStatus) {
                $hoadon->update(['deliveryStatus' => $newStatus]);
                $shipping = Shipping::where('orderId', $hoadon->id)->first();
                $shippingStatus = ($newStatus === 'Đã xác nhận') ? 'Chờ lấy hàng' : $newStatus;

                if (!$shipping) {
                    Shipping::create([
                        'id'            => 'SHIP-' . strtoupper(uniqid()),
                        'orderId'       => $hoadon->id,
                        'customer'      => $hoadon->customer ?? 'Khách hàng',
                        'phone'         => $hoadon->phone ?? 'N/A',
                        'address'       => $hoadon->address ?? 'N/A',
                        'method'        => 'Giao hàng tiêu chuẩn',
                        'status'        => $shippingStatus,
                        'estimatedTime' => now()->addDays(3),
                    ]);
                } else {
                    $shipping->update(['status' => $shippingStatus]);
                }
            }
            DB::commit();
            return response()->json(['status' => 'success', 'message' => 'Cập nhật thành công']);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function cancelOrder(Request $request)
    {
        DB::beginTransaction();
        try {
            $user = $request->user();
            $order = Hoadon::with('chiTiet')->where('id', $request->id)->where('user_id', $user->id)->first();
            if (!$order || $order->deliveryStatus !== 'pending') return response()->json(['status' => 'error', 'message' => 'Không thể hủy'], 400);

            foreach ($order->chiTiet as $item) {
                $product = Product::where('name', $item->name)->first();
                if ($product) $product->increment('stock', $item->qty);
            }
            $order->update(['deliveryStatus' => 'cancelled']);
            DB::commit();
            return response()->json(['status' => 'success', 'message' => 'Đã hủy đơn hàng']);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error'], 500);
        }
    }

    public function index()
    {
        $invoices = Hoadon::with('chiTiet')->orderBy('created_at', 'desc')->get();
        return response()->json(['status' => 'success', 'data' => $this->formatInvoices($invoices)]);
    }

    public function getMyInvoices(Request $request)
    {
        $user = $request->user();
        $invoices = Hoadon::with('chiTiet')->where('user_id', $user->id)->orderBy('created_at', 'desc')->get();
        return response()->json(['status' => 'success', 'data' => $this->formatInvoices($invoices)]);
    }

    private function formatInvoices($invoices)
    {
        return $invoices->map(function ($inv) {
            return [
                'id' => $inv->id,
                'customer' => $inv->customer ?? 'Khách hàng',
                'date' => $inv->created_at->format('d/m/Y H:i'),
                'amount' => (float)$inv->amount,
                'payment_method' => $inv->payment_method,
                'deliveryStatus' => $inv->deliveryStatus,
                'address' => $inv->address,
                'items' => $inv->chiTiet->map(function ($item) {
                    return ['name' => $item->name, 'qty' => $item->qty, 'price' => (float)$item->price, 'image' => $item->images];
                })
            ];
        });
    }
}