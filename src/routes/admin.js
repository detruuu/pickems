const express = require('express');
const { all, get, run } = require('../db');
const { requireAdmin } = require('../middleware');
const { buildActualKnockout } = require('../bracket_logic');
const router = express.Router();

router.use(requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const matches = await all(`SELECT m.*, ht.name AS home_team, at.name AS away_team
      FROM matches m
      JOIN teams ht ON ht.id = m.home_team_id
      JOIN teams at ON at.id = m.away_team_id
      ORDER BY m.group_name, m.id`);
    // Wspólna drabinka pucharowa - admin wpisuje tu rzeczywiste wyniki (mecze 73-104).
    // Drużyny w danym meczu są znane dopiero gdy poprzednia runda jest rozstrzygnięta.
    const knockout = await buildActualKnockout();
    const knockoutMatches = Object.values(knockout.rounds).flat().sort((a, b) => a.no - b.no);
    res.render('admin', { matches, knockoutMatches });
  } catch (err) { next(err); }
});

router.post('/matches/:id/result', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const homeScore = req.body.home_score === '' ? null : Number(req.body.home_score);
    const awayScore = req.body.away_score === '' ? null : Number(req.body.away_score);
    const locked = req.body.locked ? 1 : 0;
    const match = await get('SELECT id FROM matches WHERE id = ?', [id]);
    if (!match) return res.status(404).render('error', { message: 'Mecz nie istnieje.' });
    if ((homeScore !== null && (!Number.isInteger(homeScore) || homeScore < 0)) || (awayScore !== null && (!Number.isInteger(awayScore) || awayScore < 0))) {
      req.session.flash = 'Wynik musi być pusty albo liczbą całkowitą nieujemną.';
      return res.redirect('/admin');
    }
    await run('UPDATE matches SET home_score = ?, away_score = ?, locked = ? WHERE id = ?', [homeScore, awayScore, locked, id]);
    req.session.flash = 'Mecz zaktualizowany.';
    res.redirect('/admin');
  } catch (err) { next(err); }
});

router.post('/knockout/:no/result', async (req, res, next) => {
  try {
    const no = Number(req.params.no);
    if (!Number.isInteger(no) || no < 73 || no > 104) {
      return res.status(404).render('error', { message: 'Mecz fazy pucharowej nie istnieje.' });
    }
    const homeScore = req.body.home_score === '' ? null : Number(req.body.home_score);
    const awayScore = req.body.away_score === '' ? null : Number(req.body.away_score);
    const locked = req.body.locked ? 1 : 0;
    if ((homeScore !== null && (!Number.isInteger(homeScore) || homeScore < 0)) || (awayScore !== null && (!Number.isInteger(awayScore) || awayScore < 0))) {
      req.session.flash = 'Wynik musi być pusty albo liczbą całkowitą nieujemną.';
      return res.redirect('/admin');
    }
    if ((homeScore === null) !== (awayScore === null)) {
      req.session.flash = 'Podaj oba wyniki albo zostaw oba puste.';
      return res.redirect('/admin');
    }
    if (homeScore !== null && homeScore === awayScore) {
      req.session.flash = 'W fazie pucharowej musi być zwycięzca - wpisz wynik rozstrzygnięty (np. po karnych) dla jednej drużyny.';
      return res.redirect('/admin');
    }
    await run(`INSERT INTO knockout_results (match_no, home_score, away_score, locked, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(match_no) DO UPDATE SET
      home_score = excluded.home_score,
      away_score = excluded.away_score,
      locked = excluded.locked,
      updated_at = CURRENT_TIMESTAMP`, [no, homeScore, awayScore, locked]);
    req.session.flash = 'Wynik fazy pucharowej zaktualizowany.';
    res.redirect('/admin');
  } catch (err) { next(err); }
});

module.exports = router;
