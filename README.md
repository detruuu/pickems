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

Aplikacja synchronizuje bazę z tym plikiem przy starcie. Oznacza to, że:

- można zalogować się tylko loginami wpisanymi w `src/config_allowed_users.js`,
- publiczna rejestracja jest wyłączona,
- konta spoza tej listy są usuwane z tabeli użytkowników przy starcie,
- jeśli zmienisz hasło w pliku, po restarcie aplikacji nowe hasło będzie aktywne.

Hasła w tym pliku są tekstowe, więc nie wrzucaj repozytorium publicznie. W bazie danych hasła są zapisywane jako hashe bcrypt.

## Punktacja

- 2 pkt za dokładny wynik,
- 1 pkt za poprawny rezultat meczu: wygrana/remis/przegrana,
- 0 pkt w pozostałych przypadkach.

W rankingu (`/ranking`) odejmowany jest stały baseline za 8 pominiętych meczów (`SKIPNIETE_MECZE`), tak aby pierwsze rozegrane spotkania nie zawyżały wyników wszystkich graczy. Kolumny tabeli to: punkty, dokładne wyniki oraz niedokładne wyniki (trafiony rezultat bez dokładnego wyniku).

## Uruchomienie lokalne

Utwórz plik `.env` w katalogu głównym, np.:

```text
PORT=6767
SESSION_SECRET=zmien-na-mocny-sekret
NODE_ENV=development
```

Następnie:

```bash
npm install
npm run seed
npm start
```

Domyślny port to `6767`, a serwer nasłuchuje na `0.0.0.0`, więc jest dostępny także z innych urządzeń w sieci lokalnej:

```text
http://localhost:6767
http://ADRES-IP-HOSTA:6767
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
4. Utwórz `.env` i ustaw mocny `SESSION_SECRET`, `PORT` oraz `NODE_ENV=production`.
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
        proxy_pass http://127.0.0.1:6767;
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

Podstrona `/bracket` to **wspólna drabinka pucharowa, taka sama dla wszystkich graczy**. Mechanizm:

1. Pary 1/16 finału są **stałe** — zdefiniowane na sztywno w `src/bracket_logic.js` (`R32_PAIRS`, mecze 73–88). Nie wynikają z typów grupowych użytkownika.
2. O awansie w kolejnych rundach decydują **wyłącznie rzeczywiste wyniki wpisywane przez admina** (tabela `knockout_results`), a nie typy użytkowników. Przykład: jeśli admin wpisze 2:1 dla gospodarza, to u każdego gracza dalej awansuje gospodarz — niezależnie od tego, kogo gracz obstawił.
3. Drużyny w danej rundzie pojawiają się dopiero, gdy admin rozstrzygnie poprzednią rundę (drabinka wypełnia się stopniowo).
4. Użytkownik typuje wynik każdego meczu pucharowego (gdy znane są obie drużyny). Typ służy tylko do punktów i nie zmienia tego, kto awansuje.
5. Typy pucharowe są punktowane w rankingu tak samo jak grupowe (2 pkt dokładny wynik, 1 pkt trafiony rezultat), wg rzeczywistych wyników admina.

Strukturę drzewa dalszych rund (1/8 → finał) definiuje stała `KNOCKOUT` w `src/bracket_logic.js`. W fazie pucharowej każdy mecz musi mieć zwycięzcę (admin wpisuje wynik rozstrzygnięty, np. po karnych).

W przypadku remisów w tabeli grup aplikacja stosuje uproszczony tie-breaker: punkty, bilans bramek, bramki zdobyte, nazwa drużyny. Nie ma jeszcze pełnych kryteriów FIFA typu wyniki bezpośrednie i fair play.

## Weryfikacja danych MŚ 2026

W tej wersji seed danych zawiera:

- oficjalne grupy A-L MŚ 2026,
- 72 mecze fazy grupowej,
- flagi emoji przy reprezentacjach,
- godziny rozpoczęcia meczów w czasie polskim (Europe/Warsaw, CEST), zarówno dla fazy grupowej (`scripts/seed.js`), jak i pucharowej (`src/bracket_logic.js`),
- stałe pary 1/16 finału (mecze 73–88) wspólne dla wszystkich graczy,
- sloty fazy pucharowej od 1/16 do finału, w których zwycięzcy przechodzą dalej na podstawie rzeczywistych wyników admina (panel admina → sekcja „Faza pucharowa").

## Zapis pickemów jednym przyciskiem

W tej wersji użytkownik może uzupełnić wiele wyników na stronie i dopiero potem kliknąć przycisk zapisu:

- na stronie głównej: `Zapisz pickemy`,
- w fazie pucharowej: `Zapisz rundę / drabinkę`.

Dane trafiają do bazy SQLite dopiero po kliknięciu przycisku. Dzięki temu przypadkowe zmiany w formularzu nie są zapisywane automatycznie.

Uwaga: ten mechanizm nie zastępuje kopii bezpieczeństwa serwera. Chroni przed przypadkowym zapisem przez użytkownika, ale nie chroni przed awarią maszyny, usunięciem pliku bazy lub błędną aktualizacją aplikacji.
