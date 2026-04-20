<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddReplyToReviewsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
{
    Schema::table('reviews', function (Blueprint $table) {
        // Thêm cột reply kiểu text, cho phép null, đặt sau cột comment
        $table->text('reply')->nullable()->after('comment'); 
    });
}

public function down()
{
    Schema::table('reviews', function (Blueprint $table) {
        // Để khi cần rollback thì nó xóa cột này đi
        $table->dropColumn('reply');
    });
}
}
