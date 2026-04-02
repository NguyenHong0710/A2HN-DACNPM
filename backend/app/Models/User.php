<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',      // 'Admin' hoặc 'Customer'
        'phone',
        'address',
        'avatar',
        'bio',
        'birthday',
        'gender',
        'status',    // 'Active' hoặc 'Banned'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    // Tự động đính kèm avatar_url vào JSON trả về cho React
    protected $appends = ['avatar_url'];

    /**
     * Helper: Lấy URL ảnh đại diện đầy đủ
     * Giúp React hiển thị ảnh dễ dàng hơn
     */
    public function getAvatarUrlAttribute()
    {
        if ($this->avatar) {
            // Nếu avatar bắt đầu bằng http (link ngoài) thì trả về luôn, 
            // nếu không thì nối với đường dẫn storage
            if (filter_var($this->avatar, FILTER_VALIDATE_URL)) {
                return $this->avatar;
            }
            return asset('storage/' . $this->avatar);
        }
        // Trả về ảnh mặc định dựa trên tên nếu chưa có avatar
        return 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&background=random';
    }
}