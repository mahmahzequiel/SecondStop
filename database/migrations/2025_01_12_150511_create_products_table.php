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

            // Foreign key to category_types table
            $table->unsignedBigInteger('category_type_id');
            $table->foreign('category_type_id')
                  ->references('id')
                  ->on('category_types')
                  ->onDelete('cascade');

            // Foreign key to brands table
            $table->unsignedBigInteger('brand_id')->nullable();
            $table->foreign('brand_id')
                  ->references('id')
                  ->on('brands')
                  ->onDelete('cascade');

            // Product fields
            $table->string('product_name', 100);
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2)->default(0.00);
            $table->string('product_image', 255)->nullable(); // ✅ Accepts image file paths (.jpg/.png)

            $table->timestamps();
            $table->softDeletes();
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
