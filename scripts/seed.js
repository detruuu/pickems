require('dotenv').config();
const { init, run, get } = require('../src/db');
const { syncConfiguredUsers } = require('../src/auth_config');

const groups = {
  A: [
    { name: 'Mexico', flag: '🇲🇽' },
    { name: 'Korea Republic', flag: '🇰🇷' },
    { name: 'South Africa', flag: '🇿🇦' },
    { name: 'Czechia', flag: '🇨🇿' }
  ],
  B: [
    { name: 'Canada', flag: '🇨🇦' },
    { name: 'Switzerland', flag: '🇨🇭' },
    { name: 'Qatar', flag: '🇶🇦' },
    { name: 'Bosnia and Herzegovina', flag: '🇧🇦' }
  ],
  C: [
    { name: 'Brazil', flag: '🇧🇷' },
    { name: 'Morocco', flag: '🇲🇦' },
    { name: 'Scotland', flag: '🏴' },
    { name: 'Haiti', flag: '🇭🇹' }
  ],
  D: [
    { name: 'USA', flag: '🇺🇸' },
    { name: 'Paraguay', flag: '🇵🇾' },
    { name: 'Australia', flag: '🇦🇺' },
    { name: 'Türkiye', flag: '🇹🇷' }
  ],
  E: [
    { name: 'Germany', flag: '🇩🇪' },
    { name: 'Ecuador', flag: '🇪🇨' },
    { name: "Côte d'Ivoire", flag: '🇨🇮' },
    { name: 'Curaçao', flag: '🇨🇼' }
  ],
  F: [
    { name: 'Netherlands', flag: '🇳🇱' },
    { name: 'Japan', flag: '🇯🇵' },
    { name: 'Tunisia', flag: '🇹🇳' },
    { name: 'Sweden', flag: '🇸🇪' }
  ],
  G: [
    { name: 'Belgium', flag: '🇧🇪' },
    { name: 'IR Iran', flag: '🇮🇷' },
    { name: 'Egypt', flag: '🇪🇬' },
    { name: 'New Zealand', flag: '🇳🇿' }
  ],
  H: [
    { name: 'Spain', flag: '🇪🇸' },
    { name: 'Uruguay', flag: '🇺🇾' },
    { name: 'Saudi Arabia', flag: '🇸🇦' },
    { name: 'Cabo Verde', flag: '🇨🇻' }
  ],
  I: [
    { name: 'France', flag: '🇫🇷' },
    { name: 'Senegal', flag: '🇸🇳' },
    { name: 'Norway', flag: '🇳🇴' },
    { name: 'Iraq', flag: '🇮🇶' }
  ],
  J: [
    { name: 'Argentina', flag: '🇦🇷' },
    { name: 'Austria', flag: '🇦🇹' },
    { name: 'Algeria', flag: '🇩🇿' },
    { name: 'Jordan', flag: '🇯🇴' }
  ],
  K: [
    { name: 'Portugal', flag: '🇵🇹' },
    { name: 'Colombia', flag: '🇨🇴' },
    { name: 'Uzbekistan', flag: '🇺🇿' },
    { name: 'Congo DR', flag: '🇨🇩' }
  ],
  L: [
    { name: 'England', flag: '🏴' },
    { name: 'Croatia', flag: '🇭🇷' },
    { name: 'Panama', flag: '🇵🇦' },
    { name: 'Ghana', flag: '🇬🇭' }
  ]
};

