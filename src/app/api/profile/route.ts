import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, addresses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

export async function GET(req: Request) {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const uid = session.user.id;
        if (!uid) return NextResponse.json({ error: 'User ID not found' }, { status: 401 });

        const profile = await db.query.users.findFirst({
            where: eq(users.id, uid),
        });

        const address = await db.query.addresses.findFirst({
            where: (addresses, { and, eq }) => and(eq(addresses.userId, uid), eq(addresses.isDefault, true)),
        });

        return NextResponse.json({ profile, address });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await auth();
    if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const uid = session.user.id;
        const body = await req.json();
        const { firstName, lastName, mobile, email, address } = body;

        // Update Profile
        await db.update(users)
            .set({
                firstName,
                lastName,
                mobile,
                email,
                updatedAt: new Date(),
            })
            .where(eq(users.id, uid));

        // Update Address (Upsert logic simplified)
        // Check if address exists
        const existingAddress = await db.query.addresses.findFirst({
            where: (addresses, { and, eq }) => and(eq(addresses.userId, uid), eq(addresses.isDefault, true)),
        });

        if (existingAddress) {
            await db.update(addresses)
                .set({
                    province: address.province,
                    district: address.district,
                    subDistrict: address.subDistrict,
                    postalCode: address.postalCode,
                    details: address.details,
                })
                .where(eq(addresses.id, existingAddress.id));
        } else {
            await db.insert(addresses).values({
                userId: uid,
                province: address.province,
                district: address.district,
                subDistrict: address.subDistrict,
                postalCode: address.postalCode,
                details: address.details,
                isDefault: true,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
