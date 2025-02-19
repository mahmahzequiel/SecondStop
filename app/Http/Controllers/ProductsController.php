<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Products; // Import the correct model
use Illuminate\Support\Facades\Storage;

class ProductsController extends Controller
{
    // Display a listing of the products
    public function index()
    {
        $products = Products::with('category')->get(); // Use 'Products' instead of 'Product'
        return response()->json($products);
    }

    // Store a newly created product in the database
    public function store(Request $request)
    {
        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'product_name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'price' => 'required|numeric',
            'product_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'brand' => 'required|string|max:100',
        ]);

        $product = new Products(); // Use 'Products' instead of 'Product'
        $product->category_id = $request->category_id;
        $product->product_name = $request->product_name;
        $product->description = $request->description;
        $product->price = $request->price;
        $product->brand = $request->brand;

        if ($request->hasFile('product_image')) {
            $imagePath = $request->file('product_image')->store('products', 'public');
            $product->product_image = $imagePath;
        }

        $product->save();

        return response()->json($product, 201);
    }

    // Display the specified product
    public function show($id)
    {
        $product = Products::with('category')->findOrFail($id); // Use 'Products' instead of 'Product'
        return response()->json($product);
    }

    // Update the specified product in the database
    public function update(Request $request, $id)
    {
        $request->validate([
            'category_id' => 'required|exists:categories,id',
            'product_name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'price' => 'required|numeric',
            'product_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'brand' => 'required|string|max:100',
        ]);

        $product = Products::findOrFail($id); // Use 'Products' instead of 'Product'
        $product->category_id = $request->category_id;
        $product->product_name = $request->product_name;
        $product->description = $request->description;
        $product->price = $request->price;
        $product->brand = $request->brand;

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

    // Remove the specified product from the database
    public function destroy($id)
    {
        $product = Products::findOrFail($id); // Use 'Products' instead of 'Product'
        if ($product->product_image) {
            Storage::disk('public')->delete($product->product_image);
        }
        $product->delete();

        return response()->json(null, 204);
    }
}