const express = require('express');
const bcrypt = require('bcrypt');
const { get } = require('../db');
const { normalizeLogin, isConfiguredLogin } = require('../auth_config');
const router = express.Router();

router.get('/register', (req, res) => {
  req.session.flash = 'What the sigma';
  res.redirect('/login');
});

router.post('/register', (req, res) => {
  req.session.flash = 'What the sigma';
  res.redirect('/login');
});

router.get('/login', (req, res) => res.render('login'));

router.post('/login', async (req, res, next) => {
  try {
    const login = normalizeLogin(req.body.login || req.body.email);
    const password = req.body.password || '';

    if (!isConfiguredLogin(login)) {
      req.session.flash = 'zle dane bratku';
      return res.redirect('/login');
    }

    const user = await get('SELECT * FROM users WHERE email = ?', [login]);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      req.session.flash = 'zle dane bratku';
      return res.redirect('/login');
    }

    req.session.user = { id: user.id, email: user.email, login: user.email, name: user.name, role: user.role };
    if (req.body.remember === 'yes') {
      req.session.cookie.maxAge = 180 * 24 * 60 * 60 * 1000; // 180 days in milliseconds
    }
    res.redirect('/');
  } catch (err) { next(err); }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
