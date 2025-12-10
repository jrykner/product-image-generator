import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Fetch the image from the external URL server-side (bypasses CORS)
        const response = await fetch(url);

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch image: ${response.status}` },
                { status: response.status }
            );
        }

        // Get the image data as an ArrayBuffer
        const imageBuffer = await response.arrayBuffer();

        // Return the image with appropriate headers
        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'image/png',
                'Content-Length': imageBuffer.byteLength.toString(),
            },
        });
    } catch (error: any) {
        console.error('Proxy fetch error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to proxy image' },
            { status: 500 }
        );
    }
}
