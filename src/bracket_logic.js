const { all, get } = require('./db');

const GROUPS = 'ABCDEFGHIJKL'.split('');

const ROUND32 = [
  { no: 73, round: '1/16 finału', homeSlot: '2A', awaySlot: '2B', kickoff_at: '2026-06-28 18:00' },
  { no: 74, round: '1/16 finału', homeSlot: '1E', awaySlot: '3ABCDF', kickoff_at: '2026-06-28 21:00' },
  { no: 75, round: '1/16 finału', homeSlot: '1F', awaySlot: '2C', kickoff_at: '2026-06-29 18:00' },
  { no: 76, round: '1/16 finału', homeSlot: '1C', awaySlot: '2F', kickoff_at: '2026-06-29 21:00' },
  { no: 77, round: '1/16 finału', homeSlot: '1I', awaySlot: '3CDFGH', kickoff_at: '2026-06-30 18:00' },
  { no: 78, round: '1/16 finału', homeSlot: '2E', awaySlot: '2I', kickoff_at: '2026-06-30 21:00' },
  { no: 79, round: '1/16 finału', homeSlot: '1A', awaySlot: '3CEFHI', kickoff_at: '2026-07-01 18:00' },
  { no: 80, round: '1/16 finału', homeSlot: '1L', awaySlot: '3EHIJK', kickoff_at: '2026-07-01 21:00' },
  { no: 81, round: '1/16 finału', homeSlot: '1D', awaySlot: '3BEFIJ', kickoff_at: '2026-07-02 18:00' },
  { no: 82, round: '1/16 finału', homeSlot: '1G', awaySlot: '3AEHIJ', kickoff_at: '2026-07-02 21:00' },
  { no: 83, round: '1/16 finału', homeSlot: '2K', awaySlot: '2L', kickoff_at: '2026-07-03 18:00' },
  { no: 84, round: '1/16 finału', homeSlot: '1H', awaySlot: '2J', kickoff_at: '2026-07-03 21:00' },
  { no: 85, round: '1/16 finału', homeSlot: '1B', awaySlot: '3EFGIJ', kickoff_at: '2026-07-04 18:00' },
  { no: 86, round: '1/16 finału', homeSlot: '1J', awaySlot: '2H', kickoff_at: '2026-07-04 21:00' },
  { no: 87, round: '1/16 finału', homeSlot: '1K', awaySlot: '3DEIJL', kickoff_at: '2026-07-05 18:00' },
  { no: 88, round: '1/16 finału', homeSlot: '2D', awaySlot: '2G', kickoff_at: '2026-07-05 21:00' }
];

const KNOCKOUT = [
  ...ROUND32,
  { no: 89, round: '1/8 finału', homeSlot: 'W74', awaySlot: 'W77', kickoff_at: '2026-07-06 18:00' },
  { no: 90, round: '1/8 finału', homeSlot: 'W73', awaySlot: 'W75', kickoff_at: '2026-07-06 21:00' },
  { no: 91, round: '1/8 finału', homeSlot: 'W76', awaySlot: 'W78', kickoff_at: '2026-07-07 18:00' },
  { no: 92, round: '1/8 finału', homeSlot: 'W79', awaySlot: 'W80', kickoff_at: '2026-07-07 21:00' },
  { no: 93, round: '1/8 finału', homeSlot: 'W83', awaySlot: 'W84', kickoff_at: '2026-07-08 18:00' },
  { no: 94, round: '1/8 finału', homeSlot: 'W81', awaySlot: 'W82', kickoff_at: '2026-07-08 21:00' },
  { no: 95, round: '1/8 finału', homeSlot: 'W86', awaySlot: 'W88', kickoff_at: '2026-07-09 18:00' },
  { no: 96, round: '1/8 finału', homeSlot: 'W85', awaySlot: 'W87', kickoff_at: '2026-07-09 21:00' },
  { no: 97, round: 'Ćwierćfinał', homeSlot: 'W89', awaySlot: 'W90', kickoff_at: '2026-07-10 18:00' },
  { no: 98, round: 'Ćwierćfinał', homeSlot: 'W93', awaySlot: 'W94', kickoff_at: '2026-07-10 21:00' },
  { no: 99, round: 'Ćwierćfinał', homeSlot: 'W91', awaySlot: 'W92', kickoff_at: '2026-07-11 18:00' },
  { no: 100, round: 'Ćwierćfinał', homeSlot: 'W95', awaySlot: 'W96', kickoff_at: '2026-07-11 21:00' },
  { no: 101, round: 'Półfinał', homeSlot: 'W97', awaySlot: 'W98', kickoff_at: '2026-07-13 20:00' },
  { no: 102, round: 'Półfinał', homeSlot: 'W99', awaySlot: 'W100', kickoff_at: '2026-07-14 20:00' },
  { no: 103, round: 'Mecz o 3. miejsce', homeSlot: 'L101', awaySlot: 'L102', kickoff_at: '2026-07-18 16:00' },
  { no: 104, round: 'Finał', homeSlot: 'W101', awaySlot: 'W102', kickoff_at: '2026-07-19 20:00' }
];

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

