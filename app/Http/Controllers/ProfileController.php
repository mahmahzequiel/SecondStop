<?php

// app/Http/Controllers/ProfileController.php
namespace App\Http\Controllers;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    // Other methods remain the same...

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
}