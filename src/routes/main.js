const express = require('express');
const { all, get, run, pickPoints } = require('../db');
const { requireAuth } = require('../middleware');
const { buildUserKnockout, buildActualKnockout, calculateGroupTables, calculateActualGroupTables } = require('../bracket_logic');
const router = express.Router();

async function getMatchesWithPicks(userId) {
  return all(`SELECT m.*, ht.name AS home_team, ht.flag AS home_flag, at.name AS away_team, at.flag AS away_flag,
    p.home_score AS pick_home_score, p.away_score AS pick_away_score
    FROM matches m
    JOIN teams ht ON ht.id = m.home_team_id
    JOIN teams at ON at.id = m.away_team_id
    LEFT JOIN picks p ON p.match_id = m.id AND p.user_id = ?
    ORDER BY m.group_name, m.id`, [userId]);
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const matches = await getMatchesWithPicks(req.session.user.id);
    const groups = {};
    for (const match of matches) {
      groups[match.group_name] ||= [];
      groups[match.group_name].push(match);
    }
    res.render('dashboard', { groups, pickPoints });
  } catch (err) { next(err); }
});

router.get('/groups', requireAuth, async (req, res, next) => {
  try {
    const predicted = await calculateGroupTables(req.session.user.id);
    const actual = await calculateActualGroupTables();
    res.render('groups', {
      predictedTables: predicted.tables,
      actualTables: actual.tables
    });
  } catch (err) { next(err); }
});

router.post('/picks/save-all', requireAuth, async (req, res, next) => {
  try {
    const matches = await all('SELECT * FROM matches ORDER BY id');
    const submitted = [];

    for (const match of matches) {
      if (match.locked) continue;
      const homeRaw = req.body[`home_${match.id}`];
      const awayRaw = req.body[`away_${match.id}`];
      const hasAnyValue = homeRaw !== undefined && homeRaw !== '' || awayRaw !== undefined && awayRaw !== '';
      if (!hasAnyValue) continue;

      const homeScore = Number(homeRaw);
      const awayScore = Number(awayRaw);
      if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
        req.session.flash = 'Wszystkie wpisane wyniki muszą być liczbami całkowitymi nieujemnymi. Nic nie zapisano.';
        return res.redirect("/ranking");
      }
      submitted.push({ matchId: match.id, homeScore, awayScore });
    }

    for (const pick of submitted) {
      await run(`INSERT INTO picks (user_id, match_id, home_score, away_score, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, match_id) DO UPDATE SET
        home_score = excluded.home_score,
        away_score = excluded.away_score,
        updated_at = CURRENT_TIMESTAMP`, [req.session.user.id, pick.matchId, pick.homeScore, pick.awayScore]);
    }

    if (submitted.length > 0) {
      await run('DELETE FROM knockout_picks WHERE user_id = ?', [req.session.user.id]);
    }
    req.session.flash = submitted.length > 0
      ? `Zapisano ${submitted.length} typów grupowych. Drabinka została przeliczona, więc wcześniejsze typy fazy pucharowej zostały wyczyszczone.`
      : 'Nie było nowych typów do zapisania.';
    res.redirect("/ranking");
  } catch (err) { next(err); }
});

router.post('/picks/:matchId', requireAuth, async (req, res, next) => {
  try {
    const matchId = Number(req.params.matchId);
    const homeScore = Number(req.body.home_score);
    const awayScore = Number(req.body.away_score);
    const match = await get('SELECT * FROM matches WHERE id = ?', [matchId]);
    if (!match) return res.status(404).render('error', { message: 'Mecz nie istnieje.' });
    if (match.locked) {
      req.session.flash = 'Typowanie dla tego meczu jest już zablokowane.';
      return res.redirect("/ranking");
    }
    if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
      req.session.flash = 'Wynik musi być liczbą całkowitą nieujemną.';
      return res.redirect("/ranking");
    }
    await run(`INSERT INTO picks (user_id, match_id, home_score, away_score, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, match_id) DO UPDATE SET
      home_score = excluded.home_score,
      away_score = excluded.away_score,
      updated_at = CURRENT_TIMESTAMP`, [req.session.user.id, matchId, homeScore, awayScore]);
    await run('DELETE FROM knockout_picks WHERE user_id = ?', [req.session.user.id]);
    req.session.flash = 'Typ zapisany. Drabinka została przeliczona, więc wcześniejsze typy fazy pucharowej tego użytkownika zostały wyczyszczone.';
    res.redirect("/ranking");
  } catch (err) { next(err); }
});


