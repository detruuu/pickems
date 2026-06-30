const { all, get, pickPoints } = require('./db');

const GROUPS = 'ABCDEFGHIJKL'.split('');

// kickoff_at values are stored in Polish local time (Europe/Warsaw, CEST).
const ROUND32 = [
  { no: 73, round: '1/16 finału', homeSlot: '2A', awaySlot: '2B', kickoff_at: '2026-06-28 21:00' },
  { no: 74, round: '1/16 finału', homeSlot: '1E', awaySlot: '3ABCDF', kickoff_at: '2026-06-29 22:30' },
  { no: 75, round: '1/16 finału', homeSlot: '1F', awaySlot: '2C', kickoff_at: '2026-06-30 03:00' },
  { no: 76, round: '1/16 finału', homeSlot: '1C', awaySlot: '2F', kickoff_at: '2026-06-29 19:00' },
  { no: 77, round: '1/16 finału', homeSlot: '1I', awaySlot: '3CDFGH', kickoff_at: '2026-06-30 23:00' },
  { no: 78, round: '1/16 finału', homeSlot: '2E', awaySlot: '2I', kickoff_at: '2026-06-30 19:00' },
  { no: 79, round: '1/16 finału', homeSlot: '1A', awaySlot: '3CEFHI', kickoff_at: '2026-07-01 03:00' },
  { no: 80, round: '1/16 finału', homeSlot: '1L', awaySlot: '3EHIJK', kickoff_at: '2026-07-01 18:00' },
  { no: 81, round: '1/16 finału', homeSlot: '1D', awaySlot: '3BEFIJ', kickoff_at: '2026-07-02 02:00' },
  { no: 82, round: '1/16 finału', homeSlot: '1G', awaySlot: '3AEHIJ', kickoff_at: '2026-07-01 22:00' },
  { no: 83, round: '1/16 finału', homeSlot: '2K', awaySlot: '2L', kickoff_at: '2026-07-03 01:00' },
  { no: 84, round: '1/16 finału', homeSlot: '1H', awaySlot: '2J', kickoff_at: '2026-07-02 21:00' },
  { no: 85, round: '1/16 finału', homeSlot: '1B', awaySlot: '3EFGIJ', kickoff_at: '2026-07-03 05:00' },
  { no: 86, round: '1/16 finału', homeSlot: '1J', awaySlot: '2H', kickoff_at: '2026-07-04 00:00' },
  { no: 87, round: '1/16 finału', homeSlot: '1K', awaySlot: '3DEIJL', kickoff_at: '2026-07-04 03:30' },
  { no: 88, round: '1/16 finału', homeSlot: '2D', awaySlot: '2G', kickoff_at: '2026-07-03 20:00' }
];

const KNOCKOUT = [
  ...ROUND32,
  { no: 89, round: '1/8 finału', homeSlot: 'W74', awaySlot: 'W77', kickoff_at: '2026-07-04 23:00' },
  { no: 90, round: '1/8 finału', homeSlot: 'W73', awaySlot: 'W75', kickoff_at: '2026-07-04 19:00' },
  { no: 91, round: '1/8 finału', homeSlot: 'W76', awaySlot: 'W78', kickoff_at: '2026-07-05 22:00' },
  { no: 92, round: '1/8 finału', homeSlot: 'W79', awaySlot: 'W80', kickoff_at: '2026-07-06 02:00' },
  { no: 93, round: '1/8 finału', homeSlot: 'W83', awaySlot: 'W84', kickoff_at: '2026-07-06 21:00' },
  { no: 94, round: '1/8 finału', homeSlot: 'W81', awaySlot: 'W82', kickoff_at: '2026-07-07 02:00' },
  { no: 95, round: '1/8 finału', homeSlot: 'W86', awaySlot: 'W88', kickoff_at: '2026-07-07 18:00' },
  { no: 96, round: '1/8 finału', homeSlot: 'W85', awaySlot: 'W87', kickoff_at: '2026-07-07 22:00' },
  { no: 97, round: 'Ćwierćfinał', homeSlot: 'W89', awaySlot: 'W90', kickoff_at: '2026-07-09 22:00' },
  { no: 98, round: 'Ćwierćfinał', homeSlot: 'W93', awaySlot: 'W94', kickoff_at: '2026-07-10 21:00' },
  { no: 99, round: 'Ćwierćfinał', homeSlot: 'W91', awaySlot: 'W92', kickoff_at: '2026-07-11 23:00' },
  { no: 100, round: 'Ćwierćfinał', homeSlot: 'W95', awaySlot: 'W96', kickoff_at: '2026-07-12 03:00' },
  { no: 101, round: 'Półfinał', homeSlot: 'W97', awaySlot: 'W98', kickoff_at: '2026-07-14 21:00' },
  { no: 102, round: 'Półfinał', homeSlot: 'W99', awaySlot: 'W100', kickoff_at: '2026-07-15 21:00' },
  { no: 103, round: 'Mecz o 3. miejsce', homeSlot: 'L101', awaySlot: 'L102', kickoff_at: '2026-07-18 23:00' },
  { no: 104, round: 'Finał', homeSlot: 'W101', awaySlot: 'W102', kickoff_at: '2026-07-19 21:00' }
];

