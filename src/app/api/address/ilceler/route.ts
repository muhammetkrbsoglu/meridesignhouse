import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ilId = searchParams.get('ilId');

    if (!ilId) {
      return NextResponse.json(
        { success: false, error: 'İl ID gerekli' },
        { status: 400 }
      );
    }

    const ilceler = await prisma.ilce.findMany({
      where: { il_id: ilId },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: ilceler
    });
  } catch (error) {
    console.error('İlçe listesi hatası:', error);
    return NextResponse.json(
      { success: false, error: 'İlçe listesi alınamadı' },
      { status: 500 }
    );
  }
}
