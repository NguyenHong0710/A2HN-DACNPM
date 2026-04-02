<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    /**
     * 1. LẤY THÔNG TIN TÀI KHOẢN
     */
    public function index(Request $request)
    {
        // Lấy user đang đăng nhập qua token
        $user = $request->user();

        return response()->json([
            'status' => 'success',
            'data' => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'phone'      => $user->phone ?? '',
                'address'    => $user->address ?? '',
                'bio'        => $user->bio ?? '',
                'avatar'     => $user->avatar_url, // Sử dụng helper avatar_url đã viết ở Model User
                'joinDate'   => $user->created_at,
            ]
        ]);
    }

    /**
     * 2. CẬP NHẬT THÔNG TIN (Họ tên, SĐT, Địa chỉ, Bio)
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name'    => 'sometimes|required|string|max:255',
            'phone'   => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'bio'     => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error', 
                'errors' => $validator->errors()
            ], 422);
        }

        // Cập nhật trực tiếp vào bảng users
        $user->update($request->only(['name', 'phone', 'address', 'bio']));

        return response()->json([
            'status'  => 'success',
            'message' => 'Cập nhật thông tin thành công!',
            'data'    => $user
        ]);
    }

    /**
     * 3. CẬP NHẬT AVATAR
     */
    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $user = $request->user();

        if ($request->hasFile('avatar')) {
            // Xóa ảnh cũ trong storage nếu có (tránh rác server)
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }
            
            // Lưu ảnh mới vào storage/app/public/avatars
            $path = $request->file('avatar')->store('avatars', 'public');
            
            // Lưu đường dẫn vào cột avatar của bảng users
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