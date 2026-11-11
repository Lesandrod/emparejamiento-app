import fs from 'fs';
import path from 'path';
import { db, isFirebaseConfigured } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

export const INITIAL_PARTICIPANTS = [
  { id: '1', name: 'Lennard', revealed: false },
  { id: '2', name: 'Eduardo', revealed: false },
  { id: '3', name: 'William Vasquez', revealed: false },
  { id: '4', name: 'Albert Jared', revealed: false },
  { id: '5', name: 'Paolo Garcia', revealed: false },
  { id: '6', name: 'Cesar (Charro)', revealed: false },
  { id: '7', name: 'Roberto Carlos', revealed: false },
  { id: '8', name: 'Percy', revealed: false },
  { id: '9', name: 'Leonardo Chavez', revealed: false },
  { id: '10', name: 'Edwin', revealed: false }
];

const LOCAL_STORE_FILE = path.join(process.cwd(), '.data', 'pairing_store.json');

function ensureLocalStoreDir() {
  const dir = path.dirname(LOCAL_STORE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readLocalStore() {
  ensureLocalStoreDir();
  if (!fs.existsSync(LOCAL_STORE_FILE)) {
    const initial = {
      participants: INITIAL_PARTICIPANTS,
      pairs: [],
      preferences: {}
    };
    fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(LOCAL_STORE_FILE, 'utf8'));
  } catch {
    return {
      participants: INITIAL_PARTICIPANTS,
      pairs: [],
      preferences: {}
    };
  }
}

function writeLocalStore(data) {
  ensureLocalStoreDir();
  fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// -------------------------------------------------------------
// FIREBASE FIRESTORE HELPERS
// -------------------------------------------------------------
const PARTICIPANTS_COL = 'pairing_participants';
const PAIRS_COL = 'pairing_duos';
const CONFIG_COL = 'pairing_config';
const PREFERENCES_DOC = 'preferences';

export async function getPairingData() {
  if (!isFirebaseConfigured || !db) {
    const local = readLocalStore();
    return {
      participants: local.participants,
      pairs: local.pairs || [],
      preferences: local.preferences || []
    };
  }

  try {
    // 1. Fetch participants
    const pSnap = await getDocs(collection(db, PARTICIPANTS_COL));
    let participants = [];
    if (pSnap.empty) {
      await seedPairingDatabase();
      const retrySnap = await getDocs(collection(db, PARTICIPANTS_COL));
      participants = retrySnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } else {
      participants = pSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    // Sort stably by ID or creation
    participants.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

    // 2. Fetch pairs
    const pairsSnap = await getDocs(collection(db, PAIRS_COL));
    const pairs = pairsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.pairNumber || 0) - (b.pairNumber || 0));

    // 3. Fetch preferences
    let preferences = {};
    const prefSnap = await getDoc(doc(db, CONFIG_COL, PREFERENCES_DOC));
    if (prefSnap.exists()) {
      preferences = prefSnap.data().rules || {};
    }

    return { participants, pairs, preferences };
  } catch (error) {
    console.warn('Firestore fallback to local store:', error.message);
    const local = readLocalStore();
    return {
      participants: local.participants,
      pairs: local.pairs || [],
      preferences: local.preferences || {}
    };
  }
}

export async function seedPairingDatabase() {
  if (!isFirebaseConfigured || !db) {
    const local = {
      participants: INITIAL_PARTICIPANTS,
      pairs: [],
      preferences: {}
    };
    writeLocalStore(local);
    return true;
  }

  const batch = writeBatch(db);

  // Clear existing pairs
  const pairsSnap = await getDocs(collection(db, PAIRS_COL));
  pairsSnap.docs.forEach((d) => batch.delete(d.ref));

  // Reset or initialize participants
  INITIAL_PARTICIPANTS.forEach((p) => {
    const pRef = doc(db, PARTICIPANTS_COL, p.id);
    batch.set(pRef, {
      name: p.name,
      revealed: false,
      partnerId: null,
      pairNumber: null,
      photoUrl: null
    });
  });

  // Clear preferences
  const prefRef = doc(db, CONFIG_COL, PREFERENCES_DOC);
  batch.set(prefRef, { rules: {} });

  await batch.commit();
  return true;
}

// Draw a partner for the current user and form a public pair
export async function spinPublicPair(currentUserId) {
  const { participants, pairs, preferences } = await getPairingData();

  const currentPerson = participants.find((p) => p.id === currentUserId);
  if (!currentPerson) throw new Error('Participante no encontrado.');
  if (currentPerson.revealed && currentPerson.partnerId) {
    throw new Error('Este participante ya tiene una pareja asignada.');
  }

  // Eligible partners: participants not yet revealed and not current user
  const availableCandidates = participants.filter(
    (p) => !p.revealed && p.id !== currentUserId
  );

  if (availableCandidates.length === 0) {
    // If only currentPerson was left (odd number), check if they can join the last pair as a trio
    if (pairs.length > 0) {
      const lastPair = pairs[pairs.length - 1];
      if (!lastPair.trioMember) {
        // Attach to last pair as trio
        return await attachTrioMember(lastPair.id, currentPerson);
      }
    }
    throw new Error('No hay participantes disponibles para emparejar.');
  }

  // Check if admin defined a secret preference for this user
  let chosenPartner = null;
  const preferredPartnerId = preferences[currentUserId];
  if (preferredPartnerId && preferredPartnerId !== currentUserId) {
    const prefCandidate = availableCandidates.find((p) => p.id === preferredPartnerId);
    if (prefCandidate) {
      chosenPartner = prefCandidate;
    }
  }

  // If no preference or preference was not available, pick uniformly at random
  if (!chosenPartner) {
    // Exclude candidates reserved by others' preferences if possible
    const otherReservedIds = new Set(
      Object.entries(preferences)
        .filter(([giverId]) => giverId !== currentUserId)
        .map(([, receiverId]) => receiverId)
    );

    const nonReservedCandidates = availableCandidates.filter(
      (p) => !otherReservedIds.has(p.id)
    );

    const pool = nonReservedCandidates.length > 0 ? nonReservedCandidates : availableCandidates;
    const randomIndex = Math.floor(Math.random() * pool.length);
    chosenPartner = pool[randomIndex];
  }

  // Next pair number
  const nextPairNumber = pairs.length + 1;
  const pairId = `pair_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newPair = {
    id: pairId,
    pairNumber: nextPairNumber,
    member1: {
      id: currentPerson.id,
      name: currentPerson.name,
      alias: currentPerson.alias || '',
      photoUrl: currentPerson.photoUrl || null
    },
    member2: {
      id: chosenPartner.id,
      name: chosenPartner.name,
      alias: chosenPartner.alias || '',
      photoUrl: chosenPartner.photoUrl || null
    },
    createdAt: Date.now()
  };

  // Persist to Firebase / Local
  if (isFirebaseConfigured && db) {
    const batch = writeBatch(db);

    // Save pair
    const pairRef = doc(db, PAIRS_COL, pairId);
    batch.set(pairRef, newPair);

    // Update member1
    const m1Ref = doc(db, PARTICIPANTS_COL, currentPerson.id);
    batch.update(m1Ref, {
      revealed: true,
      partnerId: chosenPartner.id,
      pairNumber: nextPairNumber
    });

    // Update member2
    const m2Ref = doc(db, PARTICIPANTS_COL, chosenPartner.id);
    batch.update(m2Ref, {
      revealed: true,
      partnerId: currentPerson.id,
      pairNumber: nextPairNumber
    });

    await batch.commit();
  } else {
    const local = readLocalStore();
    local.pairs.push(newPair);
    local.participants = local.participants.map((p) => {
      if (p.id === currentPerson.id) {
        return { ...p, revealed: true, partnerId: chosenPartner.id, pairNumber: nextPairNumber };
      }
      if (p.id === chosenPartner.id) {
        return { ...p, revealed: true, partnerId: currentPerson.id, pairNumber: nextPairNumber };
      }
      return p;
    });
    writeLocalStore(local);
  }

  return {
    success: true,
    pair: newPair,
    partner: chosenPartner
  };
}

// Attach odd participant as a 3rd member to a pair
async function attachTrioMember(pairId, member) {
  if (isFirebaseConfigured && db) {
    const batch = writeBatch(db);
    const pairRef = doc(db, PAIRS_COL, pairId);
    const pSnap = await getDoc(pairRef);
    if (!pSnap.exists()) throw new Error('Pareja no encontrada');
    const pairData = pSnap.data();

    const trioMemberData = {
      id: member.id,
      name: member.name,
      photoUrl: member.photoUrl || null
    };

    batch.update(pairRef, { trioMember: trioMemberData });
    batch.update(doc(db, PARTICIPANTS_COL, member.id), {
      revealed: true,
      partnerId: pairData.member1.id,
      pairNumber: pairData.pairNumber
    });

    await batch.commit();

    return {
      success: true,
      pair: { ...pairData, trioMember: trioMemberData },
      partner: pairData.member1,
      isTrio: true
    };
  } else {
    const local = readLocalStore();
    const pair = local.pairs.find((p) => p.id === pairId);
    if (pair) {
      pair.trioMember = {
        id: member.id,
        name: member.name,
        photoUrl: member.photoUrl || null
      };
    }
    local.participants = local.participants.map((p) => {
      if (p.id === member.id) {
        return { ...p, revealed: true, partnerId: pair.member1.id, pairNumber: pair.pairNumber };
      }
      return p;
    });
    writeLocalStore(local);
    return {
      success: true,
      pair,
      partner: pair.member1,
      isTrio: true
    };
  }
}

// Break a pair (romper pareja) so both participants return to the pool
export async function unpairDuo(pairId) {
  const { pairs } = await getPairingData();
  const pair = pairs.find((p) => p.id === pairId);
  if (!pair) throw new Error('Pareja no encontrada.');

  const memberIds = [pair.member1.id, pair.member2.id];
  if (pair.trioMember) {
    memberIds.push(pair.trioMember.id);
  }

  if (isFirebaseConfigured && db) {
    const batch = writeBatch(db);

    // Delete pair doc
    batch.delete(doc(db, PAIRS_COL, pairId));

    // Reset members
    memberIds.forEach((mId) => {
      batch.update(doc(db, PARTICIPANTS_COL, mId), {
        revealed: false,
        partnerId: null,
        pairNumber: null
      });
    });

    await batch.commit();
  } else {
    const local = readLocalStore();
    local.pairs = local.pairs.filter((p) => p.id !== pairId);
    local.participants = local.participants.map((p) => {
      if (memberIds.includes(p.id)) {
        return { ...p, revealed: false, partnerId: null, pairNumber: null };
      }
      return p;
    });
    writeLocalStore(local);
  }

  return { success: true };
}

// Reset all pairings
export async function resetAllPairings() {
  const { participants, pairs } = await getPairingData();

  if (isFirebaseConfigured && db) {
    const batch = writeBatch(db);

    pairs.forEach((pair) => {
      batch.delete(doc(db, PAIRS_COL, pair.id));
    });

    participants.forEach((p) => {
      batch.update(doc(db, PARTICIPANTS_COL, p.id), {
        revealed: false,
        partnerId: null,
        pairNumber: null
      });
    });

    await batch.commit();
  } else {
    const local = readLocalStore();
    local.pairs = [];
    local.participants = local.participants.map((p) => ({
      ...p,
      revealed: false,
      partnerId: null,
      pairNumber: null
    }));
    writeLocalStore(local);
  }

  return { success: true };
}

// Add participant
export async function addParticipant(name, alias = '') {
  if (!name || !name.trim()) throw new Error('Nombre inválido');
  const cleanName = name.trim();
  const cleanAlias = (alias || '').trim();
  const newId = String(Date.now());

  const newP = {
    id: newId,
    name: cleanName,
    alias: cleanAlias,
    revealed: false,
    partnerId: null,
    pairNumber: null,
    photoUrl: null
  };

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, PARTICIPANTS_COL, newId), {
      name: cleanName,
      alias: cleanAlias,
      revealed: false,
      partnerId: null,
      pairNumber: null,
      photoUrl: null
    });
  } else {
    const local = readLocalStore();
    local.participants.push(newP);
    writeLocalStore(local);
  }

  return newP;
}

// Update participant name & alias
export async function updateParticipant(participantId, { name, alias }) {
  if (!participantId) throw new Error('ID requerido');
  const updates = {};
  if (name !== undefined && name !== null) updates.name = name.trim();
  if (alias !== undefined && alias !== null) updates.alias = alias.trim();

  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, PARTICIPANTS_COL, participantId), updates);
  } else {
    const local = readLocalStore();
    local.participants = local.participants.map((p) =>
      p.id === participantId ? { ...p, ...updates } : p
    );
    writeLocalStore(local);
  }
  return { success: true };
}

// Delete participant
export async function deleteParticipant(id) {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, PARTICIPANTS_COL, id));
  } else {
    const local = readLocalStore();
    local.participants = local.participants.filter((p) => p.id !== id);
    writeLocalStore(local);
  }
  return true;
}

// Update photo
export async function updateParticipantPhoto(participantId, photoUrl) {
  if (!participantId) throw new Error('ID requerido');

  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, PARTICIPANTS_COL, participantId), {
      photoUrl: photoUrl || null
    });
  } else {
    const local = readLocalStore();
    local.participants = local.participants.map((p) =>
      p.id === participantId ? { ...p, photoUrl } : p
    );
    writeLocalStore(local);
  }
  return true;
}

// Set preference
export async function setPairingPreference(giverId, receiverId) {
  if (!giverId) throw new Error('giverId requerido');

  if (isFirebaseConfigured && db) {
    const prefRef = doc(db, CONFIG_COL, PREFERENCES_DOC);
    const snap = await getDoc(prefRef);
    let rules = snap.exists() ? snap.data().rules || {} : {};

    if (!receiverId) {
      delete rules[giverId];
    } else {
      rules[giverId] = receiverId;
      rules[receiverId] = giverId; // Mutual pairing preference
    }

    await setDoc(prefRef, { rules }, { merge: true });
  } else {
    const local = readLocalStore();
    if (!local.preferences) local.preferences = {};
    if (!receiverId) {
      delete local.preferences[giverId];
    } else {
      local.preferences[giverId] = receiverId;
      local.preferences[receiverId] = giverId;
    }
    writeLocalStore(local);
  }
  return { success: true };
}

// -------------------------------------------------------------
// TOURNAMENT FIXTURE BRACKET SYSTEM
// -------------------------------------------------------------
const BRACKET_DOC = 'tournament_bracket';

export async function getTournamentBracket() {
  if (isFirebaseConfigured && db) {
    try {
      const snap = await getDoc(doc(db, CONFIG_COL, BRACKET_DOC));
      if (snap.exists()) {
        return snap.data();
      }
    } catch (e) {
      console.warn('Error fetching bracket from Firestore:', e.message);
    }
  }

  const local = readLocalStore();
  return local.tournamentBracket || null;
}

export async function generateTournamentBracket() {
  const { participants } = await getPairingData();
  if (!participants || participants.length < 2) {
    throw new Error('Se necesitan al menos 2 peleadores registrados para sortear el torneo.');
  }

  // Shuffle participants randomly
  const pool = [...participants];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const count = pool.length;
  const isOdd = count % 2 !== 0;
  const numByes = isOdd ? 1 : 0; // Regla estricta: si es impar, SOLO UNO avanza con Pase Libre

  // Determine rounds structure
  const roundMatchCounts = [];
  let curr = count;
  while (curr > 1) {
    const mCount = Math.ceil(curr / 2);
    roundMatchCounts.push(mCount);
    curr = mCount;
  }

  const totalRounds = roundMatchCounts.length;

  function getRoundTitle(rIdx, totalRounds) {
    const distFromEnd = totalRounds - 1 - rIdx;
    if (distFromEnd === 0) return 'Gran Final';
    if (distFromEnd === 1) return 'Semifinales';
    if (distFromEnd === 2) return 'Cuartos de Final';
    if (distFromEnd === 3) return 'Octavos de Final';
    return `Ronda ${rIdx + 1}`;
  }

  const rounds = [];
  let globalBoutNumber = 1;

  for (let rIdx = 0; rIdx < totalRounds; rIdx++) {
    const mCount = roundMatchCounts[rIdx];
    const isFinal = rIdx === totalRounds - 1;
    const matches = [];

    // Left and right split
    const leftCount = isFinal ? 0 : Math.ceil(mCount / 2);

    for (let m = 0; m < mCount; m++) {
      const matchId = `m_${rIdx + 1}_${m}`;
      let side = 'center';
      if (!isFinal) {
        side = m < leftCount ? 'left' : 'right';
      }

      // Next match wiring
      let nextMatchId = null;
      let nextSlot = null;

      if (!isFinal) {
        const nextRoundMCount = roundMatchCounts[rIdx + 1];
        const nextIsFinal = rIdx + 1 === totalRounds - 1;

        if (nextIsFinal) {
          nextMatchId = `m_${rIdx + 2}_0`;
          nextSlot = m === 0 ? 1 : 2;
        } else {
          const nextLeftCount = Math.ceil(nextRoundMCount / 2);
          if (side === 'left') {
            const nextIdx = Math.min(Math.floor(m / 2), nextLeftCount - 1);
            nextMatchId = `m_${rIdx + 2}_${nextIdx}`;
            nextSlot = m % 2 === 0 ? 1 : 2;
          } else {
            const rightIdx = m - leftCount;
            const rightTotal = nextRoundMCount - nextLeftCount;
            const nextIdx = nextLeftCount + Math.min(Math.floor(rightIdx / 2), Math.max(0, rightTotal - 1));
            nextMatchId = `m_${rIdx + 2}_${nextIdx}`;
            nextSlot = rightIdx % 2 === 0 ? 1 : 2;
          }
        }
      }

      matches.push({
        id: matchId,
        matchNumber: globalBoutNumber++,
        round: rIdx + 1,
        roundTitle: getRoundTitle(rIdx, totalRounds),
        side,
        fighter1: null,
        fighter2: null,
        winner: null,
        isByeMatch: false,
        nextMatchId,
        nextSlot
      });
    }

    rounds.push({
      roundNumber: rIdx + 1,
      title: getRoundTitle(rIdx, totalRounds),
      matches
    });
  }

  // Populate Round 1 fighters:
  // Si es impar, el que sobra ("Pase Libre") va en el grupo donde hay 3 combates (Ala Izquierda: r1LeftCount - 1)
  const r1 = rounds[0];
  const r1Count = r1.matches.length;
  const r1LeftCount = Math.ceil(r1Count / 2);
  const byeMatchIndex = isOdd ? (r1LeftCount - 1) : -1;

  let fighterIdx = 0;
  for (let m = 0; m < r1Count; m++) {
    const match = r1.matches[m];
    if (m === byeMatchIndex) {
      match.fighter1 = pool[fighterIdx++] || null;
      match.fighter2 = {
        id: `bye_1`,
        isBye: true,
        name: 'PASE LIBRE (BYE)',
        alias: 'Avanza Automático',
        photoUrl: null
      };
      match.winner = match.fighter1;
      match.isByeMatch = true;
    } else {
      match.fighter1 = pool[fighterIdx++] || null;
      match.fighter2 = pool[fighterIdx++] || null;
      match.isByeMatch = false;
      match.winner = null;
    }
  }

  // Pre-advance BYE winners through rounds
  rounds.forEach((round, rIdx) => {
    if (rIdx + 1 < rounds.length) {
      const nextRound = rounds[rIdx + 1];
      round.matches.forEach((m) => {
        if (m.isByeMatch && m.winner && m.nextMatchId) {
          const nextM = nextRound.matches.find((n) => n.id === m.nextMatchId);
          if (nextM) {
            if (m.nextSlot === 1) nextM.fighter1 = m.winner;
            else nextM.fighter2 = m.winner;

            // Auto-advance if this next slot also had a BYE
            if (nextM.fighter1 && nextM.fighter2?.isBye) {
              nextM.winner = nextM.fighter1;
              nextM.isByeMatch = true;
            } else if (nextM.fighter2 && nextM.fighter1?.isBye) {
              nextM.winner = nextM.fighter2;
              nextM.isByeMatch = true;
            }
          }
        }
      });
    }
  });

  const bracketData = {
    id: `bracket_${Date.now()}`,
    createdAt: Date.now(),
    bracketSize: count + numByes,
    totalRounds,
    participantCount: count,
    numByes,
    champion: null,
    rounds
  };

  // Persist
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, CONFIG_COL, BRACKET_DOC), bracketData);
    } catch (e) {
      console.warn('Error saving bracket to Firestore:', e.message);
    }
  }

  const local = readLocalStore();
  local.tournamentBracket = bracketData;
  writeLocalStore(local);

  return bracketData;
}

// Cascade-clear winner and remove fighter from all downstream rounds & champion
function clearMatchWinnerAndDownstream(bracket, roundIdx, match) {
  if (!match || !match.winner) return;

  const departingFighterId = match.winner.id;
  match.winner = null;

  // If this match was the final, clear champion
  if (bracket.champion && bracket.champion.id === departingFighterId) {
    bracket.champion = null;
  }

  // If this match feeds a downstream match
  if (match.nextMatchId && roundIdx + 1 < bracket.rounds.length) {
    const nextRound = bracket.rounds[roundIdx + 1];
    const nextMatch = nextRound.matches.find((m) => m.id === match.nextMatchId);

    if (nextMatch) {
      if (match.nextSlot === 1 && nextMatch.fighter1?.id === departingFighterId) {
        nextMatch.fighter1 = null;
      } else if (match.nextSlot === 2 && nextMatch.fighter2?.id === departingFighterId) {
        nextMatch.fighter2 = null;
      }

      // If next match had this departing fighter as its winner, cascade clear downstream
      if (nextMatch.winner && nextMatch.winner.id === departingFighterId) {
        clearMatchWinnerAndDownstream(bracket, roundIdx + 1, nextMatch);
      }
    }
  }
}

export async function advanceTournamentWinner(matchId, winnerId) {
  const bracket = await getTournamentBracket();
  if (!bracket || !bracket.rounds) throw new Error('No existe un torneo activo.');

  let targetMatch = null;
  let targetRoundIdx = -1;

  for (let rIdx = 0; rIdx < bracket.rounds.length; rIdx++) {
    const found = bracket.rounds[rIdx].matches.find((m) => m.id === matchId);
    if (found) {
      targetMatch = found;
      targetRoundIdx = rIdx;
      break;
    }
  }

  if (!targetMatch) throw new Error('Combate no encontrado en el árbol.');

  // 1. DESMARCAR / TOGGLE OFF: Si el usuario toca al que ya era ganador, se desmarca y se limpia en cascada
  if (targetMatch.winner && targetMatch.winner.id === winnerId) {
    clearMatchWinnerAndDownstream(bracket, targetRoundIdx, targetMatch);

    // Guardar cambios
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, CONFIG_COL, BRACKET_DOC), bracket);
      } catch (e) {
        console.warn('Error updating bracket in Firestore:', e.message);
      }
    }

    const local = readLocalStore();
    local.tournamentBracket = bracket;
    writeLocalStore(local);

    return bracket;
  }

  // 2. CAMBIAR DE GANADOR O MARCAR NUEVO
  let winningFighter = null;
  if (targetMatch.fighter1 && targetMatch.fighter1.id === winnerId) {
    winningFighter = targetMatch.fighter1;
  } else if (targetMatch.fighter2 && targetMatch.fighter2.id === winnerId) {
    winningFighter = targetMatch.fighter2;
  }

  if (!winningFighter) throw new Error('El peleador seleccionado no pertenece a este combate.');

  // Si ya había otro ganador anterior en este match, limpiarlo primero de las rondas posteriores
  if (targetMatch.winner && targetMatch.winner.id !== winnerId) {
    clearMatchWinnerAndDownstream(bracket, targetRoundIdx, targetMatch);
  }

  targetMatch.winner = winningFighter;

  // Avanzar a la siguiente ronda si no es la Gran Final
  if (targetMatch.nextMatchId && targetRoundIdx + 1 < bracket.rounds.length) {
    const nextRound = bracket.rounds[targetRoundIdx + 1];
    const nextMatch = nextRound.matches.find((m) => m.id === targetMatch.nextMatchId);

    if (nextMatch) {
      if (targetMatch.nextSlot === 1) {
        nextMatch.fighter1 = winningFighter;
      } else {
        nextMatch.fighter2 = winningFighter;
      }

      // Si el ganador anterior de nextMatch ya no es ninguno de los dos peleadores actuales, limpiarlo
      if (nextMatch.winner && nextMatch.winner.id !== nextMatch.fighter1?.id && nextMatch.winner.id !== nextMatch.fighter2?.id) {
        clearMatchWinnerAndDownstream(bracket, targetRoundIdx + 1, nextMatch);
      }
    }
  } else {
    // Gran Final: coronar campeón indiscutible
    bracket.champion = winningFighter;
  }

  // Persistir cambios
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, CONFIG_COL, BRACKET_DOC), bracket);
    } catch (e) {
      console.warn('Error updating bracket in Firestore:', e.message);
    }
  }

  const local = readLocalStore();
  local.tournamentBracket = bracket;
  writeLocalStore(local);

  return bracket;
}

export async function resetTournamentBracket() {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, CONFIG_COL, BRACKET_DOC));
    } catch (e) {
      console.warn('Error deleting bracket from Firestore:', e.message);
    }
  }

  const local = readLocalStore();
  delete local.tournamentBracket;
  writeLocalStore(local);

  return { success: true };
}
