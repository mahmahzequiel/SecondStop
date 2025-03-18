<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrdersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            
            // Replace this:
            // $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            
            // With this:
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            $table->foreignId('payment_id')->constrained();
            $table->foreignId('address_id')->nullable()->constrained();
            
            $table->string('order_number')->unique();
            $table->decimal('subtotal', 10, 2)->default(0.00);
            $table->decimal('shipping_cost', 10, 2)->default(0.00);
            $table->decimal('total_amount', 10, 2)->default(0.00);
            $table->enum('status', [
                'pending',
                'shipped', 
                'delivered',
                'cancelled',
                'returned',
                'refunded'
            ])->default('pending');
            
            $table->dateTime('purchase_date')->nullable();
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
        Schema::dropIfExists('orders');
    }
}