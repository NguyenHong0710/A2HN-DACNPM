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
    // Trong file app/Models/Product.php

// Accessor: Tự động chuyển path thành URL tuyệt đối khi trả về JSON
public function getImagesAttribute($value)
{
    $images = json_decode($value, true) ?: [];
    return array_map(function ($img) {
        if (str_starts_with($img, 'http')) return $img;
        // Đảm bảo đường dẫn luôn bắt đầu bằng storage/
        $path = str_replace('storage/', '', $img);
        return asset('storage/' . $path);
    }, $images);
}
}