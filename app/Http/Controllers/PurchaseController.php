<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Purchase;

class PurchaseController extends Controller
{
    /**
     * Display a listing of purchases.
     */
    public function index()
    {
        $purchases = Purchase::with('order')->get();
        return response()->json($purchases);
    }

    /**
     * Store a newly created purchase.
     */
    public function store(Request $request)
{
    try {
        // Validate the request payload
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'purchase_date' => 'required|date',
            'product_details' => 'required|array', // Array of product details
            'total_amount' => 'required|numeric',
        ]);

        // Create the purchase record
        $purchase = Purchase::create([
            'order_id' => $validated['order_id'],
            'purchase_date' => $validated['purchase_date'],
            'product_details' => json_encode($validated['product_details']), // Store as JSON
            'total_amount' => $validated['total_amount'],
        ]);

        return response()->json([
            'message' => 'Purchase recorded successfully',
            'purchase' => $purchase,
        ], 201);
    } catch (ValidationException $e) {
        // Log validation errors for debugging
        \Log::error('Validation Error:', $e->errors());
        return response()->json(['errors' => $e->errors()], 422);
    } catch (\Exception $e) {
        // Log other errors for debugging
        \Log::error('Failed to save purchase:', ['error' => $e->getMessage()]);
        return response()->json(['error' => 'Failed to save purchase'], 500);
    }
}
    /**
     * Display the specified purchase.
     */
    public function show($id)
    {
        $purchase = Purchase::with('order')->find($id);

        if (!$purchase) {
            return response()->json(['message' => 'Purchase not found'], 404);
        }

        return response()->json($purchase);
    }

    /**
     * Remove the specified purchase.
     */
    public function destroy($id)
    {
        $purchase = Purchase::find($id);

        if (!$purchase) {
            return response()->json(['message' => 'Purchase not found'], 404);
        }

        $purchase->delete();
        return response()->json(['message' => 'Purchase deleted successfully']);
    }

    public function getPurchasesByStatus($status)
    {
        $purchases = Purchase::with(['order.carts.product'])
            ->whereHas('order', function ($query) use ($status) {
                $query->where('status', $status);
            })
            ->get()
            ->map(function ($purchase) {
                return [
                    'id' => $purchase->id,
                    'purchase_date' => $purchase->purchase_date,
                    'total_amount' => $purchase->total_amount,
                    'status' => $purchase->status,
                    'items' => $purchase->order->carts->map(function ($cart) {
                        return [
                            'product_name' => optional($cart->product)->product_name ?? 'Unknown',
                            'price' => optional($cart->product)->price ?? 0,
                        ];
                    }),
                ];
            });

        return response()->json(['purchases' => $purchases]);
    }
}