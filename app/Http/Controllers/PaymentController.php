<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    /**
     * Display a listing of all payments.
     */
    public function index()
    {
        $payments = Payment::all();
        return response()->json(['payments' => $payments]);
    }

    /**
     * Store a new payment record.
     */
    public function store(Request $request)
{
    try {
        $validated = $request->validate([
            'payment_method' => 'required|in:cod,gcash,paypal',
        ]);

        $payment = Payment::create($validated);

        return response()->json([
            'message' => 'Payment method created successfully',
            'payment_id' => $payment->id, // ✅ Include Payment ID
            'payment' => $payment
        ], 201);
    } catch (ValidationException $e) {
        return response()->json(['errors' => $e->errors()], 422);
    }
}


    /**
     * Display a specific payment record.
     */
    public function show(Payment $payment)
    {
        return response()->json(['payment' => $payment]);
    }

    /**
     * Update an existing payment record.
     */
    public function update(Request $request, Payment $payment)
    {
        try {
            $validated = $request->validate([
                'payment_method' => 'required|in:cod,gcash,paypal',
            ]);

            $payment->update($validated);

            return response()->json([
                'message' => 'Payment method updated successfully',
                'payment' => $payment
            ]);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }

    /**
     * Delete a payment record (soft delete).
     */
    public function destroy(Payment $payment)
    {
        if ($payment->trashed()) {
            $payment->forceDelete(); // Permanently delete if already soft deleted
        } else {
            $payment->delete(); // Soft delete
        }

        return response()->json(['message' => 'Payment method deleted successfully']);
    }

    /**
     * Restore a soft-deleted payment record.
     */
    public function restore($id)
    {
        $payment = Payment::withTrashed()->find($id);

        if (!$payment || !$payment->trashed()) {
            return response()->json(['message' => 'Payment not found or not deleted'], 404);
        }

        $payment->restore();

        return response()->json(['message' => 'Payment restored successfully', 'payment' => $payment]);
    }
}
