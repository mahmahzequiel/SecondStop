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

            // Foreign key to carts table
            $table->unsignedBigInteger('cart_id');
            $table->foreign('cart_id')
                  ->references('id')
                  ->on('carts')
                  ->onDelete('cascade');
            // If you want to prevent deleting the order when cart is deleted,
            // use ->onDelete('restrict') or ->onDelete('set null') instead.

            // Foreign key to addresses table 
            $table->unsignedBigInteger('address_id')->nullable();
            $table->foreign('address_id')
                  ->references('id')
                  ->on('addresses')
                  ->onDelete('cascade');

            

            // Decimal columns with default values
            $table->decimal('subtotal', 10, 2)->default(0.00);
            $table->decimal('shipping_cost', 10, 2)->default(0.00);
            $table->decimal('total_amount', 10, 2)->default(0.00);

            // Order status
            $table->enum('status', [
                'pending',
                'shipped',
                'delivered',
                'cancelled',
                'returned',
                'refunded',
            ])->default('pending');

            // created_at & updated_at
            $table->dateTime('date_time')->nullable();
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
        Schema::dropIfExists('orders');
    }
}
