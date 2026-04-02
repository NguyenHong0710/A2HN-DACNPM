<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shipping extends Model
{
    use HasFactory;

    protected $table = 'shippings';

    // Cực kỳ quan trọng: Cho phép lưu các cột này từ React gửi lên
    protected $fillable = [
        'id', 'orderId', 'customer', 'method', 'status', 'estimatedTime', 'address', 'note'
    ];

    // Vì ID của ông là chuỗi (SHIP-001) nên phải khai báo 2 dòng này
    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * Quan hệ: Một vận chuyển sẽ thuộc về một Hóa đơn (để lấy chi tiết món hàng khi in)
     */
    public function hoadon()
    {
        // Liên kết cột orderId của bảng shippings với cột id của bảng hoadons
        return $this->belongsTo(Hoadon::class, 'orderId', 'id');
    }
}