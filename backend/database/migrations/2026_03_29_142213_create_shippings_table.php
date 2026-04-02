<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateShippingsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
{
    Schema::create('shippings', function (Blueprint $table) {
        $table->string('id')->primary(); // Mã vận đơn (VD: SHIP-001)
        $table->string('orderId');       // Mã đơn hàng (VD: ORD-888)
        $table->string('customer');      // Tên khách hàng
        $table->string('method');        // Phương thức: Giao nhanh, Giao nội thành...
        $table->string('status');        // Trạng thái: Chờ lấy hàng, Đang giao hàng...
        $table->dateTime('estimatedTime')->nullable(); // Thời gian dự kiến
        $table->text('address')->nullable();           // Địa chỉ giao hàng
        $table->text('note')->nullable();              // Ghi chú
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
        Schema::dropIfExists('shippings');
    }
}