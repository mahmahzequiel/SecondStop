<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Address;
use App\Models\Profile;
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
        $profile = Profile::where('user_id', $userId)->first();

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

        $addresses = Address::where('user_id', $userId)->get();

        $response = [
            'user' => [
                'first_name' => $profile->first_name,
                'last_name'  => $profile->last_name,
                'phone_number' => $profile->phone_number,
            ],
            'addresses' => $addresses->map(function ($address) {
                return [
                    'id' => $address->id,
                    'receiver_fullname' => $address->receiver_fullname,
                    'contact_number' => $address->contact_number,
                    'house_number' => $address->house_number,
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
     * Store a new address for a user. Only one default address per user.
     */
    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($request->is_default) {
            Address::where('user_id', $user->id)->update(['is_default' => 0]);
        }

        $address = Address::create([
            'user_id' => $user->id,
            'receiver_fullname' => $request->receiver_fullname,
            'contact_number' => $request->contact_number,
            'house_number' => $request->house_number,
            'street' => $request->street,
            'barangay' => $request->barangay,
            'city' => $request->city,
            'state' => $request->state,
            'country' => $request->country,
            'region' => $request->region,
            'postal_code' => $request->postal_code,
            'is_default' => $request->is_default ? 1 : 0,
        ]);

        return response()->json([
            'address' => $address
        ], Response::HTTP_CREATED);
    }

    /**
     * Update an existing address. Unset old default if a new default is chosen.
     */
    public function update(Request $request, $id)
    {
        $address = Address::find($id);
        if (!$address) {
            return response()->json(['message' => 'Address not found'], Response::HTTP_NOT_FOUND);
        }

        $validatedData = $request->validate([
            'receiver_fullname' => 'sometimes|string|max:255',
            'phone_number'      => 'sometimes|string|max:50',
            'house_number' => 'sometimes|string|max:50',
            'street' => 'sometimes|string|max:255',
            'barangay' => 'sometimes|string|max:100',
            'city' => 'sometimes|string|max:100',
            'state' => 'sometimes|string|max:100',
            'region' => 'sometimes|string|max:100',
            'country' => 'sometimes|string|max:100',
            'postal_code' => 'sometimes|string|max:20',
            'is_default' => 'sometimes|boolean',
        ]);

        if (isset($validatedData['is_default']) && $validatedData['is_default'] == true) {
            Address::where('user_id', $address->user_id)->update(['is_default' => 0]);
            $validatedData['is_default'] = 1;
        } else if (isset($validatedData['is_default']) && $validatedData['is_default'] == false) {
            $validatedData['is_default'] = 0;
        }

        $address->update($validatedData);

        return response()->json([
            'message' => 'Address updated successfully',
            'address' => $address
        ], Response::HTTP_OK);
    }

    /**
     * Delete (soft-delete) a single address by ID.
     */
    public function destroy($id)
    {
        $address = Address::find($id);
        if (!$address) {
            return response()->json(['message' => 'Address not found'], Response::HTTP_NOT_FOUND);
        }

        // Unset default if it's currently default
        if ($address->is_default == 1) {
            $address->is_default = 0;
            $address->save();
    }

    $address->delete();

    return response()->json(['message' => 'Address archived successfully'], Response::HTTP_OK);
    }

    /**
     * Get archived (soft-deleted) addresses for the authenticated user.
     */
    public function archived(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $archived = Address::onlyTrashed()->where('user_id', $user->id)->get();

        return response()->json([
            'archived' => $archived
        ], Response::HTTP_OK);
    }

    /**
     * Restore an archived address.
     */
    public function restore($id)
    {
        $address = Address::withTrashed()->find($id);
        if (!$address) {
            return response()->json(['message' => 'Address not found'], Response::HTTP_NOT_FOUND);
        }
        $address->restore();
        return response()->json(['address' => $address], Response::HTTP_OK);
    }
}