import { NextResponse } from 'next/server';
import { db } from '@/db';
import { repairs } from '@/db/schema';
import { auth } from '@/auth';
import { eq } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        const repair = await db.query.repairs.findFirst({
            where: eq(repairs.id, id),
            with: { customer: true }
        });

        if (!repair) return NextResponse.json({ error: 'Repair not found' }, { status: 404 });

        return NextResponse.json(repair);
    } catch (error) {
        console.error('Error fetching repair:', error);
        return NextResponse.json({ error: 'Failed to fetch repair' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        const body = await req.json();

        // Remove undefined fields
        const updateData: any = {};
        if (body.status) updateData.status = body.status;
        if (body.costInternal) updateData.costInternal = body.costInternal;
        if (body.costExternal) updateData.costExternal = body.costExternal;
        if (body.trackingNumber) updateData.trackingNumber = body.trackingNumber;
        updateData.updatedAt = new Date();

        await db.update(repairs)
            .set(updateData)
            .where(eq(repairs.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating repair:', error);
        return NextResponse.json({ error: 'Failed to update repair' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        await db.delete(repairs).where(eq(repairs.id, id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting repair:', error);
        return NextResponse.json({ error: 'Failed to delete repair' }, { status: 500 });
    }
}
