# Photo Review API v1

Autoritativní TypeScript typy a validace: `src/photo-review/contracts.ts`. Klient: `src/photo-review/client.ts`. Znovupoužitelná komponenta: `src/photo-review/PhotoReview.tsx`. Stav k 3. 11. 2026: frontend implementován, Azure backend a veřejná konfigurace jsou uživatelem schváleny k zapnutí. Přesnost OCR není v tomto vydání ověřena ani garantována. Přepis může být chybný; rodič má rozpoznaný text ověřit podle papíru, než aplikace ukáže shodu.

## Společná pravidla

- Základ je skutečný HTTPS endpoint Function App zakončený `/api`; cesty níže jsou relativní k němu. Bez redirectů, cookies, přihlášení uživatele a veřejného Function/API klíče. Functions HTTP authLevel `anonymous`; přístup ke konkrétní relaci je omezen schopnostními tokeny.
- JSON UTF-8, `Cache-Control: no-store`. Logy nesmějí obsahovat text vět, obraz, tokeny, hlavičky Authorization/X-Upload-Token/Idempotency-Key ani kompletní těla požadavků/odpovědí. Klient posílá `credentials: omit`, `referrerPolicy: no-referrer`, odmítá HTTP redirect.
- Privátní krátkodobá data v Blob Storage. Relace platí 30 minut. Fotku smazat po dokončení/neúspěchu modelového pokusu; zbytky relací/výsledků/vytvářecích záznamů odstranit nejpozději do 60 minut. Quota počítadla žijí do konce svého období a nesmějí být smazána běžným úklidem relací. Neuchovávají fotky ani text.
- Tokeny: owner a upload jsou oddělené, nejméně 256 náhodných bitů (43 znaků base64url). Nikdy se nesmějí shodovat. ID relace má 16–100 znaků `[A-Za-z0-9_-]`, token 32–256 takových znaků. Vrácená expirace je neměnná ISO UTC a nejvýše hodinu do budoucna; standard je 30 minut.
- Anonymous přístup s limity neznamená identitu rodiny. Cizí návštěvník může vyčerpat povolenou kapacitu. CORS není autentizace. Hard limity modelových volání musí být serverové a atomické; Azure Budget je pouze upozornění. Ani omezení AI volání není absolutní cenový strop pro HTTP provoz a ostatní služby.

## POST /v1/reviews — založení relace

Bez Authorization. Hlavička `Idempotency-Key` je náhodné UUID pokusu; frontend ho při síťovém opakování nemění. Pouze po explicitním novém pokusu po chybě/expiraci vytvoří jiné UUID. Toto UUID se nezveřejňuje v QR ani logách. Stejný klíč a stejný digest vrací tutéž relaci a tokeny; stejný klíč s jiným zadáním odmítnout 409. Založení ještě nevolá model.

Tělo:

```json
{
  "assignment": {
    "schemaVersion": 1,
    "id": "uuid-zadani",
    "kind": "transcription",
    "grade": 2,
    "subject": "czech",
    "items": [
      { "id": "sentence-1", "expectedText": "Eva čte knihu." },
      { "id": "sentence-2", "expectedText": "Kde bydlíš?" }
    ]
  },
  "assignmentDigest": "sha256-hex"
}
```

Backend znovu validuje celé zadání: 1–5 položek, jedinečná a omezeně dlouhá ID, 1–9 ročník, maximálně 300 znaků jedné věty, neprázdný text, pouze podporovaný `kind`, omezená délka subject/id a celého JSON (například 16 KiB). Server nesmí spoléhat na klientské limity. Digest je SHA-256 nad UTF-8 výsledkem `canonicalAssignment`: klíče přesně v pořadí `schemaVersion,id,kind,grade,subject,items`, u items `id,expectedText`; bez mezer mezi JSON tokeny, české znaky bez ASCII escapování. Ověřit shodu s `assignmentDigest`; potom celé zadání uložit jako neměnné. ID/digest nejsou oprávnění.

Odpověď 201 (idempotentní opakování může 200):

```json
{
  "id": "session_1234567890123456",
  "assignmentId": "uuid-zadani",
  "assignmentDigest": "sha256-hex",
  "expiresAt": "2026-11-02T12:30:00.000Z",
  "ownerToken": "base64url-owner",
  "uploadToken": "base64url-upload"
}
```

Tokeny lze deterministicky odvodit HMAC z tajemství v Key Vaultu, ID relace, pevné expirace a různého účelu. V metadatech ověřovat hash tokenu konstantním porovnáním. Idempotentní create záznam musí umožnit vrátit původní tokeny během platnosti. Tajemství pravidelně rotovat s ohledem na nejvýše 30minutové aktivní relace.

## PUT /v1/reviews/{id}/photo — upload a synchronní kontrola

Hlavičky: `Content-Type: image/jpeg`, `X-Upload-Token: <uploadToken>`, `Idempotency-Key: <review-id>`. Žádný ownerToken, žádná uživatelská autentizace. Tělo je binární JPEG, nikoli multipart/base64/URL. Frontend přijímá JPG/PNG/WebP do 15 MiB, překóduje na JPEG s nejdelší stranou 2 200 px a odstraňuje původní metadata. Upload nejvýše 4 MiB.

