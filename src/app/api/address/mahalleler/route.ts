import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ilceId = searchParams.get('ilceId');

    if (!ilceId) {
      return NextResponse.json(
        { success: false, error: 'İlçe ID gerekli' },
        { status: 400 }
      );
    }

    const mahalleler = await prisma.mahalle.findMany({
      where: { ilce_id: ilceId },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: mahalleler
    });
  } catch (error) {
    console.error('Mahalle listesi hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Mahalle listesi alınamadı' },
      { status: 500 }
    );
  }
}
