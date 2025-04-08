<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Support\Facades\DB; // Add this import for the DB facade
use App\Models\Sacks;
use Illuminate\Support\Facades\Storage;

class ProductsController extends Controller
{
    /**
     * Display a listing of the products.
     */
    public function index(Request $request)
    {
        // Get the status filter from the request
        $status = $request->query('status', 'active'); // Default to 'active'

        // Fetch products based on the status filter
        $query = Product::with(['category', 'categoryType', 'brand']);

        if ($status === 'archived') {
            $query->onlyTrashed(); // Fetch only archived (soft deleted) products
        } elseif ($status === 'all') {
            $query->withTrashed(); // Fetch all products (including archived)
        } else {
            // Default: fetch only active products
        }

        $products = $query->get();

        return response()->json($products);
    }

    /**
     * Store a newly created product in the database.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:1',
            'category_id' => 'required|exists:categories,id',
            'category_type_id' => 'required|exists:category_types,id',
            'sack_id' => 'required|exists:sacks,id',
            'brand_id' => 'nullable|exists:brands,id',
            'product_image' => 'nullable|image|max:2048', // max 2MB
        ]);

        // Start a transaction
        DB::beginTransaction();
        
        try {
            // Check if there are enough available items in the sack
            $sack = Sacks::findOrFail($request->sack_id);
            
            if ($sack->available_items < $request->quantity) {
                return response()->json([
                    'message' => 'Not enough available items in the selected sack',
                    'available' => $sack->available_items,
                    'requested' => $request->quantity
                ], 422);
            }
            
            // Handle image upload if provided
            if ($request->hasFile('product_image')) {
                $imagePath = $request->file('product_image')->store('product_images', 'public');
                $validated['product_image'] = $imagePath;
            }
            
            // Create the product
            $product = Product::create($validated);
            
            // Update the sack quantities
            $sack->update([
                'available_items' => $sack->available_items - $request->quantity,
                'sold_items' => $sack->sold_items + $request->quantity
            ]);
            
            // Commit the transaction
            DB::commit();
            
            // Load the relationships for the response
            $product->load(['category', 'categoryType', 'brand', 'sack']);
            
            return response()->json($product, 201);
        } catch (\Exception $e) {
            // Rollback the transaction in case of error
            DB::rollBack();
            
            return response()->json([
                'message' => 'Failed to create product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified product in the database.
     */
    /**
 * Update the specified product in the database.
 */
public function update(Request $request, $id)
{
    // Log request content
    \Log::info('Request Data:', $request->all());

    // Validate input
    $request->validate([
        'category_id' => 'required|exists:categories,id',
        'category_type_id' => 'required|exists:category_types,id',
        'brand_id' => 'required|exists:brands,id',
        'product_name' => 'required|string|max:100',
        'description' => 'nullable|string',
        'price' => 'required|numeric',
        'sack_id' => 'required|exists:sacks,id',
        'quantity' => 'required|integer|min:0',
        'product_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
    ]);

    $product = Product::findOrFail($id);
    
    // Start database transaction
    DB::beginTransaction();
    
    try {
        // Update product with all fields except product_image
        $product->update($request->except('product_image', '_method'));
        
        // Handle image upload only if a new file is provided
        if ($request->hasFile('product_image')) {
            // Delete old image if exists
            if ($product->product_image) {
                Storage::disk('public')->delete($product->product_image);
            }
            // Store new image
            $imagePath = $request->file('product_image')->store('products', 'public');
            $product->product_image = $imagePath;
            $product->save();
        }
        
        // Commit transaction
        DB::commit();
        
        // Load relationships for the response
        $product->load(['category', 'categoryType', 'brand', 'sack']);
        
        return response()->json($product);
    } catch (\Exception $e) {
        // Rollback transaction on error
        DB::rollBack();
        
        return response()->json([
            'message' => 'Failed to update product',
            'error' => $e->getMessage()
        ], 500);
    }
}

    /**
     * Archive the specified product (soft delete).
     */
    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $product->delete(); // Soft delete

        return response()->json(['message' => 'Product archived successfully']);
    }

    /**
     * Restore the specified archived product.
     */
    public function restore($id)
    {
        $product = Product::withTrashed()->findOrFail($id);
        $product->restore();

        return response()->json(['message' => 'Product restored successfully']);
    }

    /**
     * Get products by category type.
     */
    public function getProductsByCategoryType(Request $request)
    {
        $categoryTypeId = $request->query('category_type_id');

        if (!$categoryTypeId) {
            return response()->json(['error' => 'category_type_id is required'], 400);
        }

        if (!\App\Models\CategoryType::where('id', $categoryTypeId)->exists()) {
            return response()->json(['error' => 'Invalid category_type_id'], 404);
        }

        $products = Product::where('category_type_id', $categoryTypeId)->get();

        return response()->json($products);
    }
    public function updateQuantities(Request $request)
{
    $request->validate([
        'updates' => 'required|array',
        'updates.*.product_id' => 'required|exists:products,id',
        'updates.*.quantity_change' => 'required|integer'
    ]);

    $updates = $request->input('updates');
    
    \DB::beginTransaction();
    
    try {
        foreach ($updates as $update) {
            $product = Product::findOrFail($update['product_id']);
            $newQuantity = max(0, $product->quantity + $update['quantity_change']);
            $product->quantity = $newQuantity;
            $product->save();
        }
        
        \DB::commit();
        return response()->json(['message' => 'Product quantities updated successfully']);
    } catch (\Exception $e) {
        \DB::rollBack();
        return response()->json(['error' => 'Failed to update product quantities', 'message' => $e->getMessage()], 500);
        }   
    }

    
}