<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use App\Models\ActivityLog;

class UserController extends Controller
{
    /**
     * Lấy danh sách người dùng + Tìm kiếm + Lọc theo Tab
     */
    public function index(Request $request)
    {
        $query = User::query();

        // 1. Lọc theo Role - Khớp với logic React gửi lên
        if ($request->filled('role')) {
            $tab = strtolower($request->role);
            
            if ($tab === 'customer') {
                $query->where(function($q) {
                    $q->whereIn('role', ['customer', 'Customer', ''])
                      ->orWhereNull('role');
                });
            } else if ($tab === 'admin') {
                $query->whereIn('role', ['admin', 'Admin']);
            }
        }

        // 2. Tìm kiếm theo tên hoặc email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }

        // 3. Trình bày dữ liệu trả về cho React (Bao gồm chi tiêu và hạng)
        $users = $query->latest()->get()->map(function($user) {
            return [
                'id' => 'UID-' . $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? 'Chưa có',
                'role' => strtolower($user->role ?? 'customer'),
                'status' => $user->status ?? 'Active',
                'total_spent' => (float)($user->total_spent ?? 0), // Thêm để React hiển thị
                'membership_tier_id' => $user->membership_tier_id, // Thêm để hiển thị nhãn hạng
                'joined' => $user->created_at ? $user->created_at->format('Y-m-d') : '2024-01-01',
            ];
        });

        return response()->json($users);
    }

    /**
     * Xem chi tiết 1 user
     */
    public function show($id)
    {
        $cleanId = str_replace('UID-', '', $id);
        $user = User::findOrFail($cleanId);
        
        // Trả về kèm tiền chi tiêu để Admin nắm thông tin
        return response()->json([
            'id' => 'UID-' . $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'total_spent' => $user->total_spent,
            'membership_tier_id' => $user->membership_tier_id
        ]);
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

    /**
     * Lấy lịch sử hoạt động (Dành cho Admin)
     */
    public function getActivityLogs(Request $request)
    {
        // Kiểm tra quyền Admin (Sử dụng strtolower để tránh lỗi viết hoa viết thường)
        if (strtolower(auth()->user()->role) !== 'admin') { 
            return response()->json(['message' => 'Bạn không có quyền truy cập'], 403);
        }

        $logs = ActivityLog::orderBy('created_at', 'desc')->paginate(20);
        
        return response()->json([
            'status' => 'success',
            'data' => $logs->items(),
            'total' => $logs->total()
        ]);
    }

    /**
     * Xóa log cũ trên 30 ngày
     */
    public function deleteOldLogs()
    {
        if (strtolower(auth()->user()->role) !== 'admin') {
            return response()->json(['message' => 'Không có quyền'], 403);
        }

        $deletedCount = ActivityLog::where('created_at', '<', now()->subDays(30))->delete();

        return response()->json([
            'status' => 'success',
            'message' => "Đã dọn dẹp xong $deletedCount dòng log cũ."
        ]);
    }
}