<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChiTietHoadon extends Model
{
    use HasFactory;

    // 1. Tên bảng (để Laravel không tìm bảng 'chi_tiet_hoadons' nếu bạn đặt tên khác)
    protected $table = 'chi_tiet_hoadons';

    // 2. Các cột được phép lưu dữ liệu
    protected $fillable = [
        'hoadon_id', 
        'name',   // Đổi từ product_name thành name cho khớp với Migration
        'qty', 
        'price'
    ];

    /**
     * Thiết lập quan hệ ngược lại với Hoadon
     * Một chi tiết sẽ thuộc về một hóa đơn nào đó
     */
    // app/Models/ChiTietHoadon.php

public function product()
{
    // Kiểm tra lại khóa ngoại của bạn là product_id hay id_sanpham để thay cho đúng
    return $this->belongsTo(Product::class, 'product_id'); 
}

public function hoadon()
{
    return $this->belongsTo(Hoadon::class, 'hoadon_id');
}
}