<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('profile')->get();
        return view('users.index', compact('users'));
    }

    public function create()
    {
        return view('users.create');
    }

    public function store(Request $request)
    {
        $user = User::create($request->only(['role_id', 'username', 'email', 'password']));
        return redirect()->route('users.index');
    }

    // ✅ Login Function
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'login' => 'required', // Can be email or username
            'password' => 'required'
        ]);

        // Check if the user exists by email or username
        $user = User::where('email', $credentials['login'])
                    ->orWhere('username', $credentials['login'])
                    ->first();

        if ($user && Auth::attempt(['email' => $user->email, 'password' => $credentials['password']])) {
            // ✅ Redirect to main page after successful login
            return redirect()->route('mainpage')->with('success', 'Login successful!');
        }

        // ❌ Login failed
        return back()->withErrors(['login' => 'Invalid username/email or password.']);
    }

    // Archive user
public function archive($id)
{
    $user = User::find($id);
    if (!$user) {
        return response()->json(['status' => 'error', 'message' => 'User not found.'], 404);
    }

    $user->status = 'Archived';
    $user->save();

    return response()->json(['status' => 'success', 'message' => 'User archived successfully.', 'data' => $user]);
}

// Restore user
public function restore($id)
{
    $user = User::find($id);
    if (!$user) {
        return response()->json(['status' => 'error', 'message' => 'User not found.'], 404);
    }

    $user->status = 'Active';
    $user->save();

    return response()->json(['status' => 'success', 'message' => 'User restored successfully.', 'data' => $user]);
}


public function bulkArchiveRestore(Request $request)
{
    $ids = $request->input('user_ids');
    $newStatus = $request->input('status');

    if (!in_array($newStatus, ['Active', 'Archived'])) {
        return response()->json(['status' => 'error', 'message' => 'Invalid status.'], 400);
    }

    User::whereIn('id', $ids)->update(['status' => $newStatus]);

    return response()->json(['status' => 'success', 'message' => 'Users updated successfully.']);
}

    
}