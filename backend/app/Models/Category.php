<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'image',
        'status',
    ];

    // Ép kiểu dữ liệu cho status luôn là boolean khi trả về JSON
    protected $casts = [
        'status' => 'boolean',
    ];
}