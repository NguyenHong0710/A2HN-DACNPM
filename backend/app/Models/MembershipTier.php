<?php

namespace App\Http\Controllers\Api;

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MembershipTier extends Model
{
    use HasFactory;

    // Khai báo tên bảng
    protected $table = 'membership_tiers';

    // Các cột cho phép thêm/sửa dữ liệu
    protected $fillable = [
        'name',
        'min_spend',
        'discount_percent'
    ];

    /**
     * Quan hệ: Một hạng có nhiều người dùng
     */
    public function users()
    {
        return $this->hasMany(User::class, 'membership_tier_id');
    }

    /**
     * BỔ SUNG: Một hạng thành viên có thể có nhiều Voucher yêu cầu hạng này
     */
    public function promotions()
    {
        return $this->hasMany(Promotion::class, 'min_tier_id');
    }
}