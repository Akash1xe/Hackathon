// File: c:\hackathon\src\app\api\auth\register\route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import dbConnect from '@/lib/dbConnect';
import User from '@/model/User';

// Admin registration code - should be stored in environment variables
const ADMIN_REGISTRATION_CODE = process.env.ADMIN_REGISTRATION_CODE || 'ADMIN123';

export async function POST(request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, email, password, phone, adminCode } = body;
    
    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Determine user role based on admin code
    let role = 'citizen'; // Default role
    
    if (adminCode) {
      // Validate admin code
      if (adminCode === ADMIN_REGISTRATION_CODE) {
        role = 'admin';
      } else {
        return NextResponse.json(
          { error: 'Invalid admin code' },
          { status: 400 }
        );
      }
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      role // Set the role based on admin code
    });
    
    await user.save();
    
    // Return success (don't include password)
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    return NextResponse.json(
      { message: 'User registered successfully', user: userResponse },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}