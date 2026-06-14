// Zamknięta lista kont dopuszczonych do logowania.
// TODO przed uruchomieniem produkcyjnym uzupełnij dokładnie 3 konta.
// Login może być zwykłą nazwą, np. 'damian', 'janek', 'marek'.
// Hasła trzymaj prywatnie i zmień przykładowe wartości poniżej.

module.exports = [
  {
    login: 'TODO_ADMIN_LOGIN',
    password: 'TODO_ADMIN_HASLO_MIN_8_ZNAKOW',
    name: 'Administrator',
    role: 'admin'
  },
  {
    login: 'TODO_USER_1_LOGIN',
    password: 'TODO_USER_1_HASLO_MIN_8_ZNAKOW',
    name: 'Użytkownik 1',
    role: 'user'
  },
  {
    login: 'TODO_USER_2_LOGIN',
    password: 'TODO_USER_2_HASLO_MIN_8_ZNAKOW',
    name: 'Użytkownik 2',
    role: 'user'
  }
];
