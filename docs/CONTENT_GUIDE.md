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
