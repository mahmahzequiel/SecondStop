<?php

// app/Http/Controllers/CategoryController.php
namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\CategoryType;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories.
     */
    public function index()
    {
        $categories = Category::with('types')->get();
        return view('categories.index', compact('categories'));
    }

    /**
     * Show the form for creating a new category.
     */
    public function create()
    {
        return view('categories.create');
    }

    /**
     * Store a newly created category and its types.
     */
    public function store(Request $request)
    {
        $request->validate([
            'category_name' => 'required|string|max:255',
            'category_types' => 'required|array',
            'category_types.*' => 'string|max:255',
        ]);

        // Create the category
        $category = Category::create([
            'category_name' => $request->category_name,
        ]);

        // Add category types
        foreach ($request->category_types as $type) {
            $category->types()->create([
                'category_type' => $type,
            ]);
        }

        return redirect()->route('categories.index')->with('success', 'Category created successfully!');
    }

    /**
     * Display the specified category and its types.
     */
    public function show(Category $category)
    {
        return view('categories.show', compact('category'));
    }

    /**
     * Show the form for editing the specified category.
     */
    public function edit(Category $category)
    {
        return view('categories.edit', compact('category'));
    }

    /**
     * Update the specified category and its types.
     */
    public function update(Request $request, Category $category)
    {
        $request->validate([
            'category_name' => 'required|string|max:255',
            'category_types' => 'required|array',
            'category_types.*' => 'string|max:255',
        ]);

        // Update the category
        $category->update([
            'category_name' => $request->category_name,
        ]);

        // Delete existing types and add new ones
        $category->types()->delete();
        foreach ($request->category_types as $type) {
            $category->types()->create([
                'category_type' => $type,
            ]);
        }

        return redirect()->route('categories.index')->with('success', 'Category updated successfully!');
    }

    /**
     * Remove the specified category and its types.
     */
    public function destroy(Category $category)
    {
        $category->types()->delete(); // Delete associated types
        $category->delete(); // Delete the category

        return redirect()->route('categories.index')->with('success', 'Category deleted successfully!');
    }
}