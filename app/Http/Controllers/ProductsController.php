<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
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
        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'category_type_id' => 'required|exists:category_types,id',
            'brand_id' => 'required|exists:brands,id',
            'product_name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'price' => 'required|numeric',
            'product_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        $product = new Product();
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
        $product = Product::with(['category', 'categoryType', 'brand'])->findOrFail($id);
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

        $product = Product::findOrFail($id);
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
}