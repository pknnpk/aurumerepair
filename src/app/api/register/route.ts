import { NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles, addresses } from '@/db/schema';
import { adminAuth } from '@/lib/firebase/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { idToken, firstName, lastName, mobile, address } = body;

        // Verify the Firebase ID token
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const email = decodedToken.email;

        // Insert profile
        await db.insert(profiles).values({
            id: uid,
            firstName,
            lastName,
            email,
            mobile,
            role: 'customer',
        });

        // Insert address if provided
        if (address) {
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
    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