Backend zkontroluje token, expiraci, magic bytes, rozměry, skutečné dekódování a limity. Soubor s chybnými rozměry či obsahem odmítne. Nesmí stahovat klientem zadané URL. Atomickým Blob ETag/CAS nebo lease přejde `waiting → processing`. Stejnou relaci nesmí spustit souběžně druhý proces; počítat modelový pokus před voláním modelu globálním denním i měsíčním počítadlem. Dokončená relace vrací idempotentně 204, processing 409; mobil 409 neinterpretuje jako dokončení, vyzve k ověření na počítači. Nesmí vzniknout druhý placený pokus stejné relace.

Po zpracování uloží celý validovaný výsledek a přepne `completed`, smaže fotografii a vrátí **204 bez těla**. HTTP požadavek skutečně vyčká na model; nejde o background fire-and-forget. Není zde Queue Storage, Table Storage, Durable Functions ani služba, která skrytě vytváří frontu pro aplikační práci. Při timeoutu/chybě nastaví `failed`, smaže fotku a vrátí bezpečnou chybu. Nepoužívat 202 jako náhradu za skutečné dokončení.

Přerušené spojení nezaručuje, že Azure/model nic neprovedly. Při nejasném stavu číst status; automaticky model znovu nevolat. U zastaralého `processing` (například po restartu workeru) status/úklid nastaví `failed`, nikdy znovu nespouští OCR. Nový placený pokus až novou relací po akci uživatele.

## GET /v1/reviews/{id} — stav a výsledek pro počítač

`Authorization: Review <ownerToken>`. Upload token nestačí. Bez tokenu 401/403, neznámé ID a chybné oprávnění neposkytují obsah. Frontend polluje po 5 sekundách (skrytá karta po 15), po chybě se zastaví a nabízí ruční ověření. Stav se nesmí prodlužovat každým čtením.

```json
{
  "id": "session_1234567890123456",
  "assignmentId": "uuid-zadani",
  "assignmentDigest": "sha256-hex",
  "expiresAt": "2026-11-02T12:30:00.000Z",
  "status": "completed",
  "result": {
    "items": [
      {
        "id": "sentence-1",
        "recognizedText": "Eva čte knihu.",
        "uncertain": false
      },
      { "id": "sentence-2", "recognizedText": "Kde bydlis?", "uncertain": true }
    ]
  }
}
```

Stavy: `waiting`, `processing`, `completed`, `failed`, `expired`. Výsledek jen u completed, přesně všechna původní ID vět bez duplicit. Nečitelné/nejisté úseky mají `uncertain: true`, chybějící věta může mít prázdný přepis. Nikdy nevracet modelový systémový prompt, klíč, uploadToken/ownerToken v status odpovědi. Frontend odmítne jiné ID, digest, expiraci, počet nebo ID vět.

## Model a automatické porovnání

Model musí doslovně přepsat pouze viditelný rukopis, bez opravování pravopisu, gramatiky, diakritiky, velikosti písmen ani interpunkce. Nesmí doplnit očekávané slovo nebo koncové znaménko. Vzorové věty modelu nepředávat; jinak by mohl chybějící/špatně napsaný text „opravit“ podle zadání. Počet vět a stabilní item ID lze předat; chybějící/nejisté označit. Text vyfocený na papíře je nedůvěryhodný vstup, nikoli instrukce pro model. Žádné tools/URL fetching. Strukturovaný JSON výstup ověřit na serveru, při odmítnutí nebo neúplném výstupu `failed`.

Po dokončení OCR frontend automaticky porovná doslovný rozpoznaný text se vzorem a zobrazí pouze stav shody nebo rozdíly v jednotlivých slovech a interpunkčních znacích; celý OCR text se uživateli nezobrazuje. Skóre 0–5 se automaticky uloží do pokroků; samostatná kontrola/oprava rodičem po rozpoznání není podmínkou. Automatický výsledek se může mýlit a není důkazem, že chybu udělalo dítě. Uživatelské rozhraní nevyžaduje potvrzovací checkbox před založením kontroly ani uploadem. Nehodnotíme úhlednost písma ani motoriku. Samostatná aktivita přepisu není součástí smíšených online písemek.

## Chyby a CORS

400 chybný vstup, 401/403 oprávnění, 409 již processing nebo konfliktní opakování, 410 expirace, 413 velikost, 415 typ, 429 limit, 503 závislost. Klient nesmí dostat stack trace ani tělo odpovědi Foundry. Omezit i velikost odpovědi.

CORS pro produkci jen `https://jurajkurtulik.github.io` (origin bez cesty aplikace), metody POST/PUT/GET/OPTIONS a hlavičky Content-Type, Authorization, X-Upload-Token, Idempotency-Key; credentials vypnuté. Localhost jen v lokálním vývoji, ne globální wildcard produkce. CORS není ochrana proti přímému volání API robotem.
