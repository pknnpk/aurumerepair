import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { auth } from '@/auth';

const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY || '{}'),
});

const bucketName = process.env.GCP_STORAGE_BUCKET!;

export async function POST(req: Request) {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { filename, contentType } = await req.json();
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(`uploads/${session.user.id}/${Date.now()}-${filename}`);

        const [url] = await file.getSignedUrl({
            version: 'v4',
            action: 'write',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
            contentType,
        });

        return NextResponse.json({ url, publicUrl: file.publicUrl() });
    } catch (error) {
        console.error('Error generating signed URL:', error);
        return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
    }
}
