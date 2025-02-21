<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class BrandController extends Controller
{
    /**
     * Display a listing of the brands.
     */
    public function index()
    {
        $brands = Brand::all();

        return response()->json([
            'success' => true,
            'data' => $brands
        ]);
    }

    /**
     * Store a newly created brand in storage.
     */
    public function store(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|string|unique:brands|max:255',
            ]);

            $brand = Brand::create($validatedData);

            return response()->json([
                'success' => true,
                'message' => 'Brand created successfully!',
                'data' => $brand
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Something went wrong!',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified brand.
     */
    public function show(Brand $brand)
    {
        return response()->json([
            'success' => true,
            'data' => $brand
        ]);
    }

    /**
     * Update the specified brand in storage.
     */
    public function update(Request $request, Brand $brand)
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|string|unique:brands,name,' . $brand->id . '|max:255',
            ]);

            $brand->update($validatedData);

            return response()->json([
                'success' => true,
                'message' => 'Brand updated successfully!',
                'data' => $brand
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Something went wrong!',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified brand from storage.
     */
    public function destroy(Brand $brand)
    {
        try {
            $brand->delete();

            return response()->json([
                'success' => true,
                'message' => 'Brand deleted successfully!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete brand!',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}