// Stałe pary 1/16 finału (mecze 73-88), takie same dla wszystkich użytkowników.
// Nazwy muszą być identyczne jak w seedzie (scripts/seed.js).
const R32_PAIRS = {
  73: ['RPA', 'Kanada'],
  74: ['Niemcy', 'Paragwaj'],
  75: ['Holandia', 'Maroko'],
  76: ['Brazylia', 'Japonia'],
  77: ['Francja', 'Szwecja'],
  78: ['Wybrzeże Kości Słoniowej', 'Norwegia'],
  79: ['Meksyk', 'Ekwador'],
  80: ['Anglia', 'DR Konga'],
  81: ['USA', 'Bośnia i Hercegowina'],
  82: ['Belgia', 'Senegal'],
  83: ['Portugalia', 'Chorwacja'],
  84: ['Hiszpania', 'Austria'],
  85: ['Szwajcaria', 'Algieria'],
  86: ['Argentyna', 'Wyspy Zielonego Przylądka'],
  87: ['Kolumbia', 'Ghana'],
  88: ['Australia', 'Egipt']
};

function baseStats(team) {
  return { ...team, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0 };
}

function addResult(team, gf, ga) {
  team.played += 1;
  team.gf += gf;
  team.ga += ga;
  team.gd = team.gf - team.ga;
  if (gf > ga) { team.wins += 1; team.points += 3; }
  else if (gf < ga) { team.losses += 1; }
  else { team.draws += 1; team.points += 1; }
}

function compareTeams(a, b) {
  return b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name, 'pl');
}

async function calculateGroupTables(userId) {
  const teams = await all('SELECT * FROM teams ORDER BY group_name, id');
  const matches = await all(`SELECT m.*, p.home_score AS pick_home_score, p.away_score AS pick_away_score
    FROM matches m
    LEFT JOIN picks p ON p.match_id = m.id AND p.user_id = ?
    ORDER BY m.group_name, m.id`, [userId]);
  const byId = new Map(teams.map((team) => [team.id, baseStats(team)]));
  let completedPicks = 0;
  for (const match of matches) {
    if (match.pick_home_score === null || match.pick_away_score === null) continue;
    completedPicks += 1;
    addResult(byId.get(match.home_team_id), match.pick_home_score, match.pick_away_score);
    addResult(byId.get(match.away_team_id), match.pick_away_score, match.pick_home_score);
  }
  const tables = {};
  for (const group of GROUPS) {
    tables[group] = [...byId.values()].filter((team) => team.group_name === group).sort(compareTeams)
      .map((team, index) => ({ ...team, rank: index + 1 }));
  }
  return { tables, complete: completedPicks === matches.length, completedPicks, totalGroupMatches: matches.length };
}

async function calculateActualGroupTables() {
  const teams = await all('SELECT * FROM teams ORDER BY group_name, id');
  const matches = await all('SELECT m.* FROM matches m ORDER BY m.group_name, m.id');
  const byId = new Map(teams.map((team) => [team.id, baseStats(team)]));
  let playedMatches = 0;
  for (const match of matches) {
    if (match.home_score === null || match.away_score === null) continue;
    playedMatches += 1;
    addResult(byId.get(match.home_team_id), match.home_score, match.away_score);
    addResult(byId.get(match.away_team_id), match.away_score, match.home_score);
  }
  const tables = {};
  for (const group of GROUPS) {
    tables[group] = [...byId.values()].filter((team) => team.group_name === group).sort(compareTeams)
      .map((team, index) => ({ ...team, rank: index + 1 }));
  }
  return { tables, playedMatches };
}

function actualWinner(match, result) {
  if (!match || !result || result.home_score === null || result.away_score === null || result.home_score === result.away_score) return null;
  return result.home_score > result.away_score ? match.homeTeam : match.awayTeam;
}

function actualLoser(match, result) {
  if (!match || !result || result.home_score === null || result.away_score === null || result.home_score === result.away_score) return null;
  return result.home_score > result.away_score ? match.awayTeam : match.homeTeam;
}

