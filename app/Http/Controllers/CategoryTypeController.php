<?php

namespace App\Http\Controllers;

use App\Models\CategoryType;
use Illuminate\Http\Request;

class CategoryTypeController extends Controller
{
    /**
     * Display a listing of category types.
     */
    public function index()
{
    $categoryTypes = CategoryType::with('category')->get();
    return response()->json($categoryTypes); // Return JSON instead of a view
}

    /**
     * Show the form for creating a new category type.
     */
    public function create()
    {
        return view('category_types.create');
    }

    /**
     * Store a newly created category type.
     */
    public function store(Request $request)
    {
        $request->validate([
            'category_type' => 'required|string|max:255|unique:category_types,category_type',
        ]);

        // Create the category type
        CategoryType::create([
            'category_type' => $request->category_type,
        ]);

        return redirect()->route('category-types.index')->with('success', 'Category type created successfully!');
    }

    /**
     * Display the specified category type.
     */
    public function show(CategoryType $categoryType)
    {
        return view('category_types.show', compact('categoryType'));
    }

    /**
     * Show the form for editing the specified category type.
     */
    public function edit(CategoryType $categoryType)
    {
        return view('category_types.edit', compact('categoryType'));
    }

    /**
     * Update the specified category type.
     */
    public function update(Request $request, CategoryType $categoryType)
    {
        $request->validate([
            'category_type' => 'required|string|max:255|unique:category_types,category_type,' . $categoryType->id,
        ]);

        // Update the category type
        $categoryType->update([
            'category_type' => $request->category_type,
        ]);

        return redirect()->route('category-types.index')->with('success', 'Category type updated successfully!');
    }

    /**
     * Remove the specified category type.
     */
    public function destroy(CategoryType $categoryType)
    {
        $categoryType->delete(); // Delete the category type
        return redirect()->route('category-types.index')->with('success', 'Category type deleted successfully!');
    }

    
}