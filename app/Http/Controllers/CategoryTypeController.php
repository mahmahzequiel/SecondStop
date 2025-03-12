<?php

namespace App\Http\Controllers;

use App\Models\CategoryType;
use Illuminate\Http\Request;

class CategoryTypeController extends Controller
{
    /**
     * Display a listing of category types based on status.
     */
    public function index(Request $request)
    {
        $status = $request->query('status', 'active');
        
        if ($status === 'archived') {
            // Get only soft deleted (archived) records
            $categoryTypes = CategoryType::onlyTrashed()->with('category')->get();
        } else {
            // Get only active records
            $categoryTypes = CategoryType::with('category')->get();
        }
        
        return response()->json($categoryTypes);
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
        $categoryType = CategoryType::create([
            'category_type' => $request->category_type,
        ]);

        // Check if this is an API request
        if ($request->expectsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Category type created successfully!',
                'data' => $categoryType
            ], 201);
        }

        // For web requests, return a redirect
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

        // Check if this is an API request
        if ($request->expectsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Category type updated successfully!',
                'data' => $categoryType
            ]);
        }

        // For web requests, return a redirect
        return redirect()->route('category-types.index')->with('success', 'Category type updated successfully!');
    }

    /**
     * Soft delete (archive) the specified category type.
     */
    public function destroy(Request $request, CategoryType $categoryType)
    {
        try {
            $categoryType->delete(); // Soft delete the category type
            
            // Check if this is an API request
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Category type archived successfully!'
                ]);
            }
            
            // For web requests, return a redirect
            return redirect()->route('category-types.index')
                ->with('success', 'Category type archived successfully!');
        } catch (\Exception $e) {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to archive category type',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return redirect()->back()
                ->with('error', 'Failed to archive category type: ' . $e->getMessage());
        }
    }
    
    /**
     * Restore a soft-deleted category type.
     */
    public function restore(Request $request, $id)
    {
        try {
            // Find the trashed category type
            $categoryType = CategoryType::onlyTrashed()->findOrFail($id);
            $categoryType->restore();
            
            // Check if this is an API request
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Category type restored successfully!'
                ]);
            }
            
            // For web requests, return a redirect
            return redirect()->route('category-types.index')
                ->with('success', 'Category type restored successfully!');
        } catch (\Exception $e) {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to restore category type',
                    'error' => $e->getMessage()
                ], 500);
            }
            
            return redirect()->back()
                ->with('error', 'Failed to restore category type: ' . $e->getMessage());
        }
    }
}