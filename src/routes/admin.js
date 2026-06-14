const express = require('express');
const { all, get, run } = require('../db');
const { requireAdmin } = require('../middleware');
const router = express.Router();

router.use(requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const matches = await all(`SELECT m.*, ht.name AS home_team, at.name AS away_team
      FROM matches m
      JOIN teams ht ON ht.id = m.home_team_id
      JOIN teams at ON at.id = m.away_team_id
      ORDER BY m.group_name, m.id`);
    res.render('admin', { matches });
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

module.exports = router;
