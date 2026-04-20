<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddTimestampsToPromotionUserTable extends Migration
{
    public function up()
{
    Schema::table('promotion_user', function (Blueprint $table) {
        // Lệnh này sẽ tự động thêm 2 cột created_at và updated_at vào bảng
        $table->timestamps(); 
    });
}

public function down()
{
    Schema::table('promotion_user', function (Blueprint $table) {
        $table->dropTimestamps();
    });
}
}
