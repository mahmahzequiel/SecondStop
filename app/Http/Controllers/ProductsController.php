<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Products;
use Illuminate\Support\Facades\Storage;

class ProductsController extends Controller
{
    /**
     * Display a listing of the products.
     */
    public function index()
    {
        // Load category, category type, and brand relationships
        $products = Products::with(['category', 'categoryType', 'brand'])->get();
        return response()->json($products);
    }

    /**
     * Store a newly created product in the database.
     */
    public function store(Request $request)
    {
        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'category_type_id' => 'required|exists:category_types,id',
            'brand_id' => 'required|exists:brands,id', // Ensure brand_id is valid
            'product_name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'price' => 'required|numeric',
            'product_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        $product = new Products();
        $product->category_id = $request->category_id;
        $product->category_type_id = $request->category_type_id;
        $product->brand_id = $request->brand_id;
        $product->product_name = $request->product_name;
        $product->description = $request->description;
        $product->price = $request->price;

        if ($request->hasFile('product_image')) {
            $imagePath = $request->file('product_image')->store('products', 'public');
            $product->product_image = $imagePath;
        }

        $product->save();

        return response()->json($product, 201);
    }

    /**
     * Display the specified product.
     */
    public function show($id)
    {
        $product = Products::with(['category', 'categoryType', 'brand'])->findOrFail($id);
        return response()->json($product);
    }

    /**
     * Update the specified product in the database.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'category_type_id' => 'required|exists:category_types,id',
            'brand_id' => 'required|exists:brands,id',
            'product_name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'price' => 'required|numeric',
            'product_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        $product = Products::findOrFail($id);
        $product->category_id = $request->category_id;
        $product->category_type_id = $request->category_type_id;
        $product->brand_id = $request->brand_id;
        $product->product_name = $request->product_name;
        $product->description = $request->description;
        $product->price = $request->price;

        if ($request->hasFile('product_image')) {
            // Delete old image if exists
            if ($product->product_image) {
                Storage::disk('public')->delete($product->product_image);
            }
            $imagePath = $request->file('product_image')->store('products', 'public');
            $product->product_image = $imagePath;
        }

        $product->save();

        return response()->json($product);
    }

    /**
     * Remove the specified product from the database.
     */
    public function destroy($id)
    {
        $product = Products::findOrFail($id);
        if ($product->product_image) {
            Storage::disk('public')->delete($product->product_image);
        }
        $product->delete();

        return response()->json(['message' => 'Product deleted successfully'], 204);
    }

    public function getProductsByCategoryType(Request $request)
{
    $categoryTypeId = $request->query('category_type_id'); // Get from query params

    if (!$categoryTypeId) {
        return response()->json(['error' => 'category_type_id is required'], 400);
    }

    // Check if the category type exists before querying
    if (!\App\Models\CategoryType::where('id', $categoryTypeId)->exists()) {
        return response()->json(['error' => 'Invalid category_type_id'], 404);
    }

    // Fetch products that belong to the given category type
    $products = Products::where('category_type_id', $categoryTypeId)->get();

    return response()->json($products);
}

}