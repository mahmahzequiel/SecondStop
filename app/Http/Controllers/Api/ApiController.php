<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

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
    public function updateProfile(Request $request)
{
    $currentUser = Auth::user();
    if (!$currentUser) {
        return response()->json([
            'status'  => false,
            'message' => 'Unauthorized access',
        ], 401);
    }
    
    // If an admin is updating another user's profile, expect a 'user_id' in the request.
    if ($currentUser->role_id == 2 && $request->has('user_id')) {
        $customer = User::find($request->user_id);
        if (!$customer) {
            return response()->json([
                'status'  => false,
                'message' => 'User not found',
            ], 404);
        }
    } else {
        // Otherwise, update the current user's own profile.
        $customer = $currentUser;
    }
    
    // Retrieve or create the profile for the target customer.
    $profile = $customer->profile ?? new Profile(['user_id' => $customer->id]);

    // Validate using the target customer's id for the email uniqueness rule.
    $request->validate([
        'first_name'    => 'required|string|max:255',
        'middle_name'   => 'nullable|string|max:255',
        'role_id'       => 'sometimes|integer|in:1,2',
        'last_name'     => 'required|string|max:255',
        'username'      => 'required|string|max:255|unique:profiles,username,' . $profile->id,
        'email'         => 'required|email|max:255|unique:users,email,' . $customer->id,
        'phone_number'  => 'required|string|max:15|unique:profiles,phone_number,' . $profile->id,
        'sex'           => 'required|in:Male,Female,Other',
        'profile_image' => 'nullable|file|image|max:2048',
    ]);

    try {
        // Update profile fields
        $profile->first_name   = $request->first_name;
        $profile->middle_name  = $request->middle_name;
        $profile->last_name    = $request->last_name;
        $profile->username     = $request->username;
        $profile->email        = $request->email;
        $profile->phone_number = $request->phone_number;
        $profile->sex          = $request->sex;

        // Handle profile image upload if provided
        if ($request->hasFile('profile_image')) {
            // Delete old image if it exists
            if ($profile->profile_image) {
                Storage::disk('public')->delete($profile->profile_image);
            }
            
            $file = $request->file('profile_image');
            $path = $file->store('profiles', 'public');
            $profile->profile_image = $path;
        }
        
        $profile->save();

        // Update the user's email and role_id in the users table
        $customer->email = $request->email;
        $customer->role_id = $request->role_id; // Add this line to update the role_id
        $customer->save();

        return response()->json([
            'status'  => true,
            'message' => 'Profile updated successfully',
            'profile' => $profile,
            'user'    => $customer, // Include updated user info in response to confirm role change
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status'  => false,
            'message' => 'Profile update failed',
            'error'   => $e->getMessage(),
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


public function forgotPassword(Request $request)
{
    $request->validate(['email' => 'required|email']);

    $user = \App\Models\User::where('email', $request->email)->first();

    if (!$user) {
        return response()->json([
            'status' => false,
            'message' => 'User with this email does not exist.'
        ], 404);
    }

    // Generate a 4-digit OTP
    $otp = rand(1000, 9999);

    // Optionally store the OTP in your password_resets table (or another table) for later verification
    \DB::table('password_resets')->updateOrInsert(
        ['email' => $request->email],
        ['token' => $otp, 'created_at' => now()]
    );

    // Return the OTP directly in the response (for this demo flow)
    return response()->json([
        'status' => true,
        'message' => 'OTP generated successfully.',
        'otp' => $otp
    ]);
}


public function resetPassword(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'new_password' => 'required|string|min:8'
        // Optionally, you can require 'otp' if you want to verify it here.
    ]);

    // Verify that the user exists
    $user = \App\Models\User::where('email', $request->email)->first();
    if (!$user) {
        return response()->json([
            'status' => false,
            'message' => 'User with this email does not exist.'
        ], 404);
    }

    // Optionally, verify the OTP here by comparing with what was stored in the password_resets table
    // For example:
    $record = \DB::table('password_resets')->where('email', $request->email)->first();
    if (!$record || $record->token != $request->otp) {
        return response()->json([
            'status' => false,
            'message' => 'Invalid or expired OTP.'
        ], 400);
    }

    // Update the user's password
    $user->password = bcrypt($request->new_password);
    $user->save();

    // Optionally, delete the password reset record
    \DB::table('password_resets')->where('email', $request->email)->delete();

    return response()->json([
        'status' => true,
        'message' => 'Password reset successfully.'
    ]);
}
}