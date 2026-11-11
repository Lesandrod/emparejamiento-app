import { NextResponse } from 'next/server';
import { spinPublicPair } from '@/lib/db';

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'ID de participante no proporcionado.' },
        { status: 400 }
      );
    }

    const result = await spinPublicPair(userId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error durante el emparejamiento.' },
      { status: 400 }
    );
  }
}
