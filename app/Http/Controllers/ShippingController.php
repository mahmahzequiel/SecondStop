<?php

namespace App\Http\Controllers;

use App\Models\Shipping;
use Illuminate\Http\Request;

class ShippingController extends Controller
{
    public function index()
    {
        return response()->json(Shipping::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'option_name' => 'required|string|max:255',
            'cost' => 'required|numeric',
            'delivery_time' => 'required|string|max:255',
        ]);

        $shipping = Shipping::create($validated);
        return response()->json($shipping, 201);
    }

    public function show(Shipping $shipping)
    {
        return response()->json($shipping);
    }

    public function update(Request $request, Shipping $shipping)
    {
        $validated = $request->validate([
            'order_id' => 'sometimes|exists:orders,id',
            'option_name' => 'sometimes|string|max:255',
            'cost' => 'sometimes|numeric',
            'delivery_time' => 'sometimes|string|max:255',
        ]);

        $shipping->update($validated);
        return response()->json($shipping);
    }

    public function destroy(Shipping $shipping)
    {
        $shipping->delete();
        return response()->json(null, 204);
    }
}
