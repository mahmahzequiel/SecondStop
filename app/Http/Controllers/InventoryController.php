<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    /**
     * Display inventory dashboard
     */
    public function index()
    {
        $sacks = Inventory::getAllSacks();
        $inStockItems = DB::table('inventory_items')
                         ->where('status', 'in_stock')
                         ->count();
        
        return view('inventory.index', compact('sacks', 'inStockItems'));
    }
    
    /**
     * Show sacks management page
     */
    public function sacks()
    {
        $sacks = Inventory::getAllSacks();
        return view('inventory.sacks', compact('sacks'));
    }
    
    /**
     * Create a new sack
     */
    public function storeSack(Request $request)
{
    try {
        $validated = $request->validate([
            'sack_name' => 'required|string|max:100',
            'source' => 'nullable|string|max:255',
            'date_received' => 'required|date',
            'acquisition_cost' => 'nullable|numeric',
            'total_items' => 'nullable|integer',
            'notes' => 'nullable|string'
        ]);
        
        $sackId = Inventory::createSack($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Sack created successfully',
            'data' => ['id' => $sackId]
        ]);
        
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Failed to create sack: ' . $e->getMessage()
        ], 500);
    }
}
    /**
     * Show sack processing page
     */
    public function processSack($id)
    {
        $sack = Inventory::getSack($id);
        $categories = \App\Models\Category::all();
        $categoryTypes = \App\Models\CategoryType::all();
        $brands = \App\Models\Brand::all();
        
        // Get products already processed from this sack
        $processedProducts = DB::table('products')
                             ->join('inventory_items', 'products.id', '=', 'inventory_items.product_id')
                             ->where('inventory_items.sack_id', $id)
                             ->select('products.*', 'inventory_items.status', 'inventory_items.condition')
                             ->get();
        
        return view('inventory.process-sack', compact('sack', 'categories', 'categoryTypes', 'brands', 'processedProducts'));
    }
    
    /**
     * Add a product from a sack
     */
    public function addProductFromSack(Request $request, $sackId)
    {
        $validated = $request->validate([
            'product_name' => 'required|string|max:100',
            'category_id' => 'required|exists:categories,id',
            'category_type_id' => 'required|exists:category_types,id',
            'brand_id' => 'nullable|exists:brands,id',
            'price' => 'required|numeric',
            'description' => 'nullable|string',
            'condition' => 'nullable|string|max:50',
            'location' => 'nullable|string|max:100',
        ]);
        
        DB::beginTransaction();
        
        try {
            // Create product
            $product = new Product();
            $product->product_name = $validated['product_name'];
            $product->category_id = $validated['category_id'];
            $product->category_type_id = $validated['category_type_id'];
            $product->brand_id = $validated['brand_id'];
            $product->price = $validated['price'];
            $product->description = $validated['description'] ?? null;
            $product->quantity = 1;
            $product->save();
            
            // Create inventory item
            Inventory::createItem([
                'product_id' => $product->id,
                'sack_id' => $sackId,
                'status' => 'in_stock',
                'condition' => $validated['condition'] ?? null,
                'location' => $validated['location'] ?? null
            ]);
            
            // Update sack processing status
            Inventory::processItem($sackId, $product->id);
            
            DB::commit();
            
            return redirect()->back()->with('success', 'Product added successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to add product: ' . $e->getMessage());
        }
    }
    
    /**
     * Update inventory item status
     */
    public function updateStatus(Request $request, $productId)
    {
        $validated = $request->validate([
            'status' => 'required|in:in_stock,sold,reserved,damaged'
        ]);
        
        Inventory::updateItemStatus($productId, $validated['status']);
        
        return redirect()->back()->with('success', 'Inventory status updated');
    }
    
    /**
     * Inventory report
     */
    public function report()
    {
        $inventorySummary = DB::table('inventory_items')
                            ->select('status', DB::raw('count(*) as total'))
                            ->groupBy('status')
                            ->get();
        
        $sacksSummary = DB::table('inventory_sacks')
                        ->select('status', DB::raw('count(*) as total'))
                        ->groupBy('status')
                        ->get();
        
        return view('inventory.report', compact('inventorySummary', 'sacksSummary'));
    }

    /**
 * Update an existing sack
 */
public function updateSack(Request $request, $id)
{
    $validated = $request->validate([
        'sack_name' => 'required|string|max:100',
        'source' => 'nullable|string|max:255',
        'date_received' => 'required|date',
        'acquisition_cost' => 'nullable|numeric',
        'total_items' => 'nullable|integer',
        'notes' => 'nullable|string'
    ]);
    
    Inventory::updateSack($id, $validated);
    
    return response()->json(['message' => 'Sack updated successfully']);
}
}