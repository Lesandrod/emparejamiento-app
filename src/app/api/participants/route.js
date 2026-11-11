import { NextResponse } from 'next/server';
import { getPairingData } from '@/lib/db';

export async function GET() {
  try {
    const data = await getPairingData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener datos' },
      { status: 500 }
    );
  }
}
