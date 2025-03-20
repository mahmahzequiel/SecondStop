<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    /**
     * Display a listing of the roles.
     */
    public function index(Request $request)
    {
        // Include both active and soft-deleted (archived) roles
        $includeArchived = $request->query('include_archived', 'true');
        
        if ($includeArchived === 'true') {
            return response()->json(Role::withTrashed()->get());
        }
        
        return response()->json(Role::all());
    }

    /**
     * Store a newly created role in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'role_name' => 'required|string|max:255|unique:roles,role_name',
            'description' => 'nullable|string|max:200',
        ]);

        $role = Role::create([
            'role_name' => $request->role_name,
            'description' => $request->description,
        ]);

        return response()->json(['message' => 'Role created successfully', 'role' => $role], 201);
    }

    /**
     * Display the specified role.
     */
    public function show($id)
    {
        $role = Role::withTrashed()->findOrFail($id);
        return response()->json($role);
    }

    /**
     * Update the specified role in storage.
     */
    public function update(Request $request, $id)
    {
        $role = Role::withTrashed()->findOrFail($id);

        $request->validate([
            'role_name' => 'required|string|max:255|unique:roles,role_name,' . $id,
            'description' => 'nullable|string|max:200',
        ]);

        $role->update([
            'role_name' => $request->role_name,
            'description' => $request->description,
        ]);

        return response()->json(['message' => 'Role updated successfully', 'role' => $role]);
    }

    /**
     * Remove the specified role from storage (soft delete).
     */
    public function destroy($id)
    {
        $role = Role::findOrFail($id);
        $role->delete();

        return response()->json(['message' => 'Role deleted successfully']);
    }

    /**
     * Archive a role (soft delete).
     */
    public function archive($id)
    {
        $role = Role::findOrFail($id);
        $role->delete(); // This performs soft delete since it's enabled in the model

        return response()->json(['message' => 'Role archived successfully']);
    }

    /**
     * Restore a soft-deleted role.
     */
    public function restore($id)
    {
        $role = Role::onlyTrashed()->findOrFail($id);
        $role->restore();

        return response()->json(['message' => 'Role restored successfully']);
    }

    /**
     * Permanently delete a role.
     */
    public function forceDelete($id)
    {
        $role = Role::withTrashed()->findOrFail($id);
        $role->forceDelete();

        return response()->json(['message' => 'Role permanently deleted']);
    }
}