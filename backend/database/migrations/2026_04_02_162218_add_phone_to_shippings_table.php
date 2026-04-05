<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddPhoneToShippingsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
{
    Schema::table('shippings', function (Blueprint $table) {
        // Thêm cột phone kiểu string, cho phép null, đặt sau cột customer
        $table->string('phone')->nullable()->after('customer'); 
    });
}

public function down()
{
    Schema::table('shippings', function (Blueprint $table) {
        // Xóa cột phone nếu muốn rollback migration
        $table->dropColumn('phone');
    });
}
}
