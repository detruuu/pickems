require('dotenv').config();
const { init, run, get } = require('../src/db');
const { syncConfiguredUsers } = require('../src/auth_config');

const groups = {
  A: [
    { name: 'Meksyk', flag: 'mx' },
    { name: 'Korea Południowa', flag: 'kr' },
    { name: 'RPA', flag: 'za' },
    { name: 'Czechy', flag: 'cz' }
  ],
  B: [
    { name: 'Kanada', flag: 'ca' },
    { name: 'Szwajcaria', flag: 'ch' },
    { name: 'Katar', flag: 'qa' },
    { name: 'Bośnia i Hercegowina', flag: 'ba' }
  ],
  C: [
    { name: 'Brazylia', flag: 'br' },
    { name: 'Maroko', flag: 'ma' },
    { name: 'Szkocja', flag: 'gb-sct' },
    { name: 'Haiti', flag: 'ht' }
  ],
  D: [
    { name: 'USA', flag: 'us' },
    { name: 'Paragwaj', flag: 'py' },
    { name: 'Australia', flag: 'au' },
    { name: 'Turcja', flag: 'tr' }
  ],
  E: [
    { name: 'Niemcy', flag: 'de' },
    { name: 'Ekwador', flag: 'ec' },
    { name: "Wybrzeże Kości Słoniowej", flag: 'ci' },
    { name: 'Curaçao', flag: 'cw' }
  ],
  F: [
    { name: 'Holandia', flag: 'nl' },
    { name: 'Japonia', flag: 'jp' },
    { name: 'Tunezja', flag: 'tn' },
    { name: 'Szwecja', flag: 'se' }
  ],
  G: [
    { name: 'Belgia', flag: 'be' },
    { name: 'Iran', flag: 'ir' },
    { name: 'Egipt', flag: 'eg' },
    { name: 'Nowa Zelandia', flag: 'nz' }
  ],
  H: [
    { name: 'Hiszpania', flag: 'es' },
    { name: 'Urugwaj', flag: 'uy' },
    { name: 'Arabia Saudyjska', flag: 'sa' },
    { name: 'Wyspy Zielonego Przylądka', flag: 'cv' }
  ],
  I: [
    { name: 'Francja', flag: 'fr' },
    { name: 'Senegal', flag: 'sn' },
    { name: 'Norwegia', flag: 'no' },
    { name: 'Irak', flag: 'iq' }
  ],
  J: [
    { name: 'Argentyna', flag: 'ar' },
    { name: 'Austria', flag: 'at' },
    { name: 'Algieria', flag: 'dz' },
    { name: 'Jordania', flag: 'jo' }
  ],
  K: [
    { name: 'Portugalia', flag: 'pt' },
    { name: 'Kolumbia', flag: 'co' },
    { name: 'Uzbekistan', flag: 'uz' },
    { name: 'DR Konga', flag: 'cd' }
  ],
  L: [
    { name: 'Anglia', flag: 'gb-eng' },
    { name: 'Chorwacja', flag: 'hr' },
    { name: 'Panama', flag: 'pa' },
    { name: 'Ghana', flag: 'gh' }
  ]
};