function compareThirds(a, b) {
  return compareTeams(a, b);
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

function chooseThirdAssignments(thirds, slots) {
  const candidatesByGroup = new Map(thirds.map((team, idx) => [team.group_name, { team, idx }]));
  let best = null;
  function scoreAssignment(assignment) {
    return assignment.map((team) => thirds.findIndex((t) => t.id === team.id));
  }
  function better(candidate, current) {
    if (!current) return true;
    const a = scoreAssignment(candidate);
    const b = scoreAssignment(current);
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return a[i] < b[i];
    }
    return false;
  }
  function backtrack(i, used, assignment) {
    if (i === slots.length) {
      if (better(assignment, best)) best = assignment.slice();
      return;
    }
    const allowed = slots[i].replace(/^3/, '').split('');
    for (const group of allowed) {
      const candidate = candidatesByGroup.get(group);
      if (!candidate || used.has(group)) continue;
      used.add(group);
      assignment.push(candidate.team);
      backtrack(i + 1, used, assignment);
      assignment.pop();
      used.delete(group);
    }
  }
  backtrack(0, new Set(), []);
  return best || [];
}

function slotLabel(slot) {
  if (/^[12][A-L]$/.test(slot)) return `${slot[0]}. miejsce grupa ${slot[1]}`;
  if (/^3[A-L]+$/.test(slot)) return `najlepsza 3. drużyna z ${slot.slice(1).split('').join('/')}`;
  if (/^[WL]\d+$/.test(slot)) return `${slot[0] === 'W' ? 'zwycięzca' : 'przegrany'} M${slot.slice(1)}`;
  return slot;
}

function getPotentialLabel(slot, tables, thirdMap, byNo) {
  if (/^[12][A-L]$/.test(slot)) {
    const rank = Number(slot[0]);
    const group = slot[1];
    const team = tables[group]?.[rank - 1];
    return team ? team.name : `${rank}. grupa ${group}`;
  }
  if (/^3[A-L]+$/.test(slot)) {
    const team = thirdMap.get(slot);
    return team ? team.name : `3. ${slot.slice(1).split('').join('/')}`;
  }
  if (/^[WL]\d+$/.test(slot)) {
    const prevNo = Number(slot.slice(1));
    const prev = byNo.get(prevNo);
    if (prev) {
      if (slot[0] === 'W') {
        const winner = prev.pick ? pickWinner(prev, prev.pick) : null;
        if (winner) return winner.name;
        if (prev.homeTeam && prev.awayTeam) return `${prev.homeTeam.name}/${prev.awayTeam.name}`;
      } else {
        const loser = prev.pick ? pickLoser(prev, prev.pick) : null;
        if (loser) return loser.name;
        if (prev.homeTeam && prev.awayTeam) return `${prev.homeTeam.name}/${prev.awayTeam.name}`;
      }
    }
    return `${slot[0] === 'W' ? 'Zwycięzca' : 'Przegrany'} M${prevNo}`;
  }
  return slot;
}

function resolveInitialSlot(slot, tables, thirdMap) {
  if (/^[12][A-L]$/.test(slot)) {
    const rank = Number(slot[0]);
    const group = slot[1];
    return tables[group]?.[rank - 1] || null;
  }
  if (/^3[A-L]+$/.test(slot)) return thirdMap.get(slot) || null;
  return null;
}

function pickWinner(match, pick) {
  if (!pick || pick.home_score === null || pick.away_score === null || pick.home_score === pick.away_score) return null;
  return pick.home_score > pick.away_score ? match.homeTeam : match.awayTeam;
}

function pickLoser(match, pick) {
  if (!pick || pick.home_score === null || pick.away_score === null || pick.home_score === pick.away_score) return null;
  return pick.home_score > pick.away_score ? match.awayTeam : match.homeTeam;
}

