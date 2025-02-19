<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateReturnRefundOrdersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('return_refund_orders', function (Blueprint $table) {
            $table->id();

            // Example foreign key to users table (if applicable)
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');

            // You can add additional columns relevant to return/refund orders here
            // For example, an order id, reason, status, etc.
            // $table->unsignedBigInteger('order_id');
            // $table->string('reason')->nullable();
            // $table->string('status')->default('pending');

            $table->timestamps();
            $table->softDeletes(); // This creates a nullable deleted_at column
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('return_refund_orders');
    }
}