// kickoff_at values are Europe/Warsaw local time (CEST during World Cup 2026).
const fixtures = [
  // Group A
  ['A', 'Meksyk', 'RPA', '2026-06-11 21:00'],
  ['A', 'Korea Południowa', 'Czechy', '2026-06-12 04:00'],
  ['A', 'Czechy', 'RPA', '2026-06-18 18:00'],
  ['A', 'Meksyk', 'Korea Południowa', '2026-06-19 03:00'],
  ['A', 'Czechy', 'Meksyk', '2026-06-25 03:00'],
  ['A', 'RPA', 'Korea Południowa', '2026-06-25 03:00'],

  // Group B
  ['B', 'Kanada', 'Bośnia i Hercegowina', '2026-06-12 21:00'],
  ['B', 'Katar', 'Szwajcaria', '2026-06-13 21:00'],
  ['B', 'Szwajcaria', 'Bośnia i Hercegowina', '2026-06-18 21:00'],
  ['B', 'Kanada', 'Katar', '2026-06-19 00:00'],
  ['B', 'Szwajcaria', 'Kanada', '2026-06-24 21:00'],
  ['B', 'Bośnia i Hercegowina', 'Katar', '2026-06-24 21:00'],

  // Group C
  ['C', 'Brazylia', 'Maroko', '2026-06-14 00:00'],
  ['C', 'Haiti', 'Szkocja', '2026-06-14 03:00'],
  ['C', 'Brazylia', 'Haiti', '2026-06-20 02:30'],
  ['C', 'Szkocja', 'Maroko', '2026-06-20 00:00'],
  ['C', 'Szkocja', 'Brazylia', '2026-06-25 00:00'],
  ['C', 'Maroko', 'Haiti', '2026-06-25 00:00'],

  // Group D
  ['D', 'USA', 'Paragwaj', '2026-06-13 03:00'],
  ['D', 'Australia', 'Turcja', '2026-06-14 06:00'],
  ['D', 'USA', 'Australia', '2026-06-19 21:00'],
  ['D', 'Turcja', 'Paragwaj', '2026-06-20 05:00'],
  ['D', 'Turcja', 'USA', '2026-06-26 04:00'],
  ['D', 'Paragwaj', 'Australia', '2026-06-26 04:00'],

  // Group E
  ['E', 'Niemcy', 'Curaçao', '2026-06-14 19:00'],
  ['E', 'Wybrzeże Kości Słoniowej', 'Ekwador', '2026-06-15 01:00'],
  ['E', 'Niemcy', 'Wybrzeże Kości Słoniowej', '2026-06-20 22:00'],
  ['E', 'Ekwador', 'Curaçao', '2026-06-21 02:00'],
  ['E', 'Curaçao', 'Wybrzeże Kości Słoniowej', '2026-06-25 22:00'],
  ['E', 'Ekwador', 'Niemcy', '2026-06-25 22:00'],

  // Group F
  ['F', 'Holandia', 'Japonia', '2026-06-14 22:00'],
  ['F', 'Szwecja', 'Tunezja', '2026-06-15 04:00'],
  ['F', 'Holandia', 'Szwecja', '2026-06-20 19:00'],
  ['F', 'Tunezja', 'Japonia', '2026-06-21 06:00'],
  ['F', 'Tunezja', 'Holandia', '2026-06-26 01:00'],
  ['F', 'Japonia', 'Szwecja', '2026-06-26 01:00'],

  // Group G
  ['G', 'Belgia', 'Egipt', '2026-06-15 21:00'],
  ['G', 'Iran', 'Nowa Zelandia', '2026-06-16 03:00'],
  ['G', 'Belgia', 'Iran', '2026-06-21 21:00'],
  ['G', 'Nowa Zelandia', 'Egipt', '2026-06-22 03:00'],
  ['G', 'Nowa Zelandia', 'Belgia', '2026-06-27 05:00'],
  ['G', 'Egipt', 'Iran', '2026-06-27 05:00'],

  // Group H
  ['H', 'Hiszpania', 'Wyspy Zielonego Przylądka', '2026-06-15 18:00'],
  ['H', 'Arabia Saudyjska', 'Urugwaj', '2026-06-16 00:00'],
  ['H', 'Urugwaj', 'Wyspy Zielonego Przylądka', '2026-06-22 00:00'],
  ['H', 'Hiszpania', 'Arabia Saudyjska', '2026-06-21 18:00'],
  ['H', 'Wyspy Zielonego Przylądka', 'Arabia Saudyjska', '2026-06-27 02:00'],
  ['H', 'Urugwaj', 'Hiszpania', '2026-06-27 02:00'],

  // Group I
  ['I', 'Francja', 'Senegal', '2026-06-16 21:00'],
  ['I', 'Irak', 'Norwegia', '2026-06-17 00:00'],
  ['I', 'Norwegia', 'Senegal', '2026-06-23 02:00'],
  ['I', 'Francja', 'Irak', '2026-06-22 23:00'],
  ['I', 'Norwegia', 'Francja', '2026-06-26 21:00'],
  ['I', 'Senegal', 'Irak', '2026-06-26 21:00'],

  // Group J
  ['J', 'Argentyna', 'Algieria', '2026-06-17 03:00'],
  ['J', 'Austria', 'Jordania', '2026-06-17 06:00'],
  ['J', 'Argentyna', 'Austria', '2026-06-22 19:00'],
  ['J', 'Jordania', 'Algieria', '2026-06-23 05:00'],
  ['J', 'Algieria', 'Austria', '2026-06-28 04:00'],
  ['J', 'Jordania', 'Argentyna', '2026-06-28 04:00'],

  // Group K
  ['K', 'Portugalia', 'DR Konga', '2026-06-17 19:00'],
  ['K', 'Uzbekistan', 'Kolumbia', '2026-06-18 04:00'],
  ['K', 'Portugalia', 'Uzbekistan', '2026-06-23 19:00'],
  ['K', 'Kolumbia', 'DR Konga', '2026-06-24 04:00'],
  ['K', 'Kolumbia', 'Portugalia', '2026-06-28 01:30'],
  ['K', 'DR Konga', 'Uzbekistan', '2026-06-28 01:30'],

  // Group L
  ['L', 'Anglia', 'Chorwacja', '2026-06-17 22:00'],
  ['L', 'Ghana', 'Panama', '2026-06-18 01:00'],
  ['L', 'Anglia', 'Ghana', '2026-06-23 22:00'],
  ['L', 'Panama', 'Chorwacja', '2026-06-24 01:00'],
  ['L', 'Panama', 'Anglia', '2026-06-27 23:00'],
  ['L', 'Chorwacja', 'Ghana', '2026-06-27 23:00']
];

async function seed() {
  await init();
  await syncConfiguredUsers();

  await run('DELETE FROM knockout_picks');
  await run('DELETE FROM picks');
  await run('DELETE FROM matches');
  await run('DELETE FROM teams');

  for (const [groupName, teams] of Object.entries(groups)) {
    for (const team of teams) {
      await run('INSERT INTO teams (name, group_name, flag) VALUES (?, ?, ?)', [team.name, groupName, team.flag]);
    }
  }

  for (const [groupName, homeName, awayName, kickoffAt] of fixtures) {
    const home = await get('SELECT id FROM teams WHERE name = ? AND group_name = ?', [homeName, groupName]);
    const away = await get('SELECT id FROM teams WHERE name = ? AND group_name = ?', [awayName, groupName]);
    if (!home || !away) throw new Error(`Missing team in fixture: ${groupName} ${homeName} vs ${awayName}`);
    await run('INSERT INTO matches (group_name, home_team_id, away_team_id, kickoff_at) VALUES (?, ?, ?, ?)', [groupName, home.id, away.id, kickoffAt]);
  }

  console.log('Seed complete: official World Cup 2026 groups, flags and group-stage fixtures loaded. Existing picks were cleared. Kickoff times are stored in Polish time (CEST).');
}

seed().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});