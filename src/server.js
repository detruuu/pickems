require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const helmet = require('helmet');
const morgan = require('morgan');
const { init } = require('./db');
const { syncConfiguredUsers } = require('./auth_config');

const app = express();
const port = process.env.PORT || 6767;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: path.join(__dirname, '..', 'data') }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }
}));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

app.use('/', require('./routes/auth'));
app.use('/', require('./routes/main'));
app.use('/admin', require('./routes/admin'));

app.use((req, res) => res.status(404).render('error', { message: 'Nie znaleziono strony.' }));

init().then(syncConfiguredUsers).then(() => {
  app.listen(port, () => console.log(`Pickems 2026 listening on http://localhost:${port}`));
}).catch((err) => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});
