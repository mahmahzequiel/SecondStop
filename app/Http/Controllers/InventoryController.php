<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function index()
    {
        return response()->json(Inventory::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'stock' => 'required|integer',
        ]);

        $inventory = Inventory::create($validated);
        return response()->json($inventory, 201);
    }

    public function show(Inventory $inventory)
    {
        return response()->json($inventory);
    }

    public function update(Request $request, Inventory $inventory)
    {
        $validated = $request->validate([
            'product_id' => 'sometimes|exists:products,id',
            'stock' => 'sometimes|integer',
        ]);

        $inventory->update($validated);
        return response()->json($inventory);
    }

    public function destroy(Inventory $inventory)
    {
        $inventory->delete();
        return response()->json(null, 204);
    }
}