const fixtures = [
  ['A','Mexico','South Africa','2026-06-11 00:00'], ['A','Korea Republic','Czechia','2026-06-12 00:00'], ['A','Czechia','South Africa','2026-06-18 00:00'], ['A','Mexico','Korea Republic','2026-06-18 00:00'], ['A','Czechia','Mexico','2026-06-24 00:00'], ['A','South Africa','Korea Republic','2026-06-24 00:00'],
  ['B','Canada','Bosnia and Herzegovina','2026-06-12 00:00'], ['B','Qatar','Switzerland','2026-06-13 00:00'], ['B','Switzerland','Bosnia and Herzegovina','2026-06-18 00:00'], ['B','Canada','Qatar','2026-06-18 00:00'], ['B','Switzerland','Canada','2026-06-24 00:00'], ['B','Bosnia and Herzegovina','Qatar','2026-06-24 00:00'],
  ['C','Brazil','Morocco','2026-06-13 00:00'], ['C','Haiti','Scotland','2026-06-14 00:00'], ['C','Brazil','Haiti','2026-06-19 00:00'], ['C','Scotland','Morocco','2026-06-19 00:00'], ['C','Scotland','Brazil','2026-06-24 00:00'], ['C','Morocco','Haiti','2026-06-24 00:00'],
  ['D','USA','Paraguay','2026-06-13 00:00'], ['D','Australia','Türkiye','2026-06-14 00:00'], ['D','USA','Australia','2026-06-19 00:00'], ['D','Türkiye','Paraguay','2026-06-19 00:00'], ['D','Türkiye','USA','2026-06-25 00:00'], ['D','Paraguay','Australia','2026-06-25 00:00'],
  ['E','Germany','Curaçao','2026-06-14 00:00'], ['E',"Côte d'Ivoire",'Ecuador','2026-06-15 00:00'], ['E','Germany',"Côte d'Ivoire",'2026-06-20 00:00'], ['E','Ecuador','Curaçao','2026-06-20 00:00'], ['E','Curaçao',"Côte d'Ivoire",'2026-06-25 00:00'], ['E','Ecuador','Germany','2026-06-25 00:00'],
  ['F','Netherlands','Japan','2026-06-14 00:00'], ['F','Sweden','Tunisia','2026-06-15 00:00'], ['F','Netherlands','Sweden','2026-06-20 00:00'], ['F','Tunisia','Japan','2026-06-20 00:00'], ['F','Tunisia','Netherlands','2026-06-25 00:00'], ['F','Japan','Sweden','2026-06-25 00:00'],
  ['G','Belgium','Egypt','2026-06-15 00:00'], ['G','IR Iran','New Zealand','2026-06-16 00:00'], ['G','Belgium','IR Iran','2026-06-21 00:00'], ['G','New Zealand','Egypt','2026-06-21 00:00'], ['G','New Zealand','Belgium','2026-06-26 00:00'], ['G','Egypt','IR Iran','2026-06-26 00:00'],
  ['H','Spain','Cabo Verde','2026-06-15 00:00'], ['H','Saudi Arabia','Uruguay','2026-06-15 00:00'], ['H','Uruguay','Cabo Verde','2026-06-21 00:00'], ['H','Spain','Saudi Arabia','2026-06-21 00:00'], ['H','Cabo Verde','Saudi Arabia','2026-06-26 00:00'], ['H','Uruguay','Spain','2026-06-26 00:00'],
  ['I','France','Senegal','2026-06-16 00:00'], ['I','Iraq','Norway','2026-06-16 00:00'], ['I','Norway','Senegal','2026-06-22 00:00'], ['I','France','Iraq','2026-06-22 00:00'], ['I','Norway','France','2026-06-26 00:00'], ['I','Senegal','Iraq','2026-06-26 00:00'],
  ['J','Argentina','Algeria','2026-06-17 00:00'], ['J','Austria','Jordan','2026-06-17 00:00'], ['J','Argentina','Austria','2026-06-22 00:00'], ['J','Jordan','Algeria','2026-06-22 00:00'], ['J','Algeria','Austria','2026-06-27 00:00'], ['J','Jordan','Argentina','2026-06-27 00:00'],
  ['K','Portugal','Congo DR','2026-06-17 00:00'], ['K','Uzbekistan','Colombia','2026-06-17 00:00'], ['K','Portugal','Uzbekistan','2026-06-23 00:00'], ['K','Colombia','Congo DR','2026-06-23 00:00'], ['K','Colombia','Portugal','2026-06-27 00:00'], ['K','Congo DR','Uzbekistan','2026-06-27 00:00'],
  ['L','England','Croatia','2026-06-17 00:00'], ['L','Ghana','Panama','2026-06-17 00:00'], ['L','England','Ghana','2026-06-23 00:00'], ['L','Panama','Croatia','2026-06-23 00:00'], ['L','Panama','England','2026-06-27 00:00'], ['L','Croatia','Ghana','2026-06-27 00:00']
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

  console.log('Seed complete: official World Cup 2026 groups, flags and group-stage fixtures loaded. Existing picks were cleared. Kickoff times are date placeholders only.');
}

seed().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
