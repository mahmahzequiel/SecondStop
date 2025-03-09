<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function index(Request $request)
{
    $status = $request->query('status', 'active');

    $query = User::with('profile'); // Include profile relationship

    if ($status === 'archived') {
        $query->onlyTrashed();
    } elseif ($status === 'all') {
        $query->withTrashed();
    }

    $users = $query->get();

    return response()->json([
        'status' => 'success',
        'data' => [
            'users' => $users
        ]
    ]);
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
    
        $user->delete(); // Soft delete the user
        return response()->json(['status' => 'success', 'message' => 'User archived successfully.', 'data' => $user]);
    }

// Restore user
public function restore($id)
{
    $user = User::withTrashed()->find($id); // Find the user including soft-deleted ones
    if (!$user) {
        return response()->json(['status' => 'error', 'message' => 'User not found.'], 404);
    }

    $user->restore(); // Restore the user
    return response()->json(['status' => 'success', 'message' => 'User restored successfully.', 'data' => $user]);
}

public function bulkArchiveRestore(Request $request)
{
    $ids = $request->input('user_ids');
    $action = $request->input('action'); // 'archive' or 'restore'

    if (!in_array($action, ['archive', 'restore'])) {
        return response()->json(['status' => 'error', 'message' => 'Invalid action.'], 400);
    }

    if ($action === 'archive') {
        User::whereIn('id', $ids)->delete(); // Soft delete users
    } else {
        User::withTrashed()->whereIn('id', $ids)->restore(); // Restore users
    }

    return response()->json(['status' => 'success', 'message' => 'Users updated successfully.']);
}

    
}