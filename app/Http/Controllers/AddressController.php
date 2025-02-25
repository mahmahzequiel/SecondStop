<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Address;
use App\Models\Profile; // Make sure to import the Profile model
use Illuminate\Http\Response;

class AddressController extends Controller
{
    /**
     * Get all addresses.
     */
    public function index()
    {
        return response()->json(Address::all(), Response::HTTP_OK);
    }

    /**
     * Get all addresses by user ID with user profile details.
     */
    public function getByUser($userId)
{
    $addresses = Address::where('user_id', $userId)->get();

    if ($addresses->isEmpty()) {
        return response()->json(['message' => 'No addresses found'], Response::HTTP_NOT_FOUND);
    }

    // Fetch user profile details using user_id
    $profile = Profile::where('user_id', $userId)->first();

    if (!$profile) {
        return response()->json(['message' => 'User profile not found'], Response::HTTP_NOT_FOUND);
    }

    // Merge profile details with address data
    $response = [
        'user' => [
            'first_name' => $profile->first_name,
            'last_name' => $profile->last_name,
            'phone_number' => $profile->phone_number,
        ],
        'addresses' => $addresses->map(function ($address) {
            return [
                'street' => $address->street,
                'barangay' => $address->barangay, // ✅ Added barangay
                'city' => $address->city,
                'state' => $address->state,
                'region' => $address->region, // ✅ Added region
                'country' => $address->country,
                'postal_code' => $address->postal_code,
                'is_default' => $address->is_default,
            ];
        }),
    ];

    return response()->json($response, Response::HTTP_OK);
}


    /**
     * Store a new address for a user.
     */
    public function store(Request $request, $userId)
    {
        $validatedData = $request->validate([
            'street' => 'required|string|max:255',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'country' => 'required|string|max:100',
            'postal_code' => 'required|string|max:20',
            'is_default' => 'sometimes|boolean',
        ]);

        $address = Address::create(array_merge($validatedData, ['user_id' => $userId]));

        return response()->json($address, Response::HTTP_CREATED);
    }

    /**
     * Update an existing address.
     */
    public function update(Request $request, $id)
{
    $address = Address::find($id);

    if (!$address) {
        return response()->json(['message' => 'Address not found'], Response::HTTP_NOT_FOUND);
    }

    $validatedData = $request->validate([
        'street' => 'sometimes|string|max:255',
        'house_no' => 'sometimes|string|max:50',
        'barangay' => 'sometimes|string|max:100',
        'city' => 'sometimes|string|max:100',
        'state' => 'sometimes|string|max:100',
        'region' => 'sometimes|string|max:100',
        'country' => 'sometimes|string|max:100',
        'postal_code' => 'sometimes|string|max:20',
        'is_default' => 'sometimes|boolean',
    ]);

    $address->update($validatedData);

    return response()->json([
        'message' => 'Address updated successfully',
        'address' => $address
    ], Response::HTTP_OK);
}

    /**
     * Delete a single address by ID.
     */
    public function destroy($id)
    {
        $address = Address::find($id);

        if (!$address) {
            return response()->json(['message' => 'Address not found'], Response::HTTP_NOT_FOUND);
        }

        $address->delete();

        return response()->json(['message' => 'Address deleted successfully'], Response::HTTP_OK);
    }

    /**
     * Delete all addresses for a user.
     */
    public function deleteByUser($userId)
    {
        $deleted = Address::where('user_id', $userId)->delete();

        if ($deleted) {
            return response()->json(['message' => 'All addresses deleted successfully'], Response::HTTP_OK);
        }

        return response()->json(['message' => 'No addresses found'], Response::HTTP_NOT_FOUND);
    }
}
