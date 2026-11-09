# Škola hrou

Interaktivní procvičování pro 1.–9. třídu; aktuální učivo matematiky a češtiny je ve 2. třídě. Veřejný web: https://jurajkurtulik.github.io/skola-hrou/

## Co aplikace umí

- 11 matematických a 9 jazykových okruhů pro 2. třídu.
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

Místní adresa je `http://localhost:5173/`. Produkční výstup je ve složce `dist`. Použitý základ: React 19, TypeScript, Vite a Lucide. Fonty Nunito a DM Sans se načítají z Google Fonts; bez připojení se použijí systémová písma.

## Ročníky a historie

Třídu 1–9 lze zvolit vlevo dole nebo v horní liště na mobilu. Každý profil si pamatuje vlastní výběr. Ročníky bez učiva zobrazují prázdný stav. Moje pokroky obsahují dokončená cvičení i online písemky a lze je filtrovat; každý záznam zachovává ročník a původní výsledek. Přepnutí třídy výsledky nemaže.

Exporty mají hlavičku se jménem a datem jen na první stránce. Čeština má větší text pro označování a řádky pro psaní vět vysoké 54 bodů namísto 27.

## Rozmanitost zadání

| Okruh                     |                                  Zásoba ve 2. třídě |
| ------------------------- | --------------------------------------------------: |
| Slabiky                   |                                            113 slov |
| Protiklady                |                                          104 dvojic |
| Druhy vět                 | 108 oznamovacích + 108 tázacích + 108 rozkazovacích |
| Skládání vět              |               104 vět, každá má dvě uznávaná řešení |
| Velká písmena             |                                             128 vět |
| Di/dy/ti/ty/ni/ny         |          108 míst k doplnění ve 107 různých slovech |
| Dě/tě/ně                  |                                         140 položek |
| Abeceda a nadřazené pojmy |                    171 různých slov ve 12 skupinách |
| Matematické slovní úlohy  |          26 příběhových šablon s generovanými čísly |

Pevné banky vybírají nejdříve dosud nepoužitá zadání a po vyčerpání nejdéle nepoužitá. Profil si pamatuje až 2 000 nedávných otisků. U příběhů se sleduje situace, ne jen čísla. Test ověřuje deset písemek po osmi úlohách bez opakování v každém pevném jazykovém okruhu. Více úloh než velikost zásoby si samozřejmě opakování vyžádá.

Pro nová témata platí minima a metodika v [CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md). Zásoby jsou oddělené v `src/banks/`; změna pořadí kartiček nebo jména neplní kvótu nového obsahu.

## Přepis na papír a kontrola fotkou

V češtině pro 2. třídu je nová samostatná aktivita **Přepis na papír**: 50 sad po pěti větách (250 různých vět), tisk nebo uložení přes PDF tiskový dialog. Sada respektuje nedávnou historii profilu. Nový přepis se zatím nevkládá do smíšených písemek.

První fáze obsahuje opakovaně použitelnou komponentu **PhotoReview**: QR propojení mobilu, přímý výběr fotky, zmenšení a odstranění EXIF, kontrolu vazby výsledku k zadání a ruční potvrzení OCR rodičem. Po potvrzení ukládá jen souhrnné skóre do místních pokroků. Fotky, přepsaný text a tokeny nezapisuje do localStorage. Uživatelé nepotřebují účet.

**Produkční nahrávání je zatím vypnuté** v `public/photo-review-config.json`. Věty lze už přepisovat a tisknout, rodič je zatím kontroluje sám. Žádné obrázky se neodesílají ani se nevytváří falešné AI výsledky.

- [Dokumentace znovupoužitelné komponenty](docs/PHOTO_REVIEW_COMPONENT.md)
- [Přesná smlouva API v1](docs/PHOTO_REVIEW_API.md)
- **[Hotové zadání druhé fáze pro GitHub Copilot a Azure MCP](docs/COPILOT_AZURE_HANDOFF.md)**

Potvrzené prostředky jsou v UK South, model GPT-6.1 Sol v Global Standard, Functions Flex on demand + privátní Blob Storage + Key Vault, bez aplikační fronty. Backend zavede časově omezené owner/upload tokeny, atomické limity placených volání a automatické mazání. Po nasazení potřebujeme skutečný veřejný Function API base URL; modelové klíče ani modelový endpoint nepatří do webu.

## Jak přidávat učivo

Podrobný postup a dohoda pro budoucí rozvoj: [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md).

1. Zadejte ročník, předmět, probírané učivo, početní rozsah a několik vzorových zadání. U češtiny přiložte i očekávaná řešení, pokud mohou být nejednoznačná.
2. Existující typ úlohy: přidejte slova, věty či varianty do `src/content.ts`, případně nový generátor do `src/engine.ts`.
3. Úplně nový typ úlohy: rozšiřte typ `Kind` v `src/content.ts`, ovládání v `src/main.tsx` a kontroly v `tests/engine.test.ts`.
4. Nové téma přidejte do pole `topics` s povinným `grade` a stabilním ID. Menu, výběr do písemek i tematické výsledky ho převezmou automaticky. Doplňte odpovídající papírový pokyn a případný převod zadání v `src/worksheet.ts`, aby se dobře vyplňovalo tužkou.
5. Ověřte věcnou správnost zadání, jedinečnost nabídek, českou abecedu a přijatelná alternativní řešení. Spusťte testy a sestavení a zkontrolujte ovládání v prohlížeči.

U doplňování zůstává diakritika součástí správnosti. Řazení používá české porovnávání včetně písmene ch. Při sestavování vět je u každého zadání uvedena základní a další ověřená varianta slovosledu; nejde o obecný jazykový analyzátor. Série neopakuje stejné zadání a při výběru omezuje nedávno procvičované položky, dokud zásoba dovoluje.

Početní řetězce mají pět čísel od 1 do 10 a nezáporné mezivýsledky. Příklady do 100 se dělí na počítání s jednotkami bez přechodu, s přechodem a počítání se dvěma dvojcifernými čísly. Převody délky kombinují mm, cm a dm ve všech šesti směrech a používají celé hodnoty. Zadání vznikají z početních pravidel. Papírové řetězce a příklady se dvěma dvojcifernými čísly mají místo pro mezivýpočty.

Původní Wordové podklady ve složce `1` zůstávají místními vstupy a nejsou součástí publikovaného webu. Aplikace vynechává diktáty, přepis psacím písmem a volné tvoření vět.

## Publikování

Workflow `.github/workflows/pages.yml` při změně větve `main` nainstaluje závislosti, spustí testy a sestavení a publikuje pouze `dist` na GitHub Pages. V nastavení repozitáře **Settings → Pages → Source** je potřeba zvolit **GitHub Actions**. Vite používá relativní cesty, takže sestavení funguje i v podsložce `/skola-hrou/`.

Exporty běží v prohlížeči přes knihovny `pdf-lib`, `@pdf-lib/fontkit` a `docx`. Náročnější exportní kód se načítá až při otevření papírového náhledu; Wordová knihovna až při stažení DOCX. Výběr a generování jsou v `src/worksheet.ts`, průvodce v `src/WorksheetBuilder.tsx` a samotné exportéry v `src/export.ts`.

Pro kontrolu exportů lze spustit `node --import tsx scripts/verify-exports.ts`. Vytvoří místní ukázky PDF, Wordu a jejich řešení v ignorované složce `preview/exports`. Testy ověřují vlastní počty, hranice rozsahu, migraci profilů, stránkování i oddělení odpovědí. Při změně šablony je potřeba zkontrolovat také skutečné vykreslení dokumentů.

## Další možnosti rozvoje

Nové učivo pro další ročníky a předměty, ukládání oblíbených sestav písemek, export a import místního pokroku, nové typy úloh, namluvené pokyny nebo volitelná synchronizace. Aplikace zatím obsahuje učivo pro druhou třídu.
