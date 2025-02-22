<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class ApiController extends Controller
{
    // Register a new user and create an associated profile.
    public function register(Request $request)
    {
        $request->validate([
            "first_name"   => "required|string|max:255",
            "middle_name"  => "nullable|string|max:255",
            "last_name"    => "required|string|max:255",
            "sex"          => "required|in:Male,Female,Other",
            "phone_number" => "required|string|max:15|unique:profiles",
            "username"     => "required|string|max:255|unique:profiles",
            "email"        => "required|string|email|max:255|unique:users",
            "password"     => "required|string|confirmed|min:8"
        ]);

        // Create User.
        $user = User::create([
            "role_id"  => 1, // Default role.
            "username" => $request->username,
            "email"    => $request->email,
            "password" => bcrypt($request->password),
        ]);

        // Create Profile linked to the User.
        $profile = Profile::create([
            "user_id"      => $user->id,
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
        ]);
    }

    // Login user and return an access token.
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
        $tokenResult = $user->createToken('authToken');

        return response()->json([
            'status'       => true,
            'message'      => 'Login successful',
            'access_token' => $tokenResult->accessToken,
            'token_type'   => 'Bearer',
            'user'         => $user
        ]);
    }

    // Retrieve the authenticated user's profile.
    public function profile(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'status'  => false,
                'message' => 'Unauthenticated'
            ], 401);
        }

        // Retrieve the profile (assuming Profile is linked via user_id).
        $profile = Profile::where('user_id', $user->id)->first();

        return response()->json([
            'status'  => true,
            'message' => 'Profile retrieved successfully',
            'user'    => $user,
            'profile' => $profile
        ]);
    }

    // Update the authenticated user's profile.
    public function updateProfile(Request $request)
    {
        $user = Auth::user();

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
            'phone_number' => 'required|string|max:15|unique:profiles,phone_number,' . $user->id,
            'address'      => 'nullable|string|max:500',
            'middle_name'  => 'nullable|string|max:255',
        ]);

        try {
            $profile = Profile::where('user_id', $user->id)->first();

            if ($profile) {
                $profile->update([
                    'first_name'   => $request->first_name,
                    'middle_name'  => $request->middle_name,
                    'last_name'    => $request->last_name,
                    'address'      => $request->address,
                    'phone_number' => $request->phone_number,
                    'email'        => $request->email,
                ]);
            } else {
                $profile = Profile::create([
                    'user_id'      => $user->id,
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

    // Logout the authenticated user.
    public function logout(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'status'  => false,
                'message' => 'Unauthenticated'
            ], 401);
        }
        
        $user->token()->revoke();
        return response()->json([
            'status'  => true,
            'message' => 'Successfully logged out'
        ]);
    }
}