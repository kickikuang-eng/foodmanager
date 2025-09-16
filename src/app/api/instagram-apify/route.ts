import { NextRequest, NextResponse } from 'next/server';
import { scrapeWithApify } from '@/lib/instagram-apify';

export const dynamic = 'force-dynamic';

function isValidInstagramUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?instagram\.com\//.test(url);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const url = body?.url as string | undefined;

    if (!url) {
      return NextResponse.json({ error: "Missing 'url' in body" }, { status: 400 });
    }
    if (!isValidInstagramUrl(url)) {
      return NextResponse.json({ error: 'Invalid Instagram URL' }, { status: 400 });
    }
    if (!process.env.APIFY_API_TOKEN) {
      return NextResponse.json({ error: 'Server is not configured: APIFY_API_TOKEN missing' }, { status: 500 });
    }

    const data = await scrapeWithApify(url);
    return NextResponse.json({ success: true, data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


