import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Registrando vista del home...');
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    console.log('🔍 IP:', ip);
    console.log('🔍 User Agent:', userAgent);

    const vista = await prisma.vistaHome.create({
      data: {
        ip,
        userAgent,
      },
    });

    console.log('✅ Vista registrada con ID:', vista.id);

    return NextResponse.json({ success: true, id: vista.id });
  } catch (error) {
    console.error('❌ Error registrando vista:', error);
    return NextResponse.json({ error: 'Error registrando vista' }, { status: 500 });
  }
}
