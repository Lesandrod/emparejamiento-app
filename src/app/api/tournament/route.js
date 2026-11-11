import { NextResponse } from 'next/server';
import {
  getTournamentBracket,
  generateTournamentBracket,
  advanceTournamentWinner,
  resetTournamentBracket
} from '@/lib/db';

export async function GET() {
  try {
    const bracket = await getTournamentBracket();
    return NextResponse.json({ success: true, bracket });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener fixture' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, matchId, winnerId } = body;

    if (action === 'draw') {
      const bracket = await generateTournamentBracket();
      return NextResponse.json({ success: true, bracket });
    }

    if (action === 'advance') {
      if (!matchId || !winnerId) {
        return NextResponse.json({ error: 'matchId y winnerId requeridos' }, { status: 400 });
      }
      const bracket = await advanceTournamentWinner(matchId, winnerId);
      return NextResponse.json({ success: true, bracket });
    }

    if (action === 'reset') {
      const res = await resetTournamentBracket();
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error en torneo' },
      { status: 500 }
    );
  }
}
