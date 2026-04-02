<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Hoadon extends Model
{
    use HasFactory;

    // Khai báo tên bảng
    protected $table = 'hoadons';

    /**
     * Khai báo các cột cho phép lưu dữ liệu hàng loạt.
     * Cần có user_id để biết ai là người đặt đơn.
     */
    protected $fillable = [
        'user_id', 
        'customer', 
        'phone', 
        'amount', 
        'payment_method', 
        'deliveryStatus', 
        'address'
    ];

    // GHI CHÚ: Đã xóa $keyType = 'string' và $incrementing = false 
    // vì Database hiện tại dùng ID số tự tăng (Hướng 1).

    /**
     * Thiết lập mối quan hệ: 1 Hóa đơn có NHIỀU Chi tiết hóa đơn
     */
    public function chiTiet()
    {
        // 'hoadon_id' là tên cột khóa ngoại ở bảng chi_tiet_hoadons
        return $this->hasMany(ChiTietHoadon::class, 'hoadon_id', 'id');
    }

    /**
     * Thiết lập mối quan hệ ngược: Hóa đơn này thuộc về 1 User
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}