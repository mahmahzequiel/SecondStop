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
}
