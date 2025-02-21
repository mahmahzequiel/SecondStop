<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Profile;
use App\Models\User; // Import the User model
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash; // Import Hash facade

class ApiController extends Controller
{
    // POST [first_name, middle_name, last_name, sex, phone_number, username, email, password]
    public function register(Request $request)
{
    // Validation
    $request->validate([
        "first_name"   => "required|string|max:255",
        "middle_name"  => "nullable|string|max:255",
        "last_name"    => "required|string|max:255",
        "sex"          => "required|in:Male,Female",
        "phone_number" => "required|string|max:15|unique:profiles",
        "username"     => "required|string|max:255|unique:profiles",
        "email"        => "required|string|email|max:255|unique:users",
        "password"     => "required|string|confirmed|min:8" // Ensure password_confirmation is present
    ]);

    // Create User first
    $user = User::create([
        "role_id"  => 1, // Default role
        "username" => $request->username,
        "email"    => $request->email,
        "password" => bcrypt($request->password),
    ]);

    // Create Profile and link it to the User
    $profile = Profile::create([
        "user_id"      => $user->id, // Link to user
        "first_name"   => $request->first_name,
        "middle_name"  => $request->middle_name,
        "last_name"    => $request->last_name,
        "sex"          => $request->sex,
        "phone_number" => $request->phone_number,
        "username"     => $request->username,
        "email"        => $request->email
    ]);

    return response()->json([
        "status"  => true,
        "message" => "User registered successfully",
        "data"    => [
            "user"    => $user,
            "profile" => $profile
        ]
    ], 201); // HTTP 201: Created
}

    public function updateProfile(Request $request)
    {
        $user = Auth::user(); // Use Auth facade for authenticated user

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthorized access',
            ], 401);
        }

        $request->validate([
            'first_name'   => 'required|string|max:255',
            'last_name'    => 'required|string|max:255',
            'email'        => 'required|email|max:255|unique:profiles,email,' . $user->id,
            'phone_number' => 'required|string|max:15|unique:profiles,phone_number,' . $user->id, // Fixed field name
            'address'      => 'nullable|string|max:500',
            'middle_name'  => 'nullable|string|max:255',
        ]);

        try {
            // Check if the user already has a profile
            $profile = Profile::where('user_id', $user->id)->first();

            if ($profile) {
                // If profile exists, update it
                $profile->update([
                    'first_name'   => $request->first_name,
                    'middle_name'  => $request->middle_name,
                    'last_name'    => $request->last_name,
                    'address'      => $request->address,
                    'phone_number' => $request->phone_number, // Match validation field
                    'email'        => $request->email,
                ]);
            } else {
                // If no profile exists, create a new one
                $profile = Profile::create([
                    'user_id'      => $user->id, // Assign user_id automatically
                    'first_name'   => $request->first_name,
                    'middle_name'  => $request->middle_name,
                    'last_name'    => $request->last_name,
                    'address'      => $request->address,
                    'phone_number' => $request->phone_number,
                    'email'        => $request->email,
                ]);
            }

            return response()->json([
                'status'  => true,
                'message' => 'Profile updated successfully',
                'profile' => $profile
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => false,
                'message' => 'Profile update failed',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request)
{
    $request->validate([
        'email'    => 'required|email',
        'password' => 'required'
    ]);

    if (!auth()->attempt($request->only('email', 'password'))) {
        return response()->json([
            'status'  => false,
            'message' => 'Invalid login credentials'
        ], 401);
    }

    $user = auth()->user();
    
    // Generate access token using Passport
    $tokenResult = $user->createToken('authToken'); 

    return response()->json([
        'status'       => true,
        'message'      => 'Login successful',
        'access_token' => $tokenResult->accessToken,  // ✅ Correct property for Passport
        'token_type'   => 'Bearer',
        'user'         => $user
    ]);
}

}