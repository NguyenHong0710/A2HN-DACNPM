<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateHoadonsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
{
    Schema::create('hoadons', function (Blueprint $table) {
        $table->string('id')->primary(); // Mã hóa đơn (ORD-...)
        $table->string('customer');
        $table->string('phone')->nullable();
        $table->decimal('amount', 15, 2);
        $table->string('payment_method')->default('Tiền mặt');
        $table->string('deliveryStatus')->default('Chờ lấy hàng');
        $table->text('address')->nullable();
        $table->timestamps(); // Tạo created_at và updated_at
    });
}

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('hoadons');
    }
    
}