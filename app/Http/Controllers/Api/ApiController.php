<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class ApiController extends Controller
{
    // POST [username, email, password]
    public function register(Request $request){
  
         //Validation
        $request->validate([
            "username" => "required|string",
            "email" => "required|string|email|unique:users", 
            "password" => "required|confirmed" //password confirmation
        ]);


         //Create User
        User::create([
            'role_id'  => 1, // default role
            "username" => $request->username,
            "email" => $request->email,
            "password" => bcrypt($request->password)
            
        ]) ;
        
        return response()->json([
            "status" => true,
            "message" => "User registered successfully",
            "data" => []
        ]);
    }

    // POST [email, password]
    public function login(Request $request){
        // validation
        $request->validate([
            "email" => "required|email|string",
            "password" => "required"
        ]);

        //user object
        $user = User::where("email", $request->email)->first();

        if(!empty($user)){

            //user exists

            if(Hash::check($request->password, $user->password)){
                
                //password matched
                $token = $user->createToken("mytoken")->accessToken;

                return response()->json([
                    "status" => true,
                    "message" => "User logged in successfully",
                    "token" => $token,
                    "data" => []
                ]);
            }else{
                return response()->json([
                    "status" => false,
                    "message" => "Password didn't match",
                    "data" => []
                ]);
            }
        }else{

            return response()->json([
                "status" => false,
                "message" => "Invalid Email value",
                "data" => []
            ]);
        }
        //email check

        //password


        //auth token
    }

    // GET [Auth:Token]
    public function profile(){

    }

    // GET [Auth:Token]
    public function logout(){

    }
}
