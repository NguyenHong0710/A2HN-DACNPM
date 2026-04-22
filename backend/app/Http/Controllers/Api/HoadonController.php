<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hoadon;
use App\Models\ChiTietHoadon;
use App\Models\Product;
use App\Models\Shipping;
use App\Http\Controllers\Api\PromotionController; // Import để gọi logic trừ voucher
use Illuminate\Http\Request;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class HoadonController extends Controller
{
    /**
     * TẠO ĐƠN HÀNG MỚI (Đã tích hợp trừ số lượng Voucher)
     */
    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['status' => 'error', 'message' => 'Vui lòng đăng nhập để đặt hàng'], 401);
            }

            // 1. Tính toán số tiền gốc từ giỏ hàng
            $calculatedAmount = 0;
            if ($request->has('items') && is_array($request->items)) {
                foreach ($request->items as $item) {
                    $price = $item['price'] ?? 0;
                    $qty = $item['qty'] ?? ($item['quantity'] ?? 1);
                    $calculatedAmount += ($price * $qty);
                }
            } else {
                return response()->json(['status' => 'error', 'message' => 'Giỏ hàng trống'], 400);
            }

            // 2. Lấy số tiền thực tế sau khi áp mã (Client gửi lên trường 'amount' đã trừ)
            // Nếu Client không gửi, mặc định dùng số tiền tính toán được
            $finalAmount = $request->amount ?? $calculatedAmount;

            // 3. Tạo hóa đơn chính (Giữ đúng các cột hiện có trong DB của bạn)
            $hoadon = Hoadon::create([
                'user_id'         => $user->id,
                'customer'        => $request->fullName,
                'phone'           => $request->phone,
                'address'         => $request->address,
                'amount'          => $finalAmount,
                'payment_method'  => $request->payment_method,
                'deliveryStatus'  => 'pending',
                'amount'          => $calculatedAmount,
                'payment_method'  => $request->payment_method,

                'deliveryStatus'  => 'pending',
            ]);

            // Cập nhật thông tin nhanh cho User
            $user->update([
                'name'    => $request->fullName,
                'phone'   => $request->phone,
                'address' => $request->address,
            ]);

            // 4. Lưu chi tiết từng sản phẩm
            foreach ($request->items as $item) {
                $rawImage = $item['images'] ?? $item['image'] ?? $item['product_image'] ?? $item['thumb'] ?? null;
                $imagePath = is_array($rawImage) ? ($rawImage[0] ?? null) : $rawImage;

                $hoadon->chiTiet()->create([
                    'name'   => $item['name'] ?? 'Sản phẩm không tên',
                    'qty'    => $item['qty'] ?? ($item['quantity'] ?? 1),
                    'price'  => $item['price'] ?? 0,
                    'images' => $imagePath,
                ]);
            }

            // 5. QUAN TRỌNG: Trừ số lượng Voucher nếu có áp dụng mã
            if ($request->has('voucherCode') && !empty($request->voucherCode)) {
                $promoController = new PromotionController();
                $promoController->useVoucher($request->voucherCode);
            }

            DB::commit();
            return response()->json([
                'status' => 'success',
                'message' => 'Tuyệt tác của bạn đã được tiếp nhận!',
                'order_id' => $hoadon->id
            ], 201);

        } catch (Exception $e) {
            DB::rollBack();
            Log::error("Store Order Error: " . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Lỗi: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Lấy toàn bộ hóa đơn (Admin)
     */
    public function index()
    {
        try {
            $invoices = Hoadon::with('chiTiet')->orderBy('created_at', 'desc')->get();
            return response()->json([
                'status' => 'success',
                'data' => $this->formatInvoices($invoices)
            ]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Lấy hóa đơn cá nhân
     */
    public function getMyInvoices(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['status' => 'error', 'message' => 'Tài khoản chưa xác thực.'], 401);
            }

            $invoices = Hoadon::with('chiTiet')
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $this->formatInvoices($invoices)
            ]);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * CẬP NHẬT TRẠNG THÁI (Đã bao gồm trừ kho)
     */
    public function update(Request $request)
    {
        DB::beginTransaction();
        try {
            $hoadon = Hoadon::with('chiTiet')->find($request->id);
            if (!$hoadon) return response()->json(['status' => 'error', 'message' => 'Không tìm thấy hóa đơn'], 404);

            $oldStatus = $hoadon->deliveryStatus;
            $newStatus = $request->status;

            // 1. Logic trừ kho khi "Đã giao"
            if ($newStatus === 'Đã giao' && $oldStatus !== 'Đã giao') {
                foreach ($hoadon->chiTiet as $item) {
                    $product = Product::where('name', $item->name)->first();
                    if ($product) {
                        if ($product->stock < $item->qty) {
                            throw new Exception("Sản phẩm '{$product->name}' không đủ tồn kho.");
                        }
                        $product->decrement('stock', $item->qty);
                    }
                }
            }

            // 2. Cập nhật trạng thái
            $hoadon->update(['deliveryStatus' => $newStatus]);

            // 3. Cập nhật vận chuyển
            $shippingStatus = ($newStatus === 'Đã xác nhận') ? 'Chờ lấy hàng' : $newStatus;
            $shipping = Shipping::where('orderId', $hoadon->id)->first();

            if ($shipping) {
                $shipping->update(['status' => $shippingStatus]);
            } else {
                Shipping::create([
                    'id'            => 'SHIP-' . $hoadon->id . '-' . time(),
                    'orderId'       => $hoadon->id,
                    'customer'      => $hoadon->customer,
                    'phone'         => $hoadon->phone,
                    'address'       => $hoadon->address,
                    'status'        => $shippingStatus,
                    'method'        => 'Giao hàng tiêu chuẩn',
                    'estimatedTime' => now()->addDays(3),
                    'id'           => 'SHIP-' . $hoadon->id . '-' . time(),
                    'orderId'      => $hoadon->id,
                    'customer'     => $hoadon->customer,
                    'phone'        => $hoadon->phone,
                    'address'      => $hoadon->address,
                    'status'       => $request->status,
                    'product_id' => $hoadon->id,
                    'method'       => 'Giao hàng tiêu chuẩn',
                    'estimatedTime' => now()->addDays(3),
                ]);
            }

            DB::commit();
            return response()->json(['status' => 'success', 'message' => 'Cập nhật thành công!']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Hủy đơn hàng
     */
    public function cancelOrder(Request $request)
    {
        try {
            $user = $request->user();
            $order = Hoadon::where('id', $request->id)->where('user_id', $user->id)->first();
            if (!$order || $order->deliveryStatus !== 'pending') {
                return response()->json(['status' => 'error', 'message' => 'Không thể hủy'], 400);
            }
            $order->update(['deliveryStatus' => 'cancelled']);
            return response()->json(['status' => 'success', 'message' => 'Đã hủy thành công']);
        } catch (Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Format dữ liệu trả về
     */
    private function formatInvoices($invoices)
    {
        return $invoices->map(function ($inv) {
            return [
                'id' => $inv->id,
                'customer' => $inv->customer ?? 'Khách hàng Lumina',
                'date' => $inv->created_at ? $inv->created_at->format('d/m/Y H:i') : 'N/A',
                'amount' => (float)($inv->amount ?? 0),
                'payment_method' => $inv->payment_method ?? 'N/A',
                'deliveryStatus' => $inv->deliveryStatus ?? 'pending',
                'address' => $inv->address ?? 'N/A',
                'phone' => $inv->phone ?? 'N/A',
                'items' => $inv->chiTiet ? $inv->chiTiet->map(function ($item) {
                    return [
                        'name'  => $item->name,
                        'qty'   => $item->qty,
                        'price' => (float)$item->price,
                        'image' => $item->images,
                    ];
                }) : []
            ];
        });
    }
}
