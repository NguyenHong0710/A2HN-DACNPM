<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePromotionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('admin_id'); // ID của admin tạo mã
            $table->string('code')->unique(); // Mã giảm giá (VD: GIAM30K), không được trùng lặp
            $table->string('name'); // Tên chương trình (VD: Ưu đãi hè)
            $table->string('type')->default('percent'); // Loại giảm: 'percent' (phần trăm) hoặc 'fixed' (số tiền cố định)
            $table->decimal('value', 15, 2); // Mức giảm (VD: 10%, 30000 VND)
            $table->string('scope')->default('order'); // Phạm vi: 'order' (toàn shop) hoặc 'product' (sản phẩm cụ thể)
            $table->unsignedBigInteger('product_id')->nullable(); // ID sản phẩm (nếu scope = 'product'), cho phép null
            $table->date('start_date')->nullable(); // Ngày bắt đầu
            $table->date('end_date')->nullable(); // Ngày kết thúc
            $table->integer('usage_limit')->default(100); // Giới hạn số lượt dùng mã
            $table->integer('used_count')->default(0); // Số lượt đã dùng (mặc định là 0)
            $table->tinyInteger('status')->default(1); // Trạng thái: 1 (Đang chạy), 0 (Tạm dừng)
            $table->timestamps();

            // (Tùy chọn) Thêm khóa ngoại nếu bạn muốn liên kết chặt chẽ với bảng users và products
            // $table->foreign('admin_id')->references('id')->on('users')->onDelete('cascade');
            // $table->foreign('product_id')->references('id')->on('products')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('promotions');
    }
}