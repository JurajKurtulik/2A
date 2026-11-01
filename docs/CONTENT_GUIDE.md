# Jak společně rozšiřovat Školu hrou

Aplikace má růst s dětmi od 1. do 9. třídy. Nové zadání od rodiče vždy patří do konkrétního ročníku a předmětu. Dosavadní učivo patří pouze do 2. třídy. Ostatní ročníky zůstávají prázdné, dokud nedostaneme podklady. Nevkládat do nich kopie učiva ani smyšlené ukázky.

## Podklady pro další změnu

Rodič může zadat například: „Přidej do 3. třídy, matematika, násobilka 6. Tady jsou vzorové příklady.“ Zaznamenat ročník, předmět, okruh, hranice učiva, vzory a očekávaná řešení. Zachovat společné prostředí, profily, vyhodnocení a sestavování písemek; nevytvářet pro další ročník samostatnou aplikaci.

## Postup implementace

1. V `src/content.ts` přidat téma s jednoznačným stabilním ID, `grade`, `subject`, popisem a ikonou. ID existujících témat neměnit, protože ho používá historie. Stejné téma jiného ročníku má vlastní ID, například `g3-math-times6`.
2. V `src/engine.ts` doplnit generátor nebo kontrolovanou zásobu variant a odpovědí. Nepřekračovat zadaný rozsah; řešení musí být věcně správná. U češtiny uvést ověřené alternativy. Nedávné příklady omezovat podle stávajícího mechanismu.
3. Použít existující typ interakce. Nový typ doplnit do `Kind`, UI, vyhodnocení i papírového převodu. Pro online formu nyní vynecháváme diktáty a ruční přepis; psaní vět je možné v papírovém převodu.
4. Doplnit pokyn a převod v `src/worksheet.ts`. Nastavení `Topic.paper` určuje velikost písma, výšku řádku, prostor pro psaní, mezery a sloupce pro PDF, Word i tisk. U práce s textem ponechat větší písmo a dostatek místa pro dětské psaní. Hlavička se zobrazuje jen na první stránce; pokračování má více využitelného prostoru. Řešení vždy zvlášť.
5. Katalog filtrovat přes `topicsForGrade(grade, subject)`; výběr do písemky validovat včetně ročníku. Počty předvoleb vycházejí z dostupných témat. Nemíchat do testu učivo z jiného ročníku.
6. Spustit `npm test` a `npm run build`, ověřit interakci a dokončení online písemky. Zkontrolovat PDF i Word vizuálně, stránkování, psací prostor a nepřítomnost odpovědí v zadání.
7. Aktualizovat README s obsahem a publikovat přes stávající GitHub Pages workflow.

## Nové předměty

Předměty mají centrální registr `subjects` v `src/content.ts`. Při přidání například fyziky rozšířit registr a navigaci, karty a předvolby v `src/main.tsx`; doplnit generátory, převod na papír a styl předmětu. `Subject` a exportní název vycházejí z registru. Prázdný předmět nenabízet k sestavení písemky. Ročník je nezávislý na předmětu.

## Profily a historie

Každý profil si pamatuje vybraný ročník. Historie dokončených cvičení i online písemek obsahuje ročník, druh aktivity, datum, skóre, výsledky témat a u písemky označení varianty. V UI se filtruje podle aktuálního ročníku a druhu aktivity. Změna ročníku ani profilu nemaže výsledky. Staré záznamy bez ročníku patří do 2. třídy; staré písemky se rozpoznávají podle původního označení. Generování a tisk nejsou dokončená online aktivita a nepřidávají skóre.

Data zůstávají jen v místním prohlížeči (`skola-hrou-v1`). Historie uchovává výsledky, nikoli kompletní zadání pro opětovné otevření. Nezavádět cloudové ukládání dětských dat bez samostatného zadání.

## Minimální rozmanitost obsahu (platí pro všechny budoucí předměty)

- Početní generátory: zachovat logické generování a omezení učiva, neukládat zbytečně hotové číselné příklady.
- Pevná jazyková zásoba: nejméně **100 různých zadání na samostatný okruh**. U třídění druhů vět nejméně **100 oznamovacích + 100 tázacích + 100 rozkazovacích vět**; nerozdělovat společnou stovku mezi druhy. Di/dy/ti/ty/ni/ny a dě/tě/ně jsou dvě banky s nejméně 100 různými slovy v každé; jednotlivé slabiky jsou možnosti odpovědi, ne další oddělené okruhy. Dbát na zastoupení všech možností.
- Příběhové šablony s generovanými čísly: nejméně **25 obsahově odlišných situací** na okruh. Výměna jména, předmětu nebo čísel v jedné větě se nepočítá jako nová situace.
- Budoucí ruční přepis: nejméně **50 různých sad po pěti větách** (250 vět), při přípravě obsahových zásob preferovat 100 variant, pokud to učivo přirozeně dovoluje. Přepis s fotkou a AI zatím není implementován; viz `HANDWRITING_FEASIBILITY.md`.
- U kombinatorických úloh jako abeceda nejméně 100 různých zdrojových slov. U nadřazených pojmů nejméně 100 slov celkem, s přirozenými skupinami; netvořit například 100 dnů týdne. Další samostatné klasifikační úlohy mají vlastní minimum, nikoli společný rozpočet pro celý předmět.
- Pro kvóty nepočítat zamíchané kartičky, pořadí nabídek, alternativní správné řešení, opačné pořadí téže dvojice nebo záměnu pouze jména jako nový obsah. Varianty musí odpovídat věku i zadanému učivu. Obtížné či nejednoznačné slovo opatřit kontextem nebo nahradit.
- Pevné banky jsou v `src/banks/`, katalog témat zůstává v `src/content.ts`. Nový ročník má vlastní soubor a stabilní ID témat. Neměnit význam starých ID.
- Testy `tests/content-banks.test.ts` kontrolují dolní hranice, každý záznam a neopakování při deseti písemkách po osmi úlohách. Při přidání banky rozšířit tento audit.

### Výběr bez zbytečného opakování

U konečných bank se vybírá ze skutečných položek, nikoli opakovaným náhodným losováním s nejistým výsledkem. V jedné sérii nesmí být stejná položka dvakrát. Profil si pamatuje až 2 000 nedávných otisků zadání; dokud existují nepoužité položky, preferují se. Po vyčerpání se vrací nejdéle nepoužitá položka. Slovní úlohy mají otisk podle příběhové šablony, aby se stejný příběh nevracel jen s jinými čísly. Vybraná písemka při stažení nemění zadání.

Nejde o slib nekonečně nového obsahu: při 100 větách a deseti písemkách po 20 větách se opakování nevyhneme. Omezení je na profil a tento prohlížeč, sdílené mezi online cvičením a generováním písemek. Rozmanitost se počítá po tématech, nikoli podle počtu možných permutací.