router.get('/bracket', requireAuth, async (req, res, next) => {
  try {
    const data = await buildUserKnockout(req.session.user.id);
    res.render('bracket', data);
  } catch (err) { next(err); }
});


router.post('/bracket/save-all', requireAuth, async (req, res, next) => {
  try {
    const data = await buildUserKnockout(req.session.user.id);
    // Typować można tylko mecze, w których admin ustalił już obie drużyny i które
    // nie są jeszcze rozstrzygnięte/zablokowane (match.editable).
    const editableMatches = Object.values(data.rounds).flat().filter((match) => match.editable);
    const submitted = [];

    for (const match of editableMatches) {
      const homeRaw = req.body[`home_${match.no}`];
      const awayRaw = req.body[`away_${match.no}`];
      const hasAnyValue = homeRaw !== undefined && homeRaw !== '' || awayRaw !== undefined && awayRaw !== '';
      if (!hasAnyValue) continue;

      const homeScore = Number(homeRaw);
      const awayScore = Number(awayRaw);
      if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
        req.session.flash = 'Wszystkie wpisane wyniki muszą być liczbami całkowitymi nieujemnymi. Nic nie zapisano.';
        return res.redirect('/bracket');
      }
      if (homeScore === awayScore) {
        req.session.flash = 'W fazie pucharowej każdy wpisany mecz musi mieć zwycięzcę. Nic nie zapisano.';
        return res.redirect('/bracket');
      }
      submitted.push({ matchNo: match.no, homeScore, awayScore });
    }

    for (const pick of submitted) {
      await run(`INSERT INTO knockout_picks (user_id, match_no, home_score, away_score, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, match_no) DO UPDATE SET
        home_score = excluded.home_score,
        away_score = excluded.away_score,
        updated_at = CURRENT_TIMESTAMP`, [req.session.user.id, pick.matchNo, pick.homeScore, pick.awayScore]);
    }

    req.session.flash = submitted.length > 0
      ? `Zapisano ${submitted.length} typów fazy pucharowej.`
      : 'Nie było nowych typów fazy pucharowej do zapisania.';
    res.redirect('/bracket');
  } catch (err) { next(err); }
});

router.post('/bracket/:matchNo', requireAuth, async (req, res, next) => {
  try {
    const matchNo = Number(req.params.matchNo);
    const homeScore = Number(req.body.home_score);
    const awayScore = Number(req.body.away_score);
    if (!Number.isInteger(matchNo) || matchNo < 73 || matchNo > 104) {
      return res.status(404).render('error', { message: 'Mecz fazy pucharowej nie istnieje.' });
    }
    if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
      req.session.flash = 'Wynik musi być liczbą całkowitą nieujemną.';
      return res.redirect('/bracket');
    }
    if (homeScore === awayScore) {
      req.session.flash = 'W fazie pucharowej wybierz zwycięzcę. Remis po dogrywce/karnych zapisz jako wynik końcowy rozstrzygnięty dla jednej drużyny.';
      return res.redirect('/bracket');
    }

    const data = await buildUserKnockout(req.session.user.id);
    const match = data.byNo.get(matchNo);
    if (!match || !match.editable) {
      req.session.flash = 'Tego meczu nie można teraz typować: drużyny nie są jeszcze znane albo mecz został już rozstrzygnięty przez admina.';
      return res.redirect('/bracket');
    }

    await run(`INSERT INTO knockout_picks (user_id, match_no, home_score, away_score, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, match_no) DO UPDATE SET
      home_score = excluded.home_score,
      away_score = excluded.away_score,
      updated_at = CURRENT_TIMESTAMP`, [req.session.user.id, matchNo, homeScore, awayScore]);
    req.session.flash = 'Typ fazy pucharowej zapisany.';
    res.redirect('/bracket');
  } catch (err) { next(err); }
});


router.get('/ranking', requireAuth, async (req, res, next) => {
  try {
    const users = await all('SELECT id, name, email FROM users ORDER BY name');
    const rows = [];
    for (const user of users) {
      const records = await all(`SELECT m.home_score, m.away_score, p.home_score AS pick_home_score, p.away_score AS pick_away_score
        FROM matches m LEFT JOIN picks p ON p.match_id = m.id AND p.user_id = ?`, [user.id]);
	
      const SKIPNIETE_MECZE = 8;

      let total = SKIPNIETE_MECZE*(-2);
      let exact = SKIPNIETE_MECZE*(-1);
      let outcome = 0;
      for (const r of records) {
        const points = pickPoints(r, r.pick_home_score === null ? null : { home_score: r.pick_home_score, away_score: r.pick_away_score });
        total += points;
        if (points === 2) exact += 1;
        if (points === 1) outcome += 1;
      }

      // Punkty za typy fazy pucharowej liczone wg rzeczywistych wyników admina.
      const knockoutRecords = await all(`SELECT kr.home_score, kr.away_score, kp.home_score AS pick_home_score, kp.away_score AS pick_away_score
        FROM knockout_results kr
        JOIN knockout_picks kp ON kp.match_no = kr.match_no AND kp.user_id = ?
        WHERE kr.home_score IS NOT NULL AND kr.away_score IS NOT NULL`, [user.id]);
      for (const r of knockoutRecords) {
        const points = pickPoints(r, { home_score: r.pick_home_score, away_score: r.pick_away_score });
        total += points;
        if (points === 2) exact += 1;
        if (points === 1) outcome += 1;
      }

      rows.push({ ...user, total, exact, outcome });
    }
    rows.sort((a, b) => b.total - a.total || b.exact - a.exact || a.name.localeCompare(b.name));
    res.render('ranking', { rows });
  } catch (err) { next(err); }
});


router.post("/profile/update-name", requireAuth, async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) {
      req.session.flash = "Nazwa nie może być pusta.";
      return res.redirect("/ranking");
    }
    await run("UPDATE users SET name = ? WHERE id = ?", [name, req.session.user.id]);
    req.session.user.name = name;
    req.session.flash = "Pomyślnie zaktualizowano nazwę wyświetlaną.";
    res.redirect("/ranking");
  } catch (err) { next(err); }
});


router.get("/user/:userId/picks", requireAuth, async (req, res, next) => {
  try {
    const targetUserId = Number(req.params.userId);
    const targetUser = await get("SELECT id, name FROM users WHERE id = ?", [targetUserId]);
    if (!targetUser) return res.status(404).render("error", { message: "U2ytkownik nie istnieje." });
    const matches = await getMatchesWithPicks(targetUserId);
    const groups = {};
    for (const match of matches) {
      groups[match.group_name] ||= [];
      groups[match.group_name].push(match);
    }
    res.render("dashboard", { groups, pickPoints, viewingUser: targetUser });
  } catch (err) { next(err); }
});

router.get("/user/:userId/bracket", requireAuth, async (req, res, next) => {
  try {
    const targetUserId = Number(req.params.userId);
    const targetUser = await get("SELECT id, name FROM users WHERE id = ?", [targetUserId]);
    if (!targetUser) return res.status(404).render("error", { message: "U2ytkownik nie istnieje." });
    const data = await buildUserKnockout(targetUserId);
    res.render("drabinka", { ...data, viewingUser: targetUser });
  } catch (err) { next(err); }
});

router.get("/user/:userId/groups", requireAuth, async (req, res, next) => {
  try {
    const targetUserId = Number(req.params.userId);
    const targetUser = await get("SELECT id, name FROM users WHERE id = ?", [targetUserId]);
    if (!targetUser) return res.status(404).render("error", { message: "Użytkownik nie istnieje." });
    const predicted = await calculateGroupTables(targetUserId);
    const actual = await calculateActualGroupTables();
    res.render("groups", {
      predictedTables: predicted.tables,
      actualTables: actual.tables,
      viewingUser: targetUser
    });
  } catch (err) { next(err); }
});

router.get("/drabinka", requireAuth, async (req, res, next) => {
  try {
    const data = await buildUserKnockout(req.session.user.id);
    res.render("drabinka", data);
  } catch (err) { next(err); }
});

router.get("/official-matches", requireAuth, async (req, res, next) => {
  try {
    const matches = await all(`SELECT m.*, ht.name AS home_team, ht.flag AS home_flag, at.name AS away_team, at.flag AS away_flag
      FROM matches m
      JOIN teams ht ON ht.id = m.home_team_id
      JOIN teams at ON at.id = m.away_team_id
      ORDER BY m.group_name, m.id`);
    const groups = {};
    for (const match of matches) {
      groups[match.group_name] ||= [];
      groups[match.group_name].push(match);
    }
    res.render("official_matches", { groups });
  } catch (err) { next(err); }
});

router.get("/official-groups", requireAuth, async (req, res, next) => {
  try {
    const { tables } = await calculateActualGroupTables();
    res.render("official_groups", { actualTables: tables });
  } catch (err) { next(err); }
});

router.get("/drabinka-oficjalna", requireAuth, async (req, res, next) => {
  try {
    const data = await buildActualKnockout();
    res.render("drabinka", { ...data, official: true });
  } catch (err) { next(err); }
});

module.exports = router;
