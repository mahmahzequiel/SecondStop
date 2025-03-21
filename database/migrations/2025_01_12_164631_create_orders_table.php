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
                'cancellation_requested',
                'cancellation_approved',
                'cancellation_denied',
                'cancelled',
                'refund_requested',
                'refund_approved',
                'refund_denied',
                'refunded',
                'returned'
            ])->default('pending');
            $table->text('request_notes')->nullable();
            $table->text('admin_notes')->nullable();
            $table->dateTime('request_date')->nullable();
            $table->dateTime('admin_action_date')->nullable();
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