function slotPlaceholder(slot) {
  if (/^W\d+$/.test(slot)) return `Zwycięzca M${slot.slice(1)}`;
  if (/^L\d+$/.test(slot)) return `Przegrany M${slot.slice(1)}`;
  return slot;
}

// Etykieta slotu W../L.. gdy zwycięzca/przegrany nie jest jeszcze znany:
// jeśli obie drużyny poprzedniego meczu są już ustalone, pokazujemy "A/B",
// w innym wypadku spadamy do "Zwycięzca M.." / "Przegrany M..".
function slotLabelFromPrev(slot, byNo) {
  const prev = byNo.get(Number(slot.slice(1)));
  if (prev && prev.homeTeam && prev.awayTeam) return `${prev.homeTeam.name}/${prev.awayTeam.name}`;
  return slotPlaceholder(slot);
}

// Wspólna drabinka pucharowa.
// Drużyny w 1/16 są stałe (R32_PAIRS), a awans w kolejnych rundach wynika WYŁĄCZNIE
// z rzeczywistych wyników wpisanych przez admina (knockout_results) - nigdy z typów
// użytkownika. Gdy podamy userId, na każdy mecz nakładamy typ użytkownika i punkty.
async function buildKnockout(userId = null) {
  const teams = await all('SELECT * FROM teams');
  const nameToTeam = new Map(teams.map((team) => [team.name, team]));
  const resultRows = await all('SELECT * FROM knockout_results');
  const resultMap = new Map(resultRows.map((row) => [row.match_no, row]));

  let pickMap = new Map();
  if (userId != null) {
    const picks = await all('SELECT * FROM knockout_picks WHERE user_id = ?', [userId]);
    pickMap = new Map(picks.map((pick) => [pick.match_no, pick]));
  }

  const byNo = new Map();
  const bracket = [];

  for (const spec of KNOCKOUT) {
    let homeTeam = null;
    let awayTeam = null;
    if (spec.no <= 88) {
      const pair = R32_PAIRS[spec.no] || [];
      homeTeam = nameToTeam.get(pair[0]) || null;
      awayTeam = nameToTeam.get(pair[1]) || null;
    } else {
      const resolvePrev = (slot) => {
        const prevNo = Number(slot.slice(1));
        const prev = byNo.get(prevNo);
        const prevResult = resultMap.get(prevNo) || null;
        return slot[0] === 'W' ? actualWinner(prev, prevResult) : actualLoser(prev, prevResult);
      };
      homeTeam = resolvePrev(spec.homeSlot);
      awayTeam = resolvePrev(spec.awaySlot);
    }

    const resultRow = resultMap.get(spec.no) || null;
    const result = resultRow && resultRow.home_score !== null && resultRow.away_score !== null
      ? { home_score: resultRow.home_score, away_score: resultRow.away_score }
      : null;
    const locked = resultRow ? !!resultRow.locked : false;
    const pickRow = pickMap.get(spec.no) || null;
    const pick = pickRow ? { home_score: pickRow.home_score, away_score: pickRow.away_score } : null;

    const homeLabel = homeTeam ? homeTeam.name
      : (spec.no <= 88 ? (R32_PAIRS[spec.no]?.[0] || spec.homeSlot) : slotLabelFromPrev(spec.homeSlot, byNo));
    const awayLabel = awayTeam ? awayTeam.name
      : (spec.no <= 88 ? (R32_PAIRS[spec.no]?.[1] || spec.awaySlot) : slotLabelFromPrev(spec.awaySlot, byNo));

    const known = !!(homeTeam && awayTeam);
    const editable = known && !result && !locked;
    const points = (result && pick) ? pickPoints(result, pick) : null;

    const match = { ...spec, homeTeam, awayTeam, homeLabel, awayLabel, result, pick, locked, known, editable, points };
    byNo.set(spec.no, match);
    bracket.push(match);
  }

  const rounds = {};
  for (const match of bracket) {
    rounds[match.round] ||= [];
    rounds[match.round].push(match);
  }
  const champion = actualWinner(byNo.get(104), resultMap.get(104) || null);
  return { rounds, byNo, champion, complete: true, completedPicks: 72, totalGroupMatches: 72 };
}

// Wspólna, oficjalna drabinka (bez nakładki typów konkretnego użytkownika).
function buildActualKnockout() {
  return buildKnockout(null);
}

// Ta sama drabinka co wspólna, ale z nałożonymi typami i punktami danego użytkownika.
function buildUserKnockout(userId) {
  return buildKnockout(userId);
}

module.exports = { calculateGroupTables, calculateActualGroupTables, buildActualKnockout, buildUserKnockout, KNOCKOUT };