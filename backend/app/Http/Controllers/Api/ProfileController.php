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
        $user = $request->user();

        return response()->json([
            'status' => 'success',
            'data' => [
                'id'       => $user->id,
                'name'     => $user->name ?? '',
                'email'    => $user->email ?? '',
                'phone'    => $user->phone ?? '',
                'address'  => $user->address ?? '',
                'bio'      => $user->bio ?? '',
                // Ưu tiên dùng avatar_url, nếu không có thì trả về null để React dùng placeholder
                'avatar'   => $user->avatar ? asset('storage/' . $user->avatar) : null, 
                'created_at' => $user->created_at, // Để React dùng new Date()
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
        // Regex: bắt đầu bằng số 0, sau đó là 9 chữ số khác (tổng 10 số)
        'phone'   => ['nullable', 'string', 'regex:/^0[0-9]{9}$/'],
        'address' => 'nullable|string|max:255',
        'bio'     => 'nullable|string|max:500',
    ], [
        'phone.regex' => 'Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số.'
    ]);

    if ($validator->fails()) {
        return response()->json([
            'status' => 'error', 
            'message' => $validator->errors()->first(), // Lấy lỗi đầu tiên hiển thị cho user
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
            // 1. Xóa ảnh cũ nếu tồn tại trong disk 'public'
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }
            
            // 2. Lưu file mới với tên ngẫu nhiên vào thư mục avatars
            $path = $request->file('avatar')->store('avatars', 'public');
            
            // 3. Cập nhật đường dẫn vào database
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