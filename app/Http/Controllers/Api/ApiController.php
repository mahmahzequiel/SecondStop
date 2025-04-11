<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;

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
            "role_id"  => $request->role_id ?? 1, 
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
    public function update(Request $request)
    {
        // Validate the request
        $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'sex' => 'required|in:Male,Female,Other',
            'phone_number' => 'required|string|max:20',
            
            // These fields go to the users table
            'username' => 'required|string|max:100',
            'email' => 'required|email|max:100',
            'role_id' => 'sometimes|integer|in:1,2',
            
            'profile_image' => 'nullable|image|max:2048', // 2MB max
        ]);

        // Get the user to update (either current user or specified user_id for admins)
        $userId = $request->input('user_id') ?? Auth::id();
        $user = User::findOrFail($userId);
        $profile = $user->profile;

        // Update USER fields
        $user->username = $request->input('username');
        $user->email = $request->input('email');
        
        // Update role_id if provided
        if ($request->has('role_id')) {
            $user->role_id = $request->input('role_id');
        }
        
        $user->save();

        // Update PROFILE fields
        $profile->first_name = $request->input('first_name');
        $profile->middle_name = $request->input('middle_name');
        $profile->last_name = $request->input('last_name');
        $profile->sex = $request->input('sex');
        $profile->phone_number = $request->input('phone_number');
        $profile->email = $request->input('email'); // Keep in sync with user email
        
        // Handle profile image upload if provided
        if ($request->hasFile('profile_image')) {
            // Delete old image if it exists and is not the default
            if ($profile->profile_image && $profile->profile_image !== 'default.jpg') {
                Storage::disk('public')->delete($profile->profile_image);
            }
            
            // Store the new image
            $path = $request->file('profile_image')->store('profile_images', 'public');
            $profile->profile_image = $path;
        }

        $profile->save();

        // Return the updated profile with user data
        $updatedUser = User::with('profile')->find($userId);

        return response()->json([
            'status' => true,
            'message' => 'Profile updated successfully',
            'profile' => $updatedUser->profile,
            'user' => $updatedUser
        ]);
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

    public function changePassword(Request $request)
{
    $request->validate([
        'current_password' => 'required|string',
        'new_password' => 'required|string|min:8|confirmed',
    ]);

    $user = Auth::user();

    if (!Hash::check($request->current_password, $user->password)) {
        return response()->json([
            'status' => false,
            'message' => 'Current password is incorrect'
        ], 401);
    }

    $user->password = Hash::make($request->new_password);
    $user->save();

    return response()->json([
        'status' => true,
        'message' => 'Password changed successfully'
    ]);
}
}