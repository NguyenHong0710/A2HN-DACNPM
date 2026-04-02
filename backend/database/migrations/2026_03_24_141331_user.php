<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class User extends Migration
{
    /**
     * Chạy migration để tạo bảng.
     */
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            // 1. ID tự tăng (Khóa chính)
            $table->id(); 

            // 2. Thông tin định danh cơ bản
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('phone')->nullable(); 

            // --- BỔ SUNG CHO PHẦN PROFILE ---
            // 3. Ảnh đại diện (Lưu đường dẫn file)
            $table->string('avatar')->nullable(); 

            // 4. Địa chỉ chi tiết
            $table->string('address')->nullable();

            // 5. Tiểu sử / Giới thiệu bản thân (Dùng text để viết được dài)
            $table->text('bio')->nullable();

            // 6. Ngày sinh (Nếu cần quản lý tuổi)
            $table->date('birthday')->nullable();

            // 7. Giới tính (Nam, Nữ, Khác)
            $table->string('gender')->nullable();
            // ---------------------------------
            
            // 8. Phân quyền
            $table->string('role')->default('Customer'); 

            // 9. Trạng thái
            $table->string('status')->default('Active');

            // 10. Các trường hệ thống
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps(); 
        });
    }

    /**
     * Hoàn tác migration.
     */
    public function down()
    {
        Schema::dropIfExists('users');
    }
}