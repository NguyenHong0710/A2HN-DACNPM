<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'admin_id',
        'name',
        'category',
        'origin',
        'price',
        'stock',
        'unit',
        'description',
        'status',
        'images',
        'approval_status',
        'is_banned'
    ];

    // Tự động chuyển đổi JSON trong CSDL thành Array khi truy xuất
    protected $casts = [
        'images' => 'array',
        'is_banned' => 'boolean',
    ];
}