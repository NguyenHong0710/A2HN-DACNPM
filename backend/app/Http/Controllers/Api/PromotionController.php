<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Models\Promotion;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class PromotionController extends Controller
{
    /**
     * 1. Lấy danh sách Voucher (Admin xem hết, Khách xem theo hạng & đích danh)
     */
    public function index(Request $request)
    {
        $admin_id = $request->query('admin_id', 1);
        $userId = $request->query('user_id'); 
        
        $is_admin_request = $request->has('is_admin_view') || !$request->has('user_id');

        $query = Promotion::with(['users:id,name,email'])
            ->leftJoin('products', 'promotions.product_id', '=', 'products.id')
            ->where('promotions.admin_id', $admin_id)
            ->select('promotions.*', 'products.name as product_name')
            ->orderBy('promotions.id', 'desc');

        if (!$is_admin_request) {
            $currentUser = User::find($userId);
            
            // Lọc: Chỉ hiện Voucher còn lượt dùng và đang kích hoạt
            $query->where('promotions.status', 1)
                  ->where('promotions.usage_limit', '>', 0)
                  ->where(function($q) use ($userId) {
                      $q->whereDoesntHave('users') // Voucher công khai
                        ->orWhereHas('users', function($subQuery) use ($userId) {
                            $subQuery->where('users.id', $userId); // Voucher tặng riêng
                        });
                  });
        }

        $promotions = $query->get();

        if (!$is_admin_request && isset($currentUser)) {
            $userTierId = $currentUser->membership_tier_id ?? 1;
            $promotions = $promotions->map(function($item) use ($userTierId) {
                $minTierRequired = $item->min_tier_id ?? 1;
                // Khóa voucher nếu khách chưa đủ hạng
                $item->is_locked = ($userTierId < $minTierRequired); 
                return $item;
            });
        }

        return response()->json($promotions);
    }

    /**
     * 2. Các hàm hỗ trợ lấy danh mục cho Admin
     */
    public function getMembershipTiers()
    {
        return response()->json(DB::table('membership_tiers')->select('id', 'name', 'min_spend')->get());
    }

    public function getProducts(Request $request)
    {
        $admin_id = $request->query('admin_id', 1);
        return response()->json(DB::table('products')->where('admin_id', $admin_id)->select('id', 'name', 'price')->get());
    }

    /**
     * 3. CRUD Voucher
     */
    public function store(Request $request)
    {
        try {
            $promotion = Promotion::create([
                'admin_id'    => $request->admin_id,
                'code'        => $request->code,
                'name'        => $request->name,
                'type'        => $request->type,
                'value'       => $request->value,
                'scope'       => $request->scope,
                'product_id'  => $request->productId ?: null,
                'start_date'  => $request->startDate ?: null,
                'end_date'    => $request->endDate ?: null,
                'usage_limit' => $request->limit ?: 100,
                'min_tier_id' => $request->min_tier_id ?: 1,
                'status'      => 1
            ]);
            return response()->json(['status' => 'success', 'data' => $promotion]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request)
    {
        try {
            $promotion = Promotion::findOrFail($request->id);
            $promotion->update([
                'code'        => $request->code,
                'name'        => $request->name,
                'type'        => $request->type,
                'value'       => $request->value,
                'scope'       => $request->scope,
                'product_id'  => $request->productId ?: null,
                'start_date'  => $request->startDate ?: null,
                'end_date'    => $request->endDate ?: null,
                'usage_limit' => $request->limit ?: 100,
                'min_tier_id' => $request->min_tier_id ?: 1,
            ]);
            return response()->json(['status' => 'success', 'data' => $promotion]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request)
    {
        Promotion::destroy($request->query('id'));
        return response()->json(['status' => 'success']);
    }

    public function toggleStatus(Request $request)
    {
        $promotion = Promotion::findOrFail($request->id);
        $promotion->status = $request->status;
        $promotion->save();
        return response()->json(['status' => 'success']);
    }

    /**
     * 4. Kiểm tra Voucher khi thanh toán (Đã thêm kiểm tra số lượng)
     */
    public function validateVoucher(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'items' => 'required|array',
            'user_id' => 'nullable|integer',
        ]);

        $code = $request->input('code');
        $items = $request->input('items');
        $userId = $request->input('user_id');

        $voucher = Promotion::where('code', $code)->where('status', 1)->first();

        if (!$voucher) {
            return response()->json(['message' => 'Mã không tồn tại hoặc đã bị tắt.'], 404);
        }

        // KIỂM TRA SỐ LƯỢNG CÒN LẠI
        if ($voucher->usage_limit <= 0) {
            return response()->json(['message' => 'Mã giảm giá này đã hết lượt sử dụng.'], 400);
        }

        // KIỂM TRA HẠNG THÀNH VIÊN
        if ($userId) {
            $user = User::find($userId);
            if ($user && $user->membership_tier_id < ($voucher->min_tier_id ?? 1)) {
                return response()->json(['message' => 'Hạng thành viên của bạn chưa đủ để dùng mã này.'], 403);
            }
        }

        // KIỂM TRA TẶNG ĐÍCH DANH
        $isAssigned = DB::table('promotion_user')->where('promotion_id', $voucher->id)->exists();
        if ($isAssigned) {
            if (!$userId) {
                return response()->json(['message' => 'Bạn cần đăng nhập để dùng mã này.'], 401);
            }
            $hasVoucher = DB::table('promotion_user')
                ->where('promotion_id', $voucher->id)
                ->where('user_id', $userId)
                ->exists();

            if (!$hasVoucher) {
                return response()->json(['message' => 'Mã này không dành cho tài khoản của bạn.'], 403);
            }
        }

        // TÍNH TOÁN SỐ TIỀN GIẢM
        $discountAmount = 0;
        if ($voucher->scope === 'product') {
            $targetItem = collect($items)->firstWhere('product_id', $voucher->product_id);
            if (!$targetItem) {
                return response()->json(['message' => 'Mã không áp dụng cho sản phẩm trong giỏ hàng.'], 400);
            }
            $itemTotal = $targetItem['price'] * $targetItem['qty'];
            $discountAmount = ($voucher->type === 'percent') ? ($itemTotal * $voucher->value) / 100 : $voucher->value;
        } else {
            $orderTotal = collect($items)->sum(fn($item) => $item['price'] * $item['qty']);
            $discountAmount = ($voucher->type === 'percent') ? ($orderTotal * $voucher->value) / 100 : $voucher->value;
        }

        return response()->json([
            'code' => $voucher->code,
            'discount_amount' => (int)$discountAmount,
            'message' => 'Áp dụng mã thành công'
        ], 200);
    }

    /**
     * 5. TRỪ SỐ LƯỢNG VOUCHER (Gọi hàm này khi đơn hàng tạo thành công)
     */
    public function useVoucher($code) 
    {
        $voucher = Promotion::where('code', $code)->first();
        if ($voucher && $voucher->usage_limit > 0) {
            $voucher->decrement('usage_limit');
            return true;
        }
        return false;
    }

    /**
     * 6. Lấy danh sách khách hàng để tặng
     */
    public function getUsersForAssignment(Request $request)
    {
        $users = User::where('role', 'customer')
            ->leftJoin('membership_tiers', 'users.membership_tier_id', '=', 'membership_tiers.id')
            ->select('users.id', 'users.name', 'users.email', 'membership_tiers.name as tier_name')
            ->get();
        return response()->json($users);
    }

    /**
     * 7. THỰC HIỆN PHÂN BỔ VOUCHER (Đã sửa dùng sync để không cộng dồn)
     */
    public function assignVoucher(Request $request) 
    {
        $promotionId = $request->promotion_id;
        $promotion = Promotion::findOrFail($promotionId);

        // Trường hợp 1: Tặng cho toàn bộ (Chuyển về Voucher công khai)
        if ($request->send_to_all) {
            $promotion->users()->detach(); 
            return response()->json(['status' => 'success', 'message' => 'Voucher đã được chuyển thành công khai!']);
        }

        // Trường hợp 2: Tặng theo Hạng thành viên
        if ($request->has('tier_id') && $request->tier_id != null) {
            $userIds = User::where('membership_tier_id', $request->tier_id)->pluck('id')->toArray();

            if (empty($userIds)) {
                return response()->json(['status' => 'error', 'message' => 'Không có khách hàng thuộc hạng này.'], 404);
            }

            // sync() sẽ thay thế danh sách cũ bằng danh sách mới hoàn toàn
            $promotion->users()->sync($userIds);

            return response()->json(['status' => 'success', 'message' => 'Đã cập nhật voucher cho hạng được chọn!']);
        }

        // Trường hợp 3: Tặng cho danh sách cá nhân được chọn
        $userIds = $request->user_ids ?: []; 
        $promotion->users()->sync($userIds);

        return response()->json(['status' => 'success', 'message' => 'Cập nhật danh sách tặng thành công!']);
    }
}