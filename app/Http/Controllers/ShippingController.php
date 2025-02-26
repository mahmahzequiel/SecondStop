<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Shipping;

class ShippingController extends Controller
{
    /**
     * Display a listing of the shipping options.
     */
    public function index()
    {
        $shippings = Shipping::with('order')->get();
        return response()->json($shippings);
    }

    /**
     * Store a newly created shipping option.
     */
    public function store(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'option_name' => 'required|string|max:255',
            'cost' => 'required|numeric|min:0',
            'delivery_time' => 'required|string|max:255',
        ]);

        $shipping = Shipping::create($request->all());

        return response()->json(['message' => 'Shipping option created', 'shipping' => $shipping], 201);
    }

    /**
     * Display the specified shipping option.
     */
    public function show($id)
    {
        $shipping = Shipping::with('order')->find($id);

        if (!$shipping) {
            return response()->json(['message' => 'Shipping option not found'], 404);
        }

        return response()->json($shipping);
    }

    /**
     * Update the specified shipping option.
     */
    public function update(Request $request, $id)
    {
        $shipping = Shipping::find($id);

        if (!$shipping) {
            return response()->json(['message' => 'Shipping option not found'], 404);
        }

        $request->validate([
            'option_name' => 'sometimes|string|max:255',
            'cost' => 'sometimes|numeric|min:0',
            'delivery_time' => 'sometimes|string|max:255',
        ]);

        $shipping->update($request->all());

        return response()->json(['message' => 'Shipping option updated', 'shipping' => $shipping]);
    }

    /**
     * Remove the specified shipping option.
     */
    public function destroy($id)
    {
        $shipping = Shipping::find($id);

        if (!$shipping) {
            return response()->json(['message' => 'Shipping option not found'], 404);
        }

        $shipping->delete();
        return response()->json(['message' => 'Shipping option deleted']);
    }
}