<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    use HasFactory;

    protected $table = 'promotions';

    protected $fillable = [
        'admin_id',
        'code',
        'name',
        'type',
        'value',
        'scope',
        'product_id',
        'start_date',
        'end_date',
        'usage_limit',
        'used_count',
        'status',
        'target_type', 
        'min_tier_id', // Đã có trong fillable là rất chuẩn
    ];

    /**
     * Quan hệ với bảng membership_tiers
     * Giúp lấy thông tin hạng yêu cầu của voucher
     */
    public function tier()
    {
        return $this->belongsTo(MembershipTier::class, 'min_tier_id');
    }

    /**
     * Quan hệ với User qua bảng trung gian promotion_user (Dành cho voucher tặng riêng)
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'promotion_user')
                    ->withPivot('is_used', 'used_at', 'assigned_at')
                    ->withTimestamps();
    }

    /**
     * Quan hệ với Product (Dành cho voucher áp dụng riêng cho 1 sản phẩm)
     */
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * Helper kiểm tra xem User có đủ hạng để dùng voucher không
     */
    public function canUserUse($user)
    {
        if (!$user) return false;
        return $user->membership_tier_id >= ($this->min_tier_id ?? 1);
    }
}