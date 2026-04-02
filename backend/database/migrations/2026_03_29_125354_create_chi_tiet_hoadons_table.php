<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateChiTietHoadonsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
   public function up()
{
    Schema::create('chi_tiet_hoadons', function (Blueprint $table) {
        $table->id();
        $table->string('hoadon_id'); // Khóa ngoại liên kết với bảng hoadons
        $table->string('name');
        $table->integer('qty');
        $table->decimal('price', 15, 2);
        $table->timestamps();

        // Tạo liên kết khóa ngoại
        $table->foreign('hoadon_id')->references('id')->on('hoadons')->onDelete('cascade');
    });
}

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('chi_tiet_hoadons');
    }
}