<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('admin_id'); 
            $table->string('name');
            $table->string('category')->nullable();
            $table->decimal('price', 15, 2); 
            $table->integer('stock')->default(0);
            $table->string('unit')->default('kg');
            $table->string('origin')->nullable();
            $table->text('description')->nullable();
            $table->string('status')->default('Còn hàng'); 
            $table->json('images')->nullable(); 
            $table->string('approval_status')->default('pending'); 
            $table->boolean('is_banned')->default(false); 
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};