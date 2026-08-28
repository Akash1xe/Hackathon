import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { CATEGORY_VALUES } from '@/lib/constants';
import { apiError } from '@/lib/http';
import { cleanText, isAllowedImageUrl } from '@/lib/validation';
import { compareCivicEvidence } from '@/lib/visionAnalysis';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') return apiError('Administrator access required.', 403);
    const body = await request.json();
    const beforeImage = cleanText(body.beforeImage, 500);
    const afterImage = cleanText(body.afterImage, 500);
    const category = cleanText(body.category, 40);
    if (!isAllowedImageUrl(beforeImage) || !isAllowedImageUrl(afterImage)) return apiError('Choose valid before and after images.', 400);
    if (!CATEGORY_VALUES.includes(category)) return apiError('Choose a valid civic category.', 400);

    try {
      return NextResponse.json(await compareCivicEvidence(beforeImage, afterImage, category));
    } catch (modelError) {
      console.error('Hosted before/after comparison unavailable:', modelError);
      return NextResponse.json({
        improvementScore: 50,
        beforeProblemScore: 50,
        afterRepairScore: 50,
        assessment: 'needs_review',
        model: 'Serverless advisory fallback',
        warning: 'AI vision comparison is unavailable. Review both images manually and ask the citizen to confirm.'
      });
    }
  } catch (error) {
    console.error('Evidence comparison failed:', error);
    return apiError('Unable to compare this evidence right now.', 500);
  }
}
