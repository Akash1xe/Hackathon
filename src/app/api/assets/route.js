import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { apiError } from '@/lib/http';
import { cleanText, isValidObjectId, validateLocation } from '@/lib/validation';
import PublicAsset from '@/model/PublicAsset';
import Department from '@/model/Department';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const latitudeValue = searchParams.get('lat');
    const longitudeValue = searchParams.get('lng');
    const latitude = latitudeValue === null ? Number.NaN : Number(latitudeValue);
    const longitude = longitudeValue === null ? Number.NaN : Number(longitudeValue);
    const type = cleanText(searchParams.get('type'), 40);
    const query = { status: { $ne: 'retired' } };
    if (type) query.type = type;
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      query.location = { $near: { $geometry: { type: 'Point', coordinates: [longitude, latitude] }, $maxDistance: Math.min(5000, Math.max(50, Number(searchParams.get('distance') || 1000))) } };
    }
    await dbConnect();
    const assets = await PublicAsset.find(query).limit(50).populate('department', 'name categories').lean();
    return NextResponse.json({ assets });
  } catch (error) {
    console.error('Unable to load public assets:', error);
    return apiError('Unable to load public assets.', 500);
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') return apiError('Administrator access required.', 403);
    const body = await request.json();
    const assetCode = cleanText(body.assetCode, 40).toUpperCase();
    const name = cleanText(body.name, 120);
    const type = cleanText(body.type, 40);
    const location = validateLocation(body.location);
    if (assetCode.length < 3 || name.length < 3 || !['streetlight', 'road', 'water', 'waste', 'park', 'public_property', 'other'].includes(type) || !location) return apiError('Provide a valid asset code, name, type, and location.', 400);
    await dbConnect();
    if (body.departmentId && !isValidObjectId(body.departmentId)) return apiError('Choose a valid department.', 400);
    if (body.departmentId && !await Department.exists({ _id: body.departmentId, active: true })) return apiError('Selected department is unavailable.', 400);
    const asset = await PublicAsset.create({ assetCode, name, type, location, department: body.departmentId || undefined, installedAt: body.installedAt || undefined, status: 'active' });
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    if (error?.code === 11000) return apiError('An asset with this code already exists.', 409);
    console.error('Unable to create public asset:', error);
    return apiError('Unable to create this public asset.', 500);
  }
}
