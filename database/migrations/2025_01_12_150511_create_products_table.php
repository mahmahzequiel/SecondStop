<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProductsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            // Foreign key to categories table
            $table->unsignedBigInteger('category_id');
            $table->foreign('category_id')
                  ->references('id')
                  ->on('categories')
                  ->onDelete('cascade');
            // Adjust 'categories' to your actual categories table name, if different

            // Product fields
            $table->string('product_name', 100);
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2)->default(0.00);
            $table->binary('product_image')->nullable();
            $table->string('brand', 100);

            $table->timestamps();
            $table->softDeletes()->nullable(); 
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('products');
    }
}
