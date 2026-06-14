# Pickems 2026 MVP

Prosta aplikacja webowa do typowania Mistrzostw Świata 2026 od fazy grupowej.

## Funkcje

- zamknięte logowanie tylko dla 3 kont wpisanych w kodzie,
- brak publicznej rejestracji,
- typowanie wyników meczów fazy grupowej,
- automatyczne wyliczanie tabel grup na podstawie typów użytkownika,
- automatyczne podstawianie drużyn do fazy pucharowej,
- typowanie fazy pucharowej z automatycznym awansem zwycięzców do kolejnych rund,
- panel administratora do wpisywania rzeczywistych wyników,
- automatyczne naliczanie punktów za typy,
- tabela rankingu użytkowników,
- SQLite jako baza danych,
- EJS + CSS bez Reacta.

## Konfiguracja 3 użytkowników przed startem

Przed publicznym uruchomieniem uzupełnij plik:

```text
src/config_allowed_users.js
```

W pliku są trzy konta z wartościami `TODO`. Zmień je na docelowe loginy i hasła:

```js
module.exports = [
  {
    login: 'damian',
    password: 'tu-wpisz-mocne-haslo',
    name: 'Damian',
    role: 'admin'
  },
  {
    login: 'user1',
    password: 'tu-wpisz-mocne-haslo',
    name: 'Użytkownik 1',
    role: 'user'
  },
  {
    login: 'user2',
    password: 'tu-wpisz-mocne-haslo',
    name: 'Użytkownik 2',
    role: 'user'
  }
];
```

Aplikacja synchronizuje bazę z tym plikiem przy starcie. Oznacza to, że:

- można zalogować się tylko loginami wpisanymi w `src/config_allowed_users.js`,
- publiczna rejestracja jest wyłączona,
- konta spoza tej listy są usuwane z tabeli użytkowników przy starcie,
- jeśli zmienisz hasło w pliku, po restarcie aplikacji nowe hasło będzie aktywne.

Hasła w tym pliku są tekstowe, więc nie wrzucaj repozytorium publicznie. W bazie danych hasła są zapisywane jako hashe bcrypt.

## Punktacja

- 3 pkt za dokładny wynik,
- 1 pkt za poprawny rezultat meczu: wygrana/remis/przegrana,
- 0 pkt w pozostałych przypadkach.

## Uruchomienie lokalne

```bash
cp .env.example .env
npm install
npm run seed
npm start
```

Aplikacja będzie dostępna pod:

```text
http://localhost:3000
```

## Struktura

```text
src/server.js                 start aplikacji
src/config_allowed_users.js   zamknięta lista 3 kont
src/auth_config.js            synchronizacja i walidacja kont
src/db.js                     baza SQLite i schemat
src/bracket_logic.js          tabele grup i automatyczna drabinka
src/routes/*.js               routing aplikacji
src/views/*.ejs               widoki HTML
src/public/css                style
scripts/seed.js               dane meczów i drużyn
```

## Wdrożenie na Ubuntu / Oracle VM

1. Zainstaluj Node.js 20 LTS, Nginx i Git.
2. Skopiuj projekt na serwer, np. do `/var/www/pickems2026`.
3. Uzupełnij `src/config_allowed_users.js` trzema kontami.
4. Utwórz `.env` na podstawie `.env.example` i ustaw mocny `SESSION_SECRET`.
5. Uruchom:

```bash
npm install --omit=dev
npm run seed
npm start
```

Do produkcji polecane jest PM2:

```bash
sudo npm install -g pm2
pm2 start src/server.js --name pickems2026
pm2 save
pm2 startup
```

Przykładowa konfiguracja Nginx dla połączenia po IP:

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Po zmianie konfiguracji:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Dane MŚ 2026

Seed zawiera grupy A-L oraz mecze fazy grupowej MŚ 2026. Po uruchomieniu `npm run seed` istniejące typy są czyszczone, a tabele `teams` i `matches` są ładowane od nowa.

W aplikacji dodano podstronę `/bracket` z automatyczną drabinką. Mechanizm działa tak:

1. Użytkownik wpisuje typy wszystkich 72 meczów fazy grupowej.
2. Aplikacja wylicza tabele grup: punkty, bilans bramek, bramki zdobyte.
3. Aplikacja wybiera pierwsze i drugie miejsca z grup oraz 8 najlepszych drużyn z trzecich miejsc.
4. Drużyny są podstawiane do oficjalnych slotów 1/16 finału.
5. Po zapisaniu wyniku meczu pucharowego zwycięzca automatycznie pojawia się w kolejnej rundzie.
6. Po półfinałach aplikacja uzupełnia finał oraz mecz o 3. miejsce.

W przypadku remisów w tabeli grup aplikacja stosuje uproszczony tie-breaker: punkty, bilans bramek, bramki zdobyte, nazwa drużyny. Nie ma jeszcze pełnych kryteriów FIFA typu wyniki bezpośrednie i fair play.

## Weryfikacja danych MŚ 2026

W tej wersji seed danych zawiera:

- oficjalne grupy A-L MŚ 2026,
- 72 mecze fazy grupowej,
- flagi emoji przy reprezentacjach,
- oficjalne sloty fazy pucharowej od meczu 73 do finału,
- automatyczne przechodzenie zwycięzców przez 1/16 finału, 1/8 finału, ćwierćfinały, półfinały i finał.

## Zapis pickemów jednym przyciskiem

W tej wersji użytkownik może uzupełnić wiele wyników na stronie i dopiero potem kliknąć przycisk zapisu:

- na stronie głównej: `Zapisz pickemy`,
- w fazie pucharowej: `Zapisz rundę / drabinkę`.

Dane trafiają do bazy SQLite dopiero po kliknięciu przycisku. Dzięki temu przypadkowe zmiany w formularzu nie są zapisywane automatycznie.

Uwaga: ten mechanizm nie zastępuje kopii bezpieczeństwa serwera. Chroni przed przypadkowym zapisem przez użytkownika, ale nie chroni przed awarią maszyny, usunięciem pliku bazy lub błędną aktualizacją aplikacji.
