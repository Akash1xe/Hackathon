import QRCode from 'qrcode';
import dbConnect from '@/lib/dbConnect';
import { apiError } from '@/lib/http';
import { cleanText } from '@/lib/validation';
import PublicAsset from '@/model/PublicAsset';

export async function GET(request, { params }) {
  try {
    const { code } = await params;
    const assetCode = cleanText(code, 40).toUpperCase();
    await dbConnect();
    if (!await PublicAsset.exists({ assetCode, status: { $ne: 'retired' } })) return apiError('Public asset not found.', 404);
    const url = `${new URL(request.url).origin}/assets/${encodeURIComponent(assetCode)}`;
    const svg = await QRCode.toString(url, { type: 'svg', margin: 1, color: { dark: '#12322f', light: '#ffffff' } });
    return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' } });
  } catch (error) {
    console.error('Unable to generate asset QR code:', error);
    return apiError('Unable to generate this QR code.', 500);
  }
}
