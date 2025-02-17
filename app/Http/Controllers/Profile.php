<?php

// app/Http/Controllers/ProfileController.php
namespace App\Http\Controllers;

use App\Models\Profile;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function index()
    {
        $profiles = Profile::with('user')->get();
        return view('profiles.index', compact('profiles'));
    }

    public function create()
    {
        return view('profiles.create');
    }

    public function store(Request $request)
    {
        Profile::create($request->all());
        return redirect()->route('profiles.index');
    }

    // Add other methods (show, edit, update, destroy) as needed
}
