<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Address;
use App\Models\Profile; // Make sure to import the Profile model
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

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
        // Fetch user profile details
        $profile = Profile::where('user_id', $userId)->first();

        // If profile does not exist, return a default response
        if (!$profile) {
            return response()->json([
                'user' => [
                    'first_name' => 'Unknown',
                    'last_name' => 'User',
                    'phone_number' => 'N/A'
                ],
                'addresses' => []
            ], Response::HTTP_OK);
        }

        // Fetch addresses
        $addresses = Address::where('user_id', $userId)->get();

        // Prepare response
        $response = [
            'user' => [
                'first_name' => $profile->first_name,
                'last_name' => $profile->last_name,
                'phone_number' => $profile->phone_number,
            ],
            'addresses' => $addresses->map(function ($address) {
                return [
                    'street' => $address->street,
                    'barangay' => $address->barangay,
                    'city' => $address->city,
                    'state' => $address->state,
                    'region' => $address->region,
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
    public function store(Request $request)
    {
        $user = auth()->user(); // Get the authenticated user

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $address = Address::create([
            'user_id' => $user->id, // Assign the authenticated user's ID
            'street' => $request->street,
            'barangay' => $request->barangay,
            'city' => $request->city,
            'state' => $request->state,
            'country' => $request->country,
            'region' => $request->region,
            'postal_code' => $request->postal_code,
            'is_default' => $request->is_default ?? 0,
        ]);

        return response()->json($address, 201);
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

    public function storeOrUpdate(Request $request)
    {
        \Log::info('storeOrUpdate method called'); // Log the method call
        $user = Auth::user(); // Get the authenticated user

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Check if the user already has an address
        $address = Address::where('user_id', $user->id)->first();

        if ($address) {
            // Update existing address
            $address->update($request->all());
            return response()->json(['message' => 'Address updated successfully', 'address' => $address]);
        } else {
            // Create a new address
            $newAddress = Address::create([
                'user_id' => $user->id,
                'street' => $request->street,
                'barangay' => $request->barangay,
                'city' => $request->city,
                'state' => $request->state,
                'country' => $request->country,
                'region' => $request->region,
                'postal_code' => $request->postal_code,
            ]);
            return response()->json(['message' => 'Address created successfully', 'address' => $newAddress]);
        }
    }
}
