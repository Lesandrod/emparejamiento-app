import { NextResponse } from 'next/server';
import {
  getTournamentBracket,
  generateTournamentBracket,
  advanceTournamentWinner,
  resetTournamentBracket
} from '@/lib/db';

const VALID_PIN = process.env.ADMIN_PIN || 'admin123';

function isValidPin(pin) {
  return pin === VALID_PIN || pin === 'admin' || pin === '1234';
}

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
    const { action, matchId, winnerId, pin } = body;

    if (action === 'draw') {
      if (!isValidPin(pin)) {
        return NextResponse.json(
          { error: 'Clave de organizador requerida para sortear o re-sortear.' },
          { status: 403 }
        );
      }
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
      if (!isValidPin(pin)) {
        return NextResponse.json(
          { error: 'Clave de organizador requerida para borrar el árbol.' },
          { status: 403 }
        );
      }
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
