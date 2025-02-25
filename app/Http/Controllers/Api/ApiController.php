<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ApiController extends Controller
{
    // Register user + profile
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

        // Default role_id = 1 => "Customer" or "User"
        $user = User::create([
            "role_id"  => 1, 
            "username" => $request->username,
            "email"    => $request->email,
            "password" => bcrypt($request->password),
        ]);

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

        $token = $user->createToken('authToken')->accessToken;

        return response()->json([
            "status"  => true,
            "message" => "User registered successfully",
            "data"    => [
                "user"         => $user,
                "profile"      => $profile,
                "access_token" => $token
            ]
        ]);
    }

    // Login user (email + password) => token
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

    // Return profile of logged-in user
    public function profile()
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthenticated'
            ], 401);
        }

        $profile = $user->profile; // or Profile::where('user_id', $user->id)->first();

        return response()->json([
            'status'  => true,
            'message' => 'Profile retrieved successfully',
            'user'    => $user,
            'profile' => $profile
        ]);
    }

    // Update profile (must be logged in)
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
            $profile = $user->profile; 
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

    // Logout
    public function logout()
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

    // Fetch all users (admin only)
    public function getAllUsers()
    {
        $authUser = Auth::user();
        if (!$authUser) {
            return response()->json([
                'status'  => false,
                'message' => 'Unauthenticated'
            ], 401);
        }

        // If role_id !== 2 => Not admin
        if ($authUser->role_id !== 2) {
            return response()->json([
                'status'  => false,
                'message' => 'Forbidden: Only admins can access this.'
            ], 403);
        }

        // Eager load profile AND role if you want role info as well
        // For now, just 'profile' as in your code
        $users = User::with('profile')->get();

        return response()->json([
            'status' => true,
            'message' => 'All users retrieved successfully',
            'data' => [
                'users' => $users
            ]
        ]);
    }
}
