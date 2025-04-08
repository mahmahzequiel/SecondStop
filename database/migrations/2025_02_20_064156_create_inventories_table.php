<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateInventoriesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('inventories', function (Blueprint $table) {
            $table->id();

            // Foreign key to sacks table
            $table->unsignedBigInteger('sack_id')->nullable();
            $table->foreign('sack_id')
                  ->references('id')
                  ->on('sacks')
                  ->onDelete('set null');

            $table->enum('status', ['in_stock', 'sold', 'reserved', 'damaged'])->default('in_stock');
            $table->string('location', 100)->nullable();
            $table->string('condition', 50)->nullable();
            $table->text('notes')->nullable();

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
        Schema::dropIfExists('inventories');
    }
}
