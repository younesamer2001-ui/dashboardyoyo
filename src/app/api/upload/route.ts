import { NextRequest } from 'next/server';
import { put, list } from '@vercel/blob';

// POST /api/upload - Upload files to Vercel Blob storage
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return Response.json(
                { success: false, error: 'No files provided' },
                { status: 400 }
            );
        }

        const uploaded: { name: string; url: string; size: number }[] = [];

        for (const file of files) {
            const key = `uploads/${Date.now()}-${file.name}`;
            const blob = await put(key, file, {
                access: 'public',
                addRandomSuffix: false,
            });

            uploaded.push({
                name: file.name,
                url: blob.url,
                size: file.size,
            });
        }

        return Response.json({
            success: true,            files: uploaded,
            message: `Uploaded ${uploaded.length} file(s)`,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return Response.json(
            { success: false, error: 'Upload failed: ' + String(error) },
            { status: 500 }
        );
    }
}

// GET /api/upload - List uploaded files
export async function GET() {
    try {
        const { blobs } = await list({ prefix: 'uploads/', limit: 100 });

        const files = blobs.map((blob) => ({
            name: blob.pathname.replace('uploads/', '').replace(/^\d+-/, ''),
            url: blob.downloadUrl,
            size: blob.size,
            uploadedAt: blob.uploadedAt,
        }));

        return Response.json({ success: true, files });
    } catch (error) {
        console.error('List uploads error:', error);
        return Response.json(
            { success: false, error: 'Failed to list files' },
            { status: 500 }
        );
    }
}
