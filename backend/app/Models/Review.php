<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    /**
     * Các thuộc tính có thể gán hàng loạt (Mass Assignment).
     * Phải khớp với các cột trong migration của bạn.
     */
    protected $fillable = [
        'user_id',
        'product_id',
        'rating',
        'comment',
        'reply'
    ];

    /**
     * Thiết lập quan hệ: Một đánh giá thuộc về một người dùng.
     * Giúp lấy được tên người dùng khi hiển thị đánh giá (ví dụ: $review->user->name)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Thiết lập quan hệ: Một đánh giá thuộc về một sản phẩm.
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Tùy chọn: Tự động format lại ngày tháng khi trả về JSON
     */
    protected $casts = [
        'created_at' => 'datetime:H:i d/m/Y',
        'rating' => 'integer',
    ];
}