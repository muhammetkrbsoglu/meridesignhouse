import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json(
        { success: false, error: 'En az 2 karakter gerekli' },
        { status: 400 }
      );
    }

    // Prisma model: Mahalle -> prisma.mahalle (camelCase)
    const results = await prisma.mahalle.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { posta_kodu: { contains: query } },
          { 
            ilce: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                {
                  il: {
                    name: { contains: query, mode: 'insensitive' }
                  }
                }
              ]
            }
          }
        ]
      },
      include: {
        ilce: {
          include: {
            il: true
          }
        }
      },
      take: 20,
      orderBy: { name: 'asc' }
    });

    const formattedResults = results.map((mahalle) => ({
      id: mahalle.id,
      il: mahalle.ilce.il.name,
      ilce: mahalle.ilce.name,
      mahalle: mahalle.name,
      postaKodu: mahalle.posta_kodu,
      fullAddress: `${mahalle.name}, ${mahalle.ilce.name}, ${mahalle.ilce.il.name}`
    }));

    return NextResponse.json({
      success: true,
      data: formattedResults
    });
  } catch (error) {
    console.error('Adres arama hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Adres arama yapılamadı' },
      { status: 500 }
    );
  }
}