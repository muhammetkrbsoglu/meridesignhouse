import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const iller = await prisma.il.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: iller
    });
  } catch (error) {
    console.error('İl listesi hatası:', error);
    return NextResponse.json(
      { success: false, error: 'İl listesi alınamadı' },
      { status: 500 }
    );
  }
}

