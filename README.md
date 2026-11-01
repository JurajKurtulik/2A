# Škola hrou

Interaktivní procvičování pro 1.–9. třídu; aktuální učivo matematiky a češtiny je ve 2. třídě. Veřejný web: https://JurajKurtulik.github.io/2A/

## Co aplikace umí

- 6 matematických a 9 jazykových okruhů vycházejících z dodaných přípravných písemek.
- Krátká cvičení po osmi úlohách a krátké i delší cvičné písemky.
- Vlastní sestavení písemky: výběr témat, 1 až 20 příkladů z každého tématu a nejvýše 120 příkladů celkem. Krátká a delší varianta slouží jako upravitelné předvolby.
- Jedna označená varianta pro online vyplňování, PDF, upravitelný Word i přímý tisk. Náhled a oddělené řešení pro rodiče používají stejnou sestavu. Nová zadání vznikají až po stisknutí „Nová varianta“.
- Nové početní příklady generované podle rozsahu učiva; kontrolované zásoby českých slov a vět.
- Doplňování čísel, výběr odpovědi, řazení kartiček klikáním i přetahováním, rozdělování slabik a opravy velkých písmen.
- Běžné cvičení má jedno tlačítko: nejdřív Zkontrolovat s vysvětlením, potom Další úloha (na konci Vyhodnotit). Změna odpovědi znovu vyžaduje kontrolu. Písemka nabízí řešení a vysvětlení až po závěrečném vyhodnocení.
- Vysvětlení řešení, procvičení obtížnějších témat a nové varianty.
- Dva oddělené místní profily Terezka a Nelinka. Přejmenování původních profilů zachovává historii a vybraný profil. Historie zachovává výsledek před nápovědou i po opravě.
- Responzivní rozhraní pro počítač a mobil/tablet, ovládání klávesnicí.

Pokrok se ukládá do `localStorage` pod klíčem `skola-hrou-v1`, pouze v daném prohlížeči. Bez serveru, účtů, sledování a odesílání dětských výsledků. Smazání dat webu odstraní pokrok; zařízení mezi sebou data nesdílejí. Rozpracované cvičení se zatím po obnovení stránky neobnoví.

## Jak připravit písemku

V nabídce **Zkus si písemku** vyberte předmět a **Sestavit vlastní písemku**, případně krátkou či delší předvolbu. Zaškrtněte požadovaná témata a nastavte počty. Volba **Online** vytvoří a spustí test; volba **Na papír** otevře náhled a tlačítka pro PDF, DOCX a tisk. Přepínač **Zobrazit a stáhnout řešení pro rodiče** přepíná náhled i exporty na samostatný klíč řešení. Před tiskem dětského zadání musí být vypnutý.

Ve stejné návštěvě lze sestavenou variantu znovu otevřít pod nabídkou písemek nebo po online vyhodnocení. Stažení a přepínání mezi zadáním a řešením neobměňuje příklady. Vygenerovaná varianta zůstává v paměti otevřené aplikace; při obnovení stránky se neuchová. Pro dlouhodobé zachování ji stáhněte. Papírové exporty nemění skóre dítěte.

PDF obsahuje vložené otevřené písmo Noto Sans s českou diakritikou. Licence je v `public/fonts/LICENSE.txt`. Word používá Arial a upravitelné odstavce s explicitním stránkováním; výsledné rozložení se může mírně lišit podle editoru. Pro předvídatelný tisk je vhodné PDF. Přímý tisk otevírá dialog prohlížeče a tiskne pouze pracovní list, bez menu aplikace.

## Vývoj

Potřebujete Node.js 24 a npm.

```sh
npm ci
npm run dev
npm test
npm run build
```

Místní adresa je `http://localhost:5173/2A/`. Produkční výstup je ve složce `dist`. Použitý základ: React 19, TypeScript, Vite a Lucide. Fonty Nunito a DM Sans se načítají z Google Fonts; bez připojení se použijí systémová písma.

## Ročníky a historie

Třídu 1–9 lze zvolit vlevo dole nebo v horní liště na mobilu. Každý profil si pamatuje vlastní výběr. Ročníky bez učiva zobrazují prázdný stav. Moje pokroky obsahují dokončená cvičení i online písemky a lze je filtrovat; každý záznam zachovává ročník a původní výsledek. Přepnutí třídy výsledky nemaže.

Exporty mají hlavičku se jménem a datem jen na první stránce. Čeština má větší text pro označování a řádky pro psaní vět vysoké 54 bodů namísto 27.

## Jak přidávat učivo

Podrobný postup a dohoda pro budoucí rozvoj: [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md).

1. Zadejte ročník, předmět, probírané učivo, početní rozsah a několik vzorových zadání. U češtiny přiložte i očekávaná řešení, pokud mohou být nejednoznačná.
2. Existující typ úlohy: přidejte slova, věty či varianty do `src/content.ts`, případně nový generátor do `src/engine.ts`.
3. Úplně nový typ úlohy: rozšiřte typ `Kind` v `src/content.ts`, ovládání v `src/main.tsx` a kontroly v `tests/engine.test.ts`.
4. Nové téma přidejte do pole `topics` s povinným `grade` a stabilním ID. Menu, výběr do písemek i tematické výsledky ho převezmou automaticky. Doplňte odpovídající papírový pokyn a případný převod zadání v `src/worksheet.ts`, aby se dobře vyplňovalo tužkou.
5. Ověřte věcnou správnost zadání, jedinečnost nabídek, českou abecedu a přijatelná alternativní řešení. Spusťte testy a sestavení a zkontrolujte ovládání v prohlížeči.

U doplňování zůstává diakritika součástí správnosti. Řazení používá české porovnávání včetně písmene ch. Při sestavování vět je u každého zadání uvedena základní a další ověřená varianta slovosledu; nejde o obecný jazykový analyzátor. Matematika respektuje nezáporné výsledky, rozsah do 20 a celé desítky do 100. Série neopakuje stejné zadání a při výběru omezuje nedávno procvičované položky, dokud zásoba dovoluje.

Původní Wordové podklady ve složce `1` zůstávají místními vstupy a nejsou součástí publikovaného webu. Aplikace vynechává diktáty, přepis psacím písmem a volné tvoření vět.

## Publikování

Workflow `.github/workflows/pages.yml` při změně větve `main` nainstaluje závislosti, spustí testy a sestavení a publikuje pouze `dist` na GitHub Pages. V nastavení repozitáře **Settings → Pages → Source** je potřeba zvolit **GitHub Actions**. Vite používá základní cestu `/2A/`.

Exporty běží v prohlížeči přes knihovny `pdf-lib`, `@pdf-lib/fontkit` a `docx`. Náročnější exportní kód se načítá až při otevření papírového náhledu; Wordová knihovna až při stažení DOCX. Výběr a generování jsou v `src/worksheet.ts`, průvodce v `src/WorksheetBuilder.tsx` a samotné exportéry v `src/export.ts`.

Pro kontrolu exportů lze spustit `node --import tsx scripts/verify-exports.ts`. Vytvoří místní ukázky PDF, Wordu a jejich řešení v ignorované složce `preview/exports`. Testy ověřují vlastní počty, hranice rozsahu, migraci profilů, stránkování i oddělení odpovědí. Při změně šablony je potřeba zkontrolovat také skutečné vykreslení dokumentů.

## Další možnosti rozvoje

Nové učivo pro další ročníky a předměty, ukládání oblíbených sestav písemek, export a import místního pokroku, nové typy úloh, namluvené pokyny nebo volitelná synchronizace. Aplikace zatím obsahuje učivo pro druhou třídu.
