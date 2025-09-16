import { NextRequest, NextResponse } from 'next/server';
import { scrapeWithApify } from '@/lib/instagram-apify';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "Missing 'url' in body" }, { status: 400 });
    }
    const data = await scrapeWithApify(url);
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || e.toString() }, { status: 500 });
  }
}


