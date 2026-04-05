<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    use HasFactory;

    protected $table = 'promotions';

    // Các trường được phép thêm/sửa
    protected $fillable = [
        'admin_id',
        'code',
        'name',
        'type',
        'value',
        'scope',
        'product_id',
        'start_date',
        'end_date',
        'usage_limit',
        'used_count',
        'status',
    ];
}