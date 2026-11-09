# Znovupoužitelná kontrola fotografie

## Fáze 1 – implementováno

- Čeština pro 2. třídu má samostatné „Přepis na papír“ s 50 sadami po pěti větách, celkem 250 odlišných vět ze stávajících ověřených bank. Sady mají stabilní ID a výběr respektuje nedávnou historii profilu.
- `PhotoReview` je samostatná komponenta, nikoli součást pravidel češtiny. Dostává neměnné `ReviewAssignment` a po dokončení OCR automaticky předá výsledek hostitelské aktivitě. Fotografie ani rozpoznané věty se neukládají do localStorage.
- `MobilePhotoUpload` se otevře na aktuální adrese aplikace s fragmentem `#photo-upload=<id>&token=<uploadToken>`. Vystačí si se statickým hostingem. Fragment se po načtení odstraní z adresy a drží pouze v paměti; obnovení telefonu vyžaduje nové naskenování QR. Odkaz neobsahuje read token, identitu dítěte, obsah zadání, klíč modelu ani adresu libovolného backendu.
- QR kódy vznikají lokálně přes `qrcode`, ne přes externí generátor. Veřejná konfigurace je `public/photo-review-config.json`. Při disabled se nenahrává žádná fotka, nevolá žádný model a nevzniká zdánlivý výsledek.
- Přepis lze vytisknout nebo uložit jako PDF přes tiskový dialog prohlížeče. Pro psaní je vysoký řádek u každé věty. Tato samostatná aktivita se zatím nevkládá do smíšených testů a nemá Word export.
- Do pokroků jde po automatickém OCR výsledek porovnání se vzorem: skóre 0–5, ročník, datum a ID varianty. Uživateli se ukáže pouze informace, zda je věta správně, nebo její rozdíly; rozpoznaný přepis se nezobrazuje. OCR může text přečíst chybně, proto rozdíl není zárukou chyby dítěte. Obsah rukopisu ani obraz v historii není. Výměna zadání, profilu nebo ročníku upozorní na rozpracovanou kontrolu. Po reloadu se rozpracovaná aktivita neobnovuje; server ji nechá expirovat.

## Použití v další úloze

```tsx
<PhotoReview
  key={assignment.id}
  assignment={assignment}
  onComplete={(result) => {
    // result: assignmentId, texts keyed by item ID, correct, total
    // Host decides how to persist the aggregate score for its profile/session.
  }}
/>
```

Každá nová varianta musí mít nové náhodné assignment ID; během čekání ho neměnit. `items` mají stabilní jedinečná ID a očekávané texty. V1 podporuje kontrolu textového přepisu 1–5 položek, nikoli libovolné matematické výkresy či geometrii. Pro jinou metodu hodnocení přidat explicitní `kind`, validátor a backend handler; nevkládat do klientského zadání volný systémový prompt. Stejný transport/QR/upload/stavy lze využít beze změny.

Frontend nevyžaduje potvrzovací checkbox před založením kontroly ani uploadem. Krátkodobé owner/upload tokeny chrání jednotlivé relace, ne veřejný vznik nových relací. Ochranu nákladů tvoří serverové limity a atomická počítadla. Cizí člověk může vyčerpat limit; toto je přijatý kompromis otevřeného webu pro malou skupinu.

## Zapojení backendu – fáze 2

Autoritativní smlouva je [PHOTO_REVIEW_API.md](PHOTO_REVIEW_API.md). Kompletní zadání pro Copilot je [COPILOT_AZURE_HANDOFF.md](COPILOT_AZURE_HANDOFF.md). Názvy a UK South uživatel potvrdil. Výchozí doporučený model je GPT-6.1 Sol, přesnost bude ověřená na českých dětských rukopisech. Výběr regionu prostředku není příslibem regionálního zpracování u Global Standard.

Po vytvoření backendu od Copilotu potřebujeme pouze skutečný veřejný base URL Function API a výsledky integračních testů. Model endpoint ani klíče se do prohlížeče nedávají. Konfiguraci přepnout z:

```json
{ "enabled": false, "apiBaseUrl": "" }
```

na skutečnou HTTPS adresu, například tvar `{"enabled":true,"apiBaseUrl":"https://SKUTECNY-HOST/api"}`. Ukázkový hostname není endpoint k použití. Zapnutí až po ověření anonymních limitů, mazání, tokenových oprávnění a skutečného uploadu. Při selhání vrátit disabled, obyčejná cvičení fungují dál.

## Ověření a známé hranice

`npm test` zahrnuje 50 sad/250 vět, korelaci digestu a výsledku, vadné výsledky, oddělení oprávnění, bezpečnost konfigurace a chybové HTTP stavy. `npm run build` ověřuje produkční výstup. Backend a reálná přesnost OCR budou ověřeny po vytvoření Azure části; frontendový test s mockem není doklad kvality modelu.

Porovnání vypsává jednotlivě rozdílná slova, včetně diakritiky a velikosti písmen, a chybějící/přebývající či změněnou interpunkci. Mezery se při skórování normalizují. OCR může rukopis přečíst chybně i bez příznaku `uncertain`; výsledek proto není jistota autorství chyby. Úhlednost písma se nehodnotí.
