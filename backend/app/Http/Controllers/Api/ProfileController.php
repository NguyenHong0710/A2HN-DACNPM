<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{
    /**
     * 1. LẤY THÔNG TIN TÀI KHOẢN + THÔNG TIN HẠNG THÀNH VIÊN
     */
    public function index(Request $request)
    {
        // Load quan hệ 'tier' để lấy tên hạng hiện tại
        $user = $request->user()->load('tier');
        
        $totalSpent = (float)($user->total_spent ?? 0);

        // Tìm hạng kế tiếp (Hạng có min_spend lớn hơn chi tiêu hiện tại và gần nhất)
        $nextTier = DB::table('membership_tiers')
            ->where('min_spend', '>', $totalSpent)
            ->orderBy('min_spend', 'asc')
            ->first();

        $amountMissing = 0;
        $progressPercentage = 100;

        if ($nextTier) {
            $amountMissing = $nextTier->min_spend - $totalSpent;
            // Tính % tiến trình đến hạng tiếp theo
            $currentTierMin = $user->tier ? $user->tier->min_spend : 0;
            $range = $nextTier->min_spend - $currentTierMin;
            $progress = $totalSpent - $currentTierMin;
            $progressPercentage = $range > 0 ? round(($progress / $range) * 100) : 0;
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'id'         => $user->id,
                'name'       => $user->name ?? '',
                'email'      => $user->email ?? '',
                'phone'      => $user->phone ?? '',
                'address'    => $user->address ?? '',
                'bio'        => $user->bio ?? '',
                'avatar'     => $user->avatar ? asset('storage/' . $user->avatar) : null, 
                'created_at' => $user->created_at,
                
                // --- THÔNG TIN HẠNG (Dành cho UI Progress Bar) ---
                'membership' => [
                    'current_tier'     => $user->tier ? $user->tier->name : 'Thành viên mới',
                    'total_spent'      => $totalSpent,
                    'next_tier'        => $nextTier ? $nextTier->name : null,
                    'amount_missing'   => $amountMissing > 0 ? $amountMissing : 0,
                    'progress_percent' => min(100, max(0, $progressPercentage)),
                    'message'          => $nextTier 
                                          ? "Mua thêm " . number_format($amountMissing) . "đ để lên hạng " . $nextTier->name 
                                          : "Bạn đã đạt hạng cao nhất!"
                ]
            ]
        ]);
    }

    /**
     * 2. CẬP NHẬT THÔNG TIN
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name'    => 'sometimes|required|string|max:255',
            'phone'   => ['nullable', 'string', 'regex:/^0[0-9]{9}$/'],
            'address' => 'nullable|string|max:255',
            'bio'     => 'nullable|string|max:500',
        ], [
            'phone.regex' => 'Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số.'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error', 
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 422);
        }

        $user->update($request->only(['name', 'phone', 'address', 'bio']));

        return response()->json([
            'status'  => 'success',
            'message' => 'Cập nhật thành công!',
            'data'    => $user
        ]);
    }

    /**
     * 3. CẬP NHẬT AVATAR
     */
    public function updateAvatar(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'File ảnh không hợp lệ (Dưới 2MB, định dạng jpg, png...)'
            ], 422);
        }

        $user = $request->user();

        if ($request->hasFile('avatar')) {
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }
            
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->update(['avatar' => $path]);

            return response()->json([
                'status'     => 'success',
                'message'    => 'Cập nhật ảnh đại diện thành công!',
                'avatar_url' => asset('storage/' . $path)
            ]);
        }

        return response()->json(['status' => 'error', 'message' => 'Không tìm thấy file ảnh'], 400);
    }
}