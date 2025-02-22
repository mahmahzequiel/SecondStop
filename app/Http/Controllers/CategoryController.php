<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories.
     */
    public function index()
    {
        $categories = Category::all();
        return response()->json($categories); // Return JSON instead of a view
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request)
    {
        $request->validate([
            'category_name' => 'required|string|max:50|unique:categories,category_name',
        ]);

        // Create the category
        $category = Category::create([
            'category_name' => $request->category_name,
        ]);

        return response()->json(['message' => 'Category created successfully!', 'category' => $category], 201);
    }

    /**
     * Display the specified category.
     */
    public function show(Category $category)
    {
        return response()->json($category);
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, Category $category)
    {
        $request->validate([
            'category_name' => 'required|string|max:50|unique:categories,category_name,' . $category->id,
        ]);

        // Update the category
        $category->update([
            'category_name' => $request->category_name,
        ]);

        return response()->json(['message' => 'Category updated successfully!', 'category' => $category]);
    }

    /**
     * Remove the specified category.
     */
    public function destroy(Category $category)
    {
        $category->delete(); // Soft delete the category
        return response()->json(['message' => 'Category deleted successfully!']);
    }

    /**
     * Restore a soft-deleted category.
     */
    public function restore($id)
    {
        $category = Category::withTrashed()->findOrFail($id);
        $category->restore();

        return response()->json(['message' => 'Category restored successfully!', 'category' => $category]);
    }

    /**
     * Permanently delete the category.
     */
    public function forceDelete($id)
    {
        $category = Category::withTrashed()->findOrFail($id);
        $category->forceDelete();

        return response()->json(['message' => 'Category permanently deleted!']);
    }
}
