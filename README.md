# Škola hrou · 2. A

Interaktivní procvičování matematiky a českého jazyka pro druhou třídu. Veřejný web: https://JurajKurtulik.github.io/2A/

## Co aplikace umí

- 6 matematických a 9 jazykových okruhů vycházejících z dodaných přípravných písemek.
- Krátká cvičení po osmi úlohách a krátké i delší cvičné písemky.
- Nové početní příklady generované podle rozsahu učiva; kontrolované zásoby českých slov a vět.
- Doplňování čísel, výběr odpovědi, řazení kartiček klikáním i přetahováním, rozdělování slabik a opravy velkých písmen.
- Vysvětlení řešení, procvičení obtížnějších témat a nové varianty.
- Dva oddělené místní profily. Historie zachovává výsledek před nápovědou i po opravě.
- Responzivní rozhraní pro počítač a mobil/tablet, ovládání klávesnicí.

Pokrok se ukládá do `localStorage` pod klíčem `skola-hrou-v1`, pouze v daném prohlížeči. Bez serveru, účtů, sledování a odesílání dětských výsledků. Smazání dat webu odstraní pokrok; zařízení mezi sebou data nesdílejí. Rozpracované cvičení se zatím po obnovení stránky neobnoví.

## Vývoj

Potřebujete Node.js 24 a npm.

```sh
npm ci
npm run dev
npm test
npm run build
```

Místní adresa je `http://localhost:5173/2A/`. Produkční výstup je ve složce `dist`. Použitý základ: React 19, TypeScript, Vite a Lucide. Fonty Nunito a DM Sans se načítají z Google Fonts; bez připojení se použijí systémová písma.

## Jak přidávat učivo

1. Zadejte ročník, předmět, probírané učivo, početní rozsah a několik vzorových zadání. U češtiny přiložte i očekávaná řešení, pokud mohou být nejednoznačná.
2. Existující typ úlohy: přidejte slova, věty či varianty do `src/content.ts`, případně nový generátor do `src/engine.ts`.
3. Úplně nový typ úlohy: rozšiřte typ `Kind` v `src/content.ts`, ovládání v `src/main.tsx` a kontroly v `tests/engine.test.ts`.
4. Nové téma přidejte do pole `topics`. Menu i tematické výsledky ho převezmou automaticky. Aktuální písemky vybírají témata podle předmětu funkcí `subjectTopics`.
5. Ověřte věcnou správnost zadání, jedinečnost nabídek, českou abecedu a přijatelná alternativní řešení. Spusťte testy a sestavení a zkontrolujte ovládání v prohlížeči.

U doplňování zůstává diakritika součástí správnosti. Řazení používá české porovnávání včetně písmene ch. Při sestavování vět je u každého zadání uvedena základní a další ověřená varianta slovosledu; nejde o obecný jazykový analyzátor. Matematika respektuje nezáporné výsledky, rozsah do 20 a celé desítky do 100. Série neopakuje stejné zadání a při výběru omezuje nedávno procvičované položky, dokud zásoba dovoluje.

Původní Wordové podklady ve složce `1` zůstávají místními vstupy a nejsou součástí publikovaného webu. Aplikace vynechává diktáty, přepis psacím písmem a volné tvoření vět.

## Publikování

Workflow `.github/workflows/pages.yml` při změně větve `main` nainstaluje závislosti, spustí testy a sestavení a publikuje pouze `dist` na GitHub Pages. V nastavení repozitáře **Settings → Pages → Source** je potřeba zvolit **GitHub Actions**. Vite používá základní cestu `/2A/`.

## Další možnosti rozvoje

Další ročníky, výběr období do písemek, export a import místního pokroku, nové typy úloh, namluvené pokyny nebo volitelná synchronizace. První verze zatím obsahuje učivo pro druhou třídu.

