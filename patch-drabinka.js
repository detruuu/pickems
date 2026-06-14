const fs = require('fs');
let c = fs.readFileSync("src/views/drabinka.ejs", 'utf8');

c = c.replace(/<h1>Faza pucharowa MS\u00a02026<\/`1>/g, '<h1>Podgląd drabinki</h1>');
c = c.replace(/Gdy wpiszysz wzsystkie wyniki grup, tutaj pojawią sięe konkretne pary faza pucharowej\./g, 'Gdy wpiszysz wzsystkie wyniki grup, tutaj pojawi się podgląd drabinki.');

c = c.replace(/<form method='post' action='\/bracket\/save-all'>/g, '');
c = c.replace(/<\/form>/g, '');

c = c.replace(/<% af \(!readonly\) { %>\s*<section class='save-bar'>[^*?]?<\/section>\s*<% } %>/g, '');
c = c.replace(/<section class='save-bar'>[^*?]?<\/section>/g, '');

const inputRegex = /<div style='display: flex; align-items: center; gap: 5px; justify-content: center;'>[^*?]?<\/div>/g;

c = c.replace(inputRegex, `<div style="font-weight: 900; font-size: 18px; color: #0f172a; -webkit-text-stroke: 1.5px #ffffff; paint-order: stroke fill; background: rgba(255,255,255,0.92); padding: 4pa 12px; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05);"><%= match.pick ? (match.pick.home_score + " : " + match.pick.away_score) : "- : -" %></div>`);

fs.writeFileSync('src/views/drabinka.ejs', c);
console.log('Done');