async function buildBracket(userId) {
  const { tables, complete, completedPicks, totalGroupMatches } = await calculateGroupTables(userId);
  const picks = await all('SELECT * FROM knockout_picks WHERE user_id = ?', [userId]);
  const pickMap = new Map(picks.map((pick) => [pick.match_no, pick]));
  const thirdSlots = ROUND32.map((match) => [match.homeSlot, match.awaySlot]).flat().filter((slot) => /^3/.test(slot));
  const thirds = GROUPS.map((group) => tables[group]?.[2]).filter(Boolean).sort(compareThirds).slice(0, 8);
  const assignedThirds = chooseThirdAssignments(thirds, thirdSlots);
  const thirdMap = new Map(thirdSlots.map((slot, index) => [slot, assignedThirds[index] || null]));
  const byNo = new Map();
  const bracket = [];

  for (const spec of KNOCKOUT) {
    let homeTeam = null;
    let awayTeam = null;
    if (spec.no <= 88) {
      homeTeam = complete ? resolveInitialSlot(spec.homeSlot, tables, thirdMap) : null;
      awayTeam = complete ? resolveInitialSlot(spec.awaySlot, tables, thirdMap) : null;
    } else {
      const resolvePrev = (slot) => {
        const prev = byNo.get(Number(slot.slice(1)));
        const prevPick = pickMap.get(Number(slot.slice(1)));
        return slot[0] === 'W' ? pickWinner(prev, prevPick) : pickLoser(prev, prevPick);
      };
      homeTeam = resolvePrev(spec.homeSlot);
      awayTeam = resolvePrev(spec.awaySlot);
    }
    const pick = pickMap.get(spec.no) || null;
    
    // Budujemy tymczasowy obiekt meczu (aby getPotentialLabel działało prawidłowo)
    const tempMatch = { ...spec, homeTeam, awayTeam, pick };
    byNo.set(spec.no, tempMatch);

    const homeLabel = getPotentialLabel(spec.homeSlot, tables, thirdMap, byNo);
    const awayLabel = getPotentialLabel(spec.awaySlot, tables, thirdMap, byNo);

    const match = { ...tempMatch, homeLabel, awayLabel };
    byNo.set(spec.no, match);
    bracket.push(match);
  }

  const rounds = {};
  for (const match of bracket) {
    rounds[match.round] ||= [];
    rounds[match.round].push(match);
  }
  const champion = pickWinner(byNo.get(104), pickMap.get(104));
  return { tables, complete, completedPicks, totalGroupMatches, rounds, champion };
}

async function buildOfficialBracket(userId) {
  const { tables, playedMatches } = await calculateActualGroupTables();
  const complete = playedMatches === 72;
  const picks = await all('SELECT * FROM knockout_picks WHERE user_id = ?', [userId]);
  const pickMap = new Map(picks.map((pick) => [pick.match_no, pick]));
  const thirdSlots = ROUND32.map((match) => [match.homeSlot, match.awaySlot]).flat().filter((slot) => /^3/.test(slot));
  const thirds = GROUPS.map((group) => tables[group]?.[2]).filter(Boolean).sort(compareThirds).slice(0, 8);
  const assignedThirds = chooseThirdAssignments(thirds, thirdSlots);
  const thirdMap = new Map(thirdSlots.map((slot, index) => [slot, assignedThirds[index] || null]));
  const byNo = new Map();
  const bracket = [];

  for (const spec of KNOCKOUT) {
    let homeTeam = null;
    let awayTeam = null;
    if (spec.no <= 88) {
      homeTeam = complete ? resolveInitialSlot(spec.homeSlot, tables, thirdMap) : null;
      awayTeam = complete ? resolveInitialSlot(spec.awaySlot, tables, thirdMap) : null;
    } else {
      const resolvePrev = (slot) => {
        const prev = byNo.get(Number(slot.slice(1)));
        const prevPick = pickMap.get(Number(slot.slice(1)));
        return slot[0] === 'W' ? pickWinner(prev, prevPick) : pickLoser(prev, prevPick);
      };
      homeTeam = resolvePrev(spec.homeSlot);
      awayTeam = resolvePrev(spec.awaySlot);
    }
    const pick = pickMap.get(spec.no) || null;
    const tempMatch = { ...spec, homeTeam, awayTeam, pick };
    byNo.set(spec.no, tempMatch);

    const homeLabel = getPotentialLabel(spec.homeSlot, tables, thirdMap, byNo);
    const awayLabel = getPotentialLabel(spec.awaySlot, tables, thirdMap, byNo);

    const match = { ...tempMatch, homeLabel, awayLabel };
    byNo.set(spec.no, match);
    bracket.push(match);
  }

  const rounds = {};
  for (const match of bracket) {
    rounds[match.round] ||= [];
    rounds[match.round].push(match);
  }
  const champion = pickWinner(byNo.get(104), pickMap.get(104));
  return { tables, complete, completedPicks: playedMatches, totalGroupMatches: 72, rounds, champion };
}

module.exports = { calculateGroupTables, calculateActualGroupTables, buildBracket, buildOfficialBracket, KNOCKOUT };
