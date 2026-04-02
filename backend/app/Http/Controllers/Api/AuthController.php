<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    // --- ĐĂNG NHẬP ---
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();
        
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email hoặc mật khẩu không chính xác.'
            ], 401);
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Xác thực hệ thống thất bại.'], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ]
        ], 200);
    }

    // --- ĐĂNG KÝ BƯỚC 1: GỬI OTP ---
    public function registerInit(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
        ]);

        $otp = rand(100000, 999999);
        $tempToken = Str::random(40);

        Cache::put('reg_token_' . $tempToken, [
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'otp' => $otp
        ], now()->addMinutes(10));

        try {
            // ĐÃ SỬA: Dùng Mail::send gọi file view 'emails.otp'
            Mail::send('emails.otp', ['otp' => $otp, 'title' => 'Xác Thực Đăng Ký Tài Khoản'], function ($message) use ($request) {
                $message->to($request->email)->subject('Lumina Jewelry - Xác thực tài khoản');
            });
        } catch (\Exception $e) {
            return response()->json(['message' => 'Không thể gửi email xác thực.'], 500);
        }

        return response()->json([
            'status' => 'success',
            'temp_token' => $tempToken
        ]);
    }

    // --- ĐĂNG KÝ BƯỚC 2: XÁC THỰC ---
    public function registerVerify(Request $request)
    {
        $request->validate([
            'token' => 'required', 
            'otp_input' => 'required|numeric', 
        ]);

        $cachedData = Cache::get('reg_token_' . $request->token);

        if (!$cachedData || $cachedData['otp'] != $request->otp_input) {
            return response()->json(['message' => 'Mã OTP không chính xác hoặc đã hết hạn.'], 422);
        }

        $user = User::create([
            'name' => $cachedData['name'],
            'email' => $cachedData['email'],
            'password' => $cachedData['password'],
            'role' => 'customer',
            'status' => 'Active',
        ]);

        Cache::forget('reg_token_' . $request->token);

        return response()->json(['status' => 'success', 'message' => 'Đăng ký thành công!']);
    }

    // --- QUÊN MẬT KHẨU BƯỚC 1: GỬI OTP ---
    public function requestPasswordResetOtp(Request $request)
    {
        $request->validate(['email' => 'required|email|exists:users,email']);

        $otp = rand(100000, 999999);
        $tempToken = Str::random(40);

        Cache::put('pw_reset_' . $tempToken, [
            'email' => $request->email,
            'otp' => $otp
        ], now()->addMinutes(10));

        try {
            // ĐÃ SỬA: Dùng Mail::send gọi file view 'emails.otp'
            Mail::send('emails.otp', ['otp' => $otp, 'title' => 'Khôi Phục Mật Khẩu'], function ($message) use ($request) {
                $message->to($request->email)->subject('Lumina Jewelry - Khôi phục mật khẩu');
            });
        } catch (\Exception $e) {
            return response()->json(['message' => 'Lỗi gửi mail.'], 500);
        }

        return response()->json(['temp_token' => $tempToken]);
    }

    // --- QUÊN MẬT KHẨU BƯỚC 2: XÁC THỰC OTP ---
    public function verifyPasswordResetOtp(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'otp_input' => 'required|numeric'
        ]);

        $cached = Cache::get('pw_reset_' . $request->token);

        if (!$cached || $cached['otp'] != $request->otp_input) {
            return response()->json(['message' => 'Mã OTP sai hoặc hết hạn.'], 422);
        }

        $resetToken = Str::random(60);
        Cache::put('final_reset_' . $resetToken, $cached['email'], now()->addMinutes(10));
        Cache::forget('pw_reset_' . $request->token);

        return response()->json([
            'message' => 'Xác thực thành công',
            'reset_token' => $resetToken
        ]);
    }

    // --- QUÊN MẬT KHẨU BƯỚC 3: ĐẶT LẠI MẬT KHẨU ---
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'password' => 'required|min:6'
        ]);

        $email = Cache::get('final_reset_' . $request->token);

        if (!$email) {
            return response()->json(['message' => 'Phiên làm việc hết hạn.'], 422);
        }

        $user = User::where('email', $email)->first();
        $user->password = Hash::make($request->password);
        $user->save();

        Cache::forget('final_reset_' . $request->token);

        return response()->json(['message' => 'Mật khẩu đã được cập nhật thành công!']);
    }

    // --- ĐĂNG XUẤT ---
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Đã đăng xuất thành công.']);
    }
}