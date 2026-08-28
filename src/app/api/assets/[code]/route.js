import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { apiError } from '@/lib/http';
import { cleanText } from '@/lib/validation';
import PublicAsset from '@/model/PublicAsset';
import Report from '@/model/Report';

export async function GET(request, { params }) {
  try {
    const { code } = await params;
    const assetCode = cleanText(code, 40).toUpperCase();
    await dbConnect();
    const asset = await PublicAsset.findOne({ assetCode, status: { $ne: 'retired' } }).populate('department', 'name categories contactEmail contactPhone').lean();
    if (!asset) return apiError('Public asset not found.', 404);
    const [reportCount, recentReports] = await Promise.all([
      Report.countDocuments({ asset: asset._id, deletedAt: { $exists: false } }),
      Report.find({ asset: asset._id, deletedAt: { $exists: false } }).select('referenceId title status createdAt').sort({ createdAt: -1 }).limit(5).lean()
    ]);
    return NextResponse.json({ ...asset, reportCount, recentReports });
  } catch (error) {
    console.error('Unable to load public asset:', error);
    return apiError('Unable to load this public asset.', 500);
  }
}
