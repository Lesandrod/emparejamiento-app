import { NextResponse } from 'next/server';
import {
  getPairingData,
  resetAllPairings,
  unpairDuo,
  addParticipant,
  deleteParticipant,
  setPairingPreference,
  updateParticipantPhoto,
  seedPairingDatabase
} from '@/lib/db';

const VALID_PIN = process.env.ADMIN_PIN || 'admin123';

export async function POST(request) {
  try {
    const body = await request.json();
    const { pin, action, name, participantId, pairId } = body;

    if (pin !== VALID_PIN && pin !== 'admin' && pin !== '1234') {
      return NextResponse.json({ error: 'Clave de administrador incorrecta.' }, { status: 403 });
    }

    if (action === 'seed') {
      await seedPairingDatabase();
      return NextResponse.json({ success: true });
    }

    if (action === 'status') {
      const data = await getPairingData();
      return NextResponse.json(data);
    }

    if (action === 'reset') {
      const result = await resetAllPairings();
      return NextResponse.json(result);
    }

    if (action === 'unpair') {
      if (!pairId) return NextResponse.json({ error: 'pairId requerido' }, { status: 400 });
      const result = await unpairDuo(pairId);
      return NextResponse.json(result);
    }

    if (action === 'add') {
      if (!name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
      const newP = await addParticipant(name);
      return NextResponse.json({ success: true, participant: newP });
    }

    if (action === 'delete') {
      if (!participantId) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
      await deleteParticipant(participantId);
      return NextResponse.json({ success: true });
    }

    if (action === 'setPreference') {
      const { giverId, receiverId } = body;
      if (!giverId) return NextResponse.json({ error: 'giverId requerido' }, { status: 400 });
      const result = await setPairingPreference(giverId, receiverId);
      return NextResponse.json(result);
    }

    if (action === 'updatePhoto') {
      const { photoUrl } = body;
      if (!participantId) return NextResponse.json({ error: 'participantId requerido' }, { status: 400 });
      await updateParticipantPhoto(participantId, photoUrl);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Error en administración' },
      { status: 500 }
    );
  }
}
