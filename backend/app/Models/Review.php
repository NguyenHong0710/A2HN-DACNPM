<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    /**
     * Gộp các trường fillable từ cả hai nhánh.
     * Giữ lại status nếu bạn có dùng để duyệt bài,
     * và user_id để định danh người dùng.
     */
    protected $fillable = [
        'user_id',
        'product_id',
        'customer_name', // Giữ lại để tránh lỗi nếu DB cũ chưa xóa cột này
        'rating',
        'comment',
        'status',
        'reply'
    ];

    /**
     * Thiết lập quan hệ: Một đánh giá thuộc về một người dùng.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Thiết lập quan hệ: Một đánh giá thuộc về một sản phẩm.
     */
    protected $fillable = ['product_id', 'customer_name', 'rating', 'comment', 'status', 'reply'];

    // Liên kết để lấy tên sản phẩm
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Tự động format lại ngày tháng và kiểu dữ liệu khi trả về JSON
     */
    protected $casts = [
        'created_at' => 'datetime:H:i d/m/Y',
        'rating' => 'integer',
    ];
}
