import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { apiError } from '@/lib/http';
import { CATEGORY_VALUES } from '@/lib/constants';
import { cleanText, isAllowedImageUrl } from '@/lib/validation';
import { analyzeCivicEvidence, CIVIC_VISION_LABELS } from '@/lib/visionAnalysis';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiError('Please sign in to analyze evidence.', 401);
    const body = await request.json();
    const imageUrl = cleanText(body.imageUrl, 500);
    const selectedCategory = cleanText(body.category, 40);
    if (!isAllowedImageUrl(imageUrl)) return apiError('Upload a valid image before analysis.', 400);
    if (!CATEGORY_VALUES.includes(selectedCategory)) return apiError('Choose a category before analysis.', 400);

    try {
      return NextResponse.json(await analyzeCivicEvidence(imageUrl, selectedCategory));
    } catch (modelError) {
      console.error('Hosted vision analysis unavailable; using advisory fallback:', modelError);
      return NextResponse.json({
        status: 'needs_review',
        score: 50,
        suggestedCategory: selectedCategory,
        categoryMatch: true,
        severity: 45,
        imageQuality: 'usable',
        labels: [{ label: CIVIC_VISION_LABELS[selectedCategory], score: .5 }],
        model: 'Serverless advisory fallback',
        warning: 'AI vision analysis is unavailable. An administrator should review this evidence.'
      });
    }
  } catch (error) {
    console.error('Evidence analysis failed:', error);
    return apiError('Unable to analyze this evidence right now.', 500);
  }
}
