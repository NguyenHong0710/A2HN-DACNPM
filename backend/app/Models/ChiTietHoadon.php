<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChiTietHoadon extends Model
{
    use HasFactory;

    // 1. Tên bảng
    protected $table = 'chi_tiet_hoadons';

    // 2. Các cột được phép lưu dữ liệu hàng loạt
    protected $fillable = [
        'hoadon_id', 
        'product_id', // Thêm product_id để định danh sản phẩm
        'name',       
        'qty', 
        'price',
        'images'       // <--- QUAN TRỌNG: Đã thêm để lưu ảnh sản phẩm thật vào đơn hàng
    ];

    /**
     * Thiết lập quan hệ ngược lại với Hoadon
     * Một chi tiết sẽ thuộc về một hóa đơn nào đó
     */
    public function hoadon()
    {
        return $this->belongsTo(Hoadon::class, 'hoadon_id');
    }

    /**
     * Thiết lập mối quan hệ với bảng Product (Sản phẩm)
     */
    public function product()
    {
        // Sử dụng product_id làm khóa ngoại để kết nối sang bảng products
        return $this->belongsTo(Product::class, 'product_id'); 
    }
}