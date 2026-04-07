<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateActivityLogsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('activity_logs', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('user_id')->nullable(); // Khớp với id trong bảng users
    $table->string('user_name')->nullable();           // Khớp với cột name trong bảng users
    $table->string('action');                          // Mô tả hành động
    $table->string('target_name')->nullable();         // Lưu tên sản phẩm (cột name trong bảng products)
    $table->string('method');                          // GET, POST...
    $table->string('url');
    $table->ipAddress('ip_address')->nullable();
    $table->text('user_agent')->nullable();
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('activity_logs');
    }
}
