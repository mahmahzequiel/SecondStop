<?php

namespace App\Http\Controllers;

use App\Models\Sacks;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SacksController extends Controller
{
    public function index(Request $request)
    {
        $query = Sacks::query()
            ->with(['category', 'categoryType']); // Eager load relationships
        
        if ($request->has('status')) {
            switch ($request->status) {
                case 'active':
                    $query->whereNull('deleted_at');
                    break;
                case 'archived':
                    $query->onlyTrashed();
                    break;
                // 'all' will return everything including trashed
                case 'all':
                    $query->withTrashed();
                    break;
            }
        }
        
        $sacks = $query->get();
        return response()->json($sacks);
    }

    public function store(Request $request)
    {
        // Modified validation to allow reusing sack codes with different category/type combinations
        $validated = $request->validate([
            'available_items' => 'required|integer|min:0',
            'sold_items' => 'required|integer|min:0',
            'sack_code' => [
                'required',
                'string',
                'max:50',
                // Only enforce uniqueness when the combination of sack_code, category_id, and category_type_id is unique
                Rule::unique('sacks')->where(function ($query) use ($request) {
                    return $query->where('sack_code', $request->sack_code)
                                ->where('category_id', $request->category_id)
                                ->where('category_type_id', $request->category_type_id);
                })
            ],
            'estimated_pieces' => 'required|integer|min:0',
            'buying_price' => 'required|numeric|min:0',
            'category_id' => 'required|exists:categories,id',
            'category_type_id' => 'required|exists:category_types,id',
        ]);

        // Calculate total_items automatically
        $validated['total_items'] = $validated['available_items'] + $validated['sold_items'];

        $sack = Sacks::create($validated);

        return response()->json($sack, 201);
    }

    public function show($id)
    {
        $sack = Sacks::withTrashed()
            ->with(['category', 'categoryType'])
            ->findOrFail($id);
        return response()->json($sack);
    }

    public function update(Request $request, $id)
    {
        $sack = Sacks::findOrFail($id);

        $validated = $request->validate([
            'available_items' => 'sometimes|required|integer|min:0',
            'sold_items' => 'sometimes|required|integer|min:0',
            'sack_code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                // Similar modification for update method
                Rule::unique('sacks')->where(function ($query) use ($request, $sack) {
                    return $query->where('sack_code', $request->sack_code)
                                ->where('category_id', $request->category_id ?? $sack->category_id)
                                ->where('category_type_id', $request->category_type_id ?? $sack->category_type_id);
                })->ignore($sack->id)
            ],
            'estimated_pieces' => 'sometimes|integer|min:0',
            'buying_price' => 'sometimes|required|numeric|min:0',
            'category_id' => 'sometimes|required|exists:categories,id',
            'category_type_id' => 'sometimes|required|exists:category_types,id',
        ]);

        if (isset($validated['available_items']) && isset($validated['sold_items'])) {
            $validated['total_items'] = $validated['available_items'] + $validated['sold_items'];
        } elseif (isset($validated['available_items'])) {
            $validated['total_items'] = $validated['available_items'] + $sack->sold_items;
        } elseif (isset($validated['sold_items'])) {
            $validated['total_items'] = $sack->available_items + $validated['sold_items'];
        }

        $sack->update($validated);

        // Refresh the model with relationships
        $sack->refresh();
        $sack->load(['category', 'categoryType']);

        return response()->json($sack);
    }

    // Rest of the methods remain unchanged
    public function destroy($id)
    {
        $sack = Sacks::findOrFail($id);
        $sack->delete();

        return response()->json(['message' => 'Sack deleted successfully']);
    }

    public function restore($id)
    {
        $sack = Sacks::withTrashed()->findOrFail($id);
        $sack->restore();

        return response()->json(['message' => 'Sack restored successfully']);
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:sacks,id'
        ]);

        $count = 0;
        
        DB::transaction(function () use ($validated, &$count) {
            $count = Sacks::whereIn('id', $validated['ids'])->delete();
        });

        return response()->json([
            'message' => $count . ' sacks deleted successfully'
        ]);
    }

    public function bulkRestore(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:sacks,id'
        ]);

        $count = 0;
        
        DB::transaction(function () use ($validated, &$count) {
            $count = Sacks::onlyTrashed()
                ->whereIn('id', $validated['ids'])
                ->restore();
        });

        return response()->json([
            'message' => $count . ' sacks restored successfully'
        ]);
    }

    public function archived()
    {
        $sacks = Sacks::onlyTrashed()
            ->with(['category', 'categoryType'])
            ->get();
        return response()->json($sacks);
    }

    public function updateQuantities(Request $request)
    {
        $validated = $request->validate([
            'updates' => 'required|array',
            'updates.*.product_id' => 'required|exists:products,id',
            'updates.*.quantity_change' => 'required|integer'
        ]);

        $results = [];
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($validated['updates'] as $update) {
                // Get the product to find its sack
                $product = Product::findOrFail($update['product_id']);
                
                // Only process if the product has a sack_id
                if ($product->sack_id) {
                    $sack = Sacks::findOrFail($product->sack_id);
                    
                    // Calculate new values
                    $quantityChange = abs($update['quantity_change']); // Make positive for calculation
                    $newAvailableItems = $sack->available_items - $quantityChange;
                    $newSoldItems = $sack->sold_items + $quantityChange;
                    
                    // Ensure available items doesn't go below 0
                    if ($newAvailableItems < 0) {
                        $errors[] = "Insufficient available items in sack for product ID: {$product->id}";
                        continue;
                    }
                    
                    // Update the sack
                    $sack->update([
                        'available_items' => $newAvailableItems,
                        'sold_items' => $newSoldItems
                        // total_items remains the same since we're just moving items from available to sold
                    ]);
                    
                    $results[] = [
                        'product_id' => $product->id,
                        'sack_id' => $sack->id,
                        'previous_available' => $sack->available_items + $quantityChange,
                        'new_available' => $newAvailableItems,
                        'previous_sold' => $sack->sold_items - $quantityChange,
                        'new_sold' => $newSoldItems
                    ];
                } else {
                    $errors[] = "Product ID: {$product->id} is not associated with any sack";
                }
            }
            
            if (empty($errors)) {
                DB::commit();
                return response()->json([
                    'message' => 'Sack quantities updated successfully', 
                    'results' => $results
                ]);
            } else {
                DB::rollBack();
                return response()->json([
                    'message' => 'Failed to update some sack quantities',
                    'errors' => $errors
                ], 422);
            }
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error updating sack quantities', 
                'error' => $e->getMessage()
            ], 500);
        }
    }
}