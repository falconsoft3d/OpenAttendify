import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await prisma.vistaHome.create({
      data: {
        ip,
        userAgent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error registrando vista:', error);
    return NextResponse.json({ error: 'Error registrando vista' }, { status: 500 });
  }
}
