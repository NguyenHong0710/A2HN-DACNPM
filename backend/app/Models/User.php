<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\DB;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'role', 'phone', 'address',
        'avatar', 'bio', 'birthday', 'gender', 'status',
        'membership_tier_id', 'total_spent',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'total_spent' => 'float',
    ];

    // Đính kèm thuộc tính ảo để React sử dụng
    protected $appends = ['avatar_url', 'tier_progress'];

    /**
     * Quan hệ với Phân hạng (Đã an toàn vì có file MembershipTier.php)
     */
    public function tier()
    {
        return $this->belongsTo(MembershipTier::class, 'membership_tier_id');
    }

    /**
     * Accessor: Tính toán thăng hạng chuyên nghiệp
     */
    public function getTierProgressAttribute()
    {
        // 1. Lấy số tiền đã chi tiêu, mặc định là 0 nếu null
        $totalSpent = (float)($this->total_spent ?? 0);

        // 2. Tìm hạng kế tiếp mà User cần đạt tới (có min_spend > số tiền hiện tại)
        $nextTier = MembershipTier::where('min_spend', '>', $totalSpent)
            ->orderBy('min_spend', 'asc')
            ->first();

        // 3. Nếu không tìm thấy hạng cao hơn -> User đã đạt hạng cao nhất
        if (!$nextTier) {
            return [
                'percent' => 100,
                'missing_amount' => 0,
                'next_tier_name' => 'Thành viên VIP nhất',
                'is_max' => true
            ];
        }

        // 4. Tính toán mốc bắt đầu (min_spend của hạng hiện tại)
        // Nếu user chưa có hạng nào, mốc bắt đầu là 0
        $currentTierMin = $this->tier ? (float)$this->tier->min_spend : 0;
        
        // Khoảng cách từ hạng cũ đến hạng mới
        $range = (float)$nextTier->min_spend - $currentTierMin;
        
        // Số tiền đã vượt qua mốc hạng cũ
        $achieved = $totalSpent - $currentTierMin;
        
        // Tính % (đảm bảo không chia cho 0 và giá trị trong khoảng 0-100)
        $percent = $range > 0 ? round(($achieved / $range) * 100) : 0;
        $percent = max(0, min(100, (int)$percent));

        return [
            'percent' => $percent,
            'missing_amount' => (float)max(0, $nextTier->min_spend - $totalSpent),
            'next_tier_name' => $nextTier->name,
            'is_max' => false
        ];
    }

    /**
     * Helper: Lấy URL ảnh đại diện đầy đủ
     */
    public function getAvatarUrlAttribute()
    {
        if ($this->avatar) {
            if (filter_var($this->avatar, FILTER_VALIDATE_URL)) return $this->avatar;
            return asset('storage/' . $this->avatar);
        }
        return 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&background=random';
    }

    /**
     * Các quan hệ khác
     */
    public function hoadons() { 
        return $this->hasMany(Hoadon::class, 'user_id'); 
    }

    public function promotions() {
        return $this->belongsToMany(Promotion::class, 'promotion_user')
                    ->withPivot('is_used')
                    ->withTimestamps();
    }
}