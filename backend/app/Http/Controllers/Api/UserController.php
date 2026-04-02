<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Lấy danh sách người dùng + Tìm kiếm + Lọc theo Tab
     */
    public function index(Request $request)
    {
        $query = User::query();

        // 1. Lọc theo Role (Xử lý không phân biệt hoa/thường)
        if ($request->filled('activeTab')) {
            $tab = strtolower($request->activeTab);
            
            if ($tab === 'customer') {
                $query->where(function($q) {
                    $q->where('role', 'customer')
                      ->orWhere('role', 'Customer')
                      ->orWhereNull('role')
                      ->orWhere('role', '');
                });
            } else {
                $query->where(function($q) {
                    $q->where('role', 'admin')
                      ->orWhere('role', 'Admin');
                });
            }
        }

        // 2. Tìm kiếm theo tên hoặc email
        if ($request->filled('searchTerm')) {
            $search = $request->searchTerm;
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }

        // 3. Trình bày dữ liệu trả về cho React
        $users = $query->latest()->get()->map(function($user) {
            return [
                'id' => 'UID-' . $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? 'Chưa có',
                'role' => strtolower($user->role ?? 'customer'), // Chuẩn hóa về chữ thường
                'status' => $user->status ?? 'Active',
                'joined' => $user->created_at ? $user->created_at->format('Y-m-d') : '2024-01-01',
            ];
        });

        return response()->json($users);
    }

    /**
     * Xem chi tiết 1 user (Phải có để khớp với route /{id} trong api.php)
     */
    public function show($id)
    {
        $cleanId = str_replace('UID-', '', $id);
        $user = User::findOrFail($cleanId);
        return response()->json($user);
    }

    /**
     * Cập nhật thông tin cơ bản
     */
    public function update(Request $request, $id)
    {
        $cleanId = str_replace('UID-', '', $id);
        $user = User::findOrFail($cleanId);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'phone' => 'nullable|string|max:15',
        ]);

        $user->update($request->only(['name', 'email', 'phone']));

        return response()->json([
            'status' => 'success',
            'message' => 'Cập nhật thông tin thành công!'
        ]);
    }

    /**
     * Đổi mật khẩu
     */
    public function changePassword(Request $request, $id)
    {
        $cleanId = str_replace('UID-', '', $id);
        $user = User::findOrFail($cleanId);

        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json(['message' => 'Đổi mật khẩu thành công!']);
    }

    /**
     * Đổi quyền hạn (Admin <-> Customer)
     */
    public function changeRole(Request $request, $id)
    {
        $cleanId = str_replace('UID-', '', $id);
        $user = User::findOrFail($cleanId);

        $user->update([
            'role' => $request->role
        ]);

        return response()->json(['message' => 'Thay đổi quyền hạn thành công!']);
    }

    /**
     * Xóa người dùng
     */
    public function destroy($id)
    {
        $cleanId = str_replace('UID-', '', $id);
        $user = User::findOrFail($cleanId);
        $user->delete();

        return response()->json(['message' => 'Đã xóa người dùng khỏi hệ thống!']);
    }
}