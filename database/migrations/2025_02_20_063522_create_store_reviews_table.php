<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStoreReviewsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('store_reviews', function (Blueprint $table) {
            $table->id(); // Primary key (auto-incrementing ID)
            $table->unsignedBigInteger('user_id'); // Foreign key for the user
            $table->integer('rating'); // Rating column (integer)
            $table->text('review_text'); // Review text column (text)
            $table->timestamps(); // Created at and updated at timestamps

            // Define foreign key constraint
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade'); // Cascade delete if the user is deleted
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('store_reviews');
    }
}