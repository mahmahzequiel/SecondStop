<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSacksTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('sacks', function (Blueprint $table) {
            $table->id();

            // Foreign keys
            $table->unsignedBigInteger('category_id');
            $table->foreign('category_id')
                  ->references('id')
                  ->on('categories')
                  ->onDelete('cascade');
                  
            $table->unsignedBigInteger('category_type_id');
            $table->foreign('category_type_id')
                        ->references('id')
                        ->on('category_types')
                        ->onDelete('cascade');

            // Sack details
            $table->integer('total_items')->default(0);
            $table->integer('available_items');
            $table->integer('sold_items');
            $table->string('sack_code', 50); // e.g., for tracking sack batch
            $table->integer('estimated_pieces')->nullable(); // Estimated number of items in the sack
            $table->decimal('buying_price', 10, 2); // Cost to acquire the sack

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
        Schema::dropIfExists('sacks');
    }
}