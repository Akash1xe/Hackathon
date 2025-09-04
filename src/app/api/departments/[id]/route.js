// File: c:\hackathon\src\app\api\departments\[id]\route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Department from '@/model/Department';
import mongoose from 'mongoose';

// Helper to check if ID is valid
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// Get a single department
export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const id = params.id;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid department ID' },
        { status: 400 }
      );
    }
    
    const department = await Department.findById(id);
    
    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(department);
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json(
      { error: 'Failed to fetch department' },
      { status: 500 }
    );
  }
}

// Update a department (admin only)
export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    
    // Check if user is admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You must be an admin to update departments' },
        { status: 403 }
      );
    }
    
    const id = params.id;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid department ID' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    const department = await Department.findById(id);
    
    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }
    
    // Update fields
    const allowedFields = [
      'name', 'description', 'categories', 
      'contactEmail', 'contactPhone', 'supervisors', 
      'responsibleArea', 'active'
    ];
    
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        department[field] = data[field];
      }
    });
    
    await department.save();
    
    return NextResponse.json(department);
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      { error: 'Failed to update department' },
      { status: 500 }
    );
  }
}

// Delete a department (admin only)
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    // Check if user is admin
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You must be an admin to delete departments' },
        { status: 403 }
      );
    }
    
    const id = params.id;
    
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: 'Invalid department ID' },
        { status: 400 }
      );
    }
    
    const department = await Department.findById(id);
    
    if (!department) {
      return NextResponse.json(
        { error: 'Department not found' },
        { status: 404 }
      );
    }
    
    await Department.findByIdAndDelete(id);
    
    return NextResponse.json(
      { message: 'Department deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { error: 'Failed to delete department' },
      { status: 500 }
    );
  }
}