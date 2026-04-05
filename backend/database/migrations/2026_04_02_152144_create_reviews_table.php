<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateReviewsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
{
    Schema::create('reviews', function (Blueprint $table) {
        $table->id();
        $table->foreignId('product_id')->constrained()->onDelete('cascade'); // Đánh giá cho SP nào
        $table->string('customer_name'); // Tên khách hàng
        $table->integer('rating'); // Số sao (1 đến 5)
        $table->text('comment'); // Nội dung đánh giá
        $table->enum('status', ['pending', 'approved', 'hidden'])->default('pending'); // Trạng thái: Chờ duyệt, Đã duyệt, Bị ẩn
        $table->text('reply')->nullable(); // Lời phản hồi của Admin
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
        Schema::dropIfExists('reviews');
    }
}
