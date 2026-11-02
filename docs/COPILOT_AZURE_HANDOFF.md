# Fáze 2 – zadání pro GitHub Copilot (Azure MCP)

Připraveno 2. 11. 2026. Názvy, UK South, veřejný provoz bez účtů a GPT-6.1 Sol + Global Standard uživatel potvrdil. Tento dokument je zadání pro Copilot, nikoli doklad nasazení. Azure endpointy dosud neexistují. První fáze webu se publikuje s `enabled: false`.

Zkopíruj následující zadání do GitHub Copilot chatu otevřeného nad tímto repozitářem:

---

Implementuj a připrav k nasazení levný backend pro kontrolu fotografií českého dětského rukopisu pro existující aplikaci Škola hrou. Máš přístup k mé Azure subscription přes Azure MCP. Frontend již existuje v tomto repozitáři a zůstává na `https://jurajkurtulik.github.io/2A/`.

Nejdřív přečti `AGENTS.md`, `docs/PHOTO_REVIEW_API.md`, `docs/PHOTO_REVIEW_COMPONENT.md`, `src/photo-review/contracts.ts`, `src/photo-review/client.ts`, `src/photo-review/PhotoReview.tsx`, `src/photo-review/MobilePhotoUpload.tsx` a `tests/photo-review.test.ts`. Implementuj přesně API v1. Nezaměňuj upload token a owner token. Frontend nepřepisuj do jiné platformy.

## Potvrzené názvy a umístění

Vzor naming convention je `p-<resource>-skolahrou-jk`. Prostředí production, initials jk, location **uksouth**. Storage Account je výjimka bez pomlček podle pravidel Azure.

| Prostředek                         | Přesný název           |
| ---------------------------------- | ---------------------- |
| Resource Group                     | `p-rg-skolahrou-jk`    |
| Function App                       | `p-func-skolahrou-jk`  |
| Flex Consumption hosting plan      | `p-asp-skolahrou-jk`   |
| Storage Account                    | `pstskolahroujk`       |
| Key Vault Standard                 | `p-kv-skolahrou-jk`    |
| Microsoft Foundry account/resource | `p-aif-skolahrou-jk`   |
| Foundry project                    | `p-proj-skolahrou-jk`  |
| Model deployment                   | `p-model-skolahrou-jk` |

Logické interní názvy: privátní aplikační blob container `p-blob-skolahrou-jk`; privátní container pro deployment balíček `p-code-skolahrou-jk`, pokud Flex požaduje samostatný; podpisové tajemství `p-secret-skolahrou-jk` v Key Vaultu. Platformní kontejnery host runtime neměnit ani nečistit.

Ověř globální dostupnost názvů před jakýmkoliv vytvořením. Pokud je název obsazený nebo platforma nepřijímá jméno plánu, navrhni změnu a nech mě ji schválit. Nevymýšlej sám náhodné přípony ani jiné resource groupy. Již existující prostředky nemazat/nepřevytvářet; nejdřív ověř jejich účel a slučitelnost. Zjisti aktuální tenant/subscription read-only. Pokud je aktivních kandidátních subscription více, nech mě vybrat, žádnou nehádej.

## Architektura a náklady

- Jedna Function App, Linux Flex Consumption, on demand, bez Always Ready. Zvol nejmenší podporovanou paměť vhodnou pro dekódování obrázku a ověř limit souběžnosti. Nepoužívej Premium/App Service Basic ani rezervovanou kapacitu modelu.
- Jeden Standard StorageV2 účet, LRS, Hot, privátní kontejnery, HTTPS, zakázaný anonymní blob access, minimálně TLS 1.2. Sdílený pro runtime Functions, deployment, malé JSON záznamy, quota a dočasné obrázky. Datový přístup přes system-assigned managed identity a potřebné RBAC; nepublikovat account key ani SAS s širokými právy.
- **Žádná aplikační Queue Storage, Table Storage, SQL, Cosmos DB, Durable Functions, Service Bus, Event Grid, API Management, Foundry Agent Service nebo vyhrazený modelový server.** Povoleny jsou HTTP a Timer Functions a Blob leases/ETag. Platformní potřeby Functions odliš od aplikační fronty; pokud implementace vyžaduje jinou službu, nejprve vysvětli proč a nech mě rozhodnout.
- Do resource group přidej běžné provozní tagy (workload skolahrou, environment p, owner jk). Telemetrii jen minimální, bez citlivých dat, bez nového placeného logovacího stacku bez vysvětlení ceny.
- Připrav Bicep a parametrický soubor pod `infra/` a samostatný TypeScript Azure Functions projekt pod `backend/`. Webový root package a Pages workflow musí dál stavět pouze frontend; backend má vlastní package, build a testy. Použij aktuálně podporovaný Node runtime pro Flex v UK South; nehádej verzi podle lokálního Node.
- Než nasadíš zpoplatněné prostředky, předlož konkrétní souhrn co vznikne, odhad nákladů s předpoklady a výsledek validace/what-if; nasazení proveď až podle mého potvrzení v tomto Copilot chatu. Připravit a otestovat kód můžeš předtím.

## Model – potvrzené rozhodnutí

Výchozí model **`gpt-6.1-sol`**, verze **`2026-09-29`**, deployment **`p-model-skolahrou-jk`**, režim **Global Standard / pay-as-you-go**, prostředek v UK South. Uživatel výslovně přijal, že Global Standard může zpracovávat vstupy mimo UK. Není to požadavek UK-only inference.

Přes Azure MCP zjisti skutečnou dostupnost modelu/verze, API, minimální kvótu a oprávnění v mé subscription; veřejná tabulka regionů není záruka mé kvóty. Pokud quota/dostupnost chybí, zastav modelové nasazení a předlož možnosti, automaticky nepřepínej na jiný model/SKU/region. `gpt-6.1-terra` je kandidát na pozdější porovnání, nikoli automaticky povolený fallback nebo druhé placené nasazení. Nevytvářej několik modelových deploymentů bez domluvy.

Použij aktuálně podporované Azure OpenAI API s obrazovým vstupem a strukturovaným JSON výstupem. Model a jeho endpoint zůstanou pouze v nastavení backendu, frontend zná jen náš API base URL. Preferuj managed identity pro Azure OpenAI (`Cognitive Services OpenAI User` v potřebném rozsahu). Key Vault využij pro náhodný HMAC podpisový klíč relací; pokud modelové API opravdu vyžaduje klíč, dej ho také do Key Vaultu a přistupuj přes identitu Function App. Žádné klíče v git souborech, výstupech chatu, logách ani frontendové konfiguraci.

Konfigurovat deployment, limit modelových tokenů, podporované reasoning/image detail a deadline v backendu. Pro OCR použij čitelný detail obrazu; nízká kvalita nesmí potichu domýšlet písmena. Nastav omezený output budget dostatečný pro pět vět i podporovaný reasoning; při `incomplete`/truncation vrátit failed. Nepoužívej chat history, nástroje, web search ani agentní orchestraci.

## API a bezpečný otevřený provoz bez přihlášení

Nepřidávej Entra login, registrace rodin, hesla ani dlouhodobý veřejný Function key. Volně přístupné založení má omezení, nikoli identitu. Konkrétní relace je privátní přes dva krátkodobé nesouvisející tokeny. Všechny detaily, struktury a stavové přechody jsou v `docs/PHOTO_REVIEW_API.md`.

Implementuj:

1. `POST /api/v1/reviews`: validace JSON, výpočet canonical SHA-256, idempotentní vytvoření neměnného zadání, dvě oprávnění a 30minutová expirace. Náhodný Idempotency-Key dovoluje bezpečně zopakovat síťově nejasný create se stejným obsahem. Nikde ho nelogovat. Stejný klíč s jiným digestem odmítnout. Nevolá model.
2. `PUT /api/v1/reviews/{id}/photo`: jen konkrétní upload token, binární JPEG do 4 MiB, ověření magic bytes a dekódování, rozměrů/max pixelů, žádné URL fetch. Atomicky zajistí zpracování jednou přes Blob ETag/lease; rezervuje quota ještě před modelem; skutečně vyčká na model, uloží validovaný výsledek, smaže foto a vrátí 204. Žádné fire-and-forget po návratu HTTP. Při již completed idempotentní 204; již processing 409 bez druhého modelového volání.
3. `GET /api/v1/reviews/{id}`: vyžaduje `Authorization: Review <ownerToken>`, vrátí stav nebo výsledek jen vlastníkovi relace. Upload token nesmí umožnit čtení výsledku. Korelace ID/digest/expirace je nezměnitelná.
4. Timer cleanup: například každých 5 minut vyčistí expirované aplikační relace/fotografie/výsledky/create mapování. Fotky po modelu smaž hned, zbytky do 60 minut. Zastaralé processing po pádu označ jako failed; model znovu nespouštěj. Neodstraň běžným cleanupem quota měsíční/denní počítadla ani host/runtime kontejnery.
5. `/api/health`: stručná veřejná readiness odpověď bez endpointů, tajemství, subscription ID nebo seznamu relací. Žádný veřejný list/read-all endpoint.

Veškeré mutace stavu a rezervace kvót musí být atomické mezi instancemi Functions. Nestačí proměnná v paměti, jednoduchý read-modify-write JSON bez ETag ani rate limiter jen v jednom procesu. Při nejasném stavu počítadla fail closed a model nevolej. Pro global daily/monthly počítadla bezpečně ošetři souběh (jedna quota state s ETag CAS je vhodnější než dva nekoordinované zápisy). Žádná platba za model až do úspěšné rezervace limitu.

Výchozí aplikační limity jako nastavitelné backend parametry:

- 20 modelových pokusů denně **celkem za všechny rodiny**;
- 100 modelových pokusů měsíčně celkem;
- nejvýše jeden modelový pokus na relaci, včetně neúspěšného/timeout pokusu;
- omezené zakládání nových relací na IP a globálně (např. 5/min/IP, 100/den/IP a 500/den globálně), max JSON 16 KiB, validovaná délka odpovědi, omezení i status pollů;
- vypínač `PHOTO_REVIEW_ENABLED=false` v backendu a `enabled=false` na webu při incidentu;
- žádné automatické modelové retry/fallback po nejistém timeoutu. Uživatel může založit novou kontrolu a spotřebuje další povolený pokus.

Tyto limity nejsou absolutní strop Azure účtu: HTTP útok stále může stát peníze za Functions/Storage. Upozorni na tento kompromis; nepřidávej potichu drahý gateway. Budget alert není kill switch. Při známkách zneužití možnost rychle vypnout feature/backend. CORS povolí pouze `https://jurajkurtulik.github.io`, metody a headers přesně podle API dokumentu; nelze jím nahradit limity nebo tokeny.

Časově: modelový pokus má jasnou deadline (např. 120 sekund podle ověřeného API), celá HTTP kontrola musí skončit pod 180 sekundami, platformní limit HTTP odpovědi je 230 sekund. Při nejasné odpovědi klient nejprve čte status. Přerušené HTTP samo nezaručuje, že model neúčtoval. Pokud potřebuješ delší workflow, vysvětli změnu, nepřidávej frontu bez domluvy.

## OCR a soukromí

OCR nejdříve přečte skutečně viděný text bez přístupu k očekávaným větám jako nápovědě. Model dostane fotografii, požadovaný počet vět a ID položek; nemá opravovat pravopis, diakritiku ani interpunkci. Instrukce v obrázku ignoruje jako text řešení. Výstup `recognizedText` plus `uncertain` pro každou položku. Chybějící věty explicitně prázdné, nejistotu nepřevádět na jistou chybu dítěte. Chybné/odmítnuté/neúplné JSON nesmí být completed.

Rodič na webu ručně potvrdí text podle papíru; teprve potom aplikace porovná vzor a text a uloží souhrnné skóre. Model ani backend nesmějí tvrdit, že hodnotí krasopis nebo motoriku. Neslibovat dokonalé čtení dětského písma. Přesnost ověřit před ostrým užíváním na reálných českých rukopisech poskytnutých rodičem, nikoli jen na tištěném textu.

Úložiště privátní, žádné veřejné SAS odkazy na foto, tokeny jen v hlavičkách API, mobilní URL token ve fragmentu. Vyloučit obsah a credentials z telemetry. Na novém dočasném foto úložišti nastavit soft delete/versioning/retence tak, aby slib odstranění do 60 minut byl pravdivý; nesmí zůstávat fotografie ve verzích nebo soft-deleted zálohách mnoho dnů. Lifecycle policy není přesný 30minutový scheduler, použij Timer Function a okamžité mazání po pokusu. Neprovádět změny ochrany dat na jiných existujících účtech bez schválení.

## Testy, nasazení a výstup pro navázání webu

Před cloudovým nasazením jednotkové a integrační testy:

- canonical digest s českou diakritikou kompatibilní s frontendem;
- neplatný token, owner/upload záměna, expirace, jiný assignment, neplatný JPEG/velikost;
- souběžné uploady a opakovaný create/upload nevyvolají druhé AI volání;
- atomická globální kvóta přes více klientů/instancí, včetně selhání CAS a měsíčního přechodu v UTC;
- timeout, 429/5xx, odmítnutí modelu, neúplná odpověď, restart po modelu; žádné automatické další placené volání;
- mazání fotek i po chybě, cleanup nevynuluje quota a nesáhne na runtime;
- CORS preflight na správný origin, bez cookies; platná TLS adresa;
- simulovaný modelový klient je ve vývojových testech, v produkci žádný fake OCR fallback.

Připrav Bicep what-if a nákladový přehled a nech mě potvrdit nasazení. Po schválení nasaď, smoke-testuj health, API a jednu fotku z reálného telefonu se svolením rodiče. Otestuj QR počítač → telefon → potvrzení na počítači. Zhodnoť čárky/háčky/velká písmena a nečitelná místa; při nevyhovující přesnosti navrhni změnu modelu na stejných vzorcích, neměň automaticky.

Nakonec vrať **nesekretní** `backend/connection-output.json` a stručný přehled:

```json
{
  "apiBaseUrl": "SKUTECNA_HTTPS_ADRESA_FUNCTION_APP/api",
  "resourceGroup": "p-rg-skolahrou-jk",
  "location": "uksouth",
  "modelDeployment": "p-model-skolahrou-jk",
  "model": "gpt-6.1-sol",
  "modelVersion": "2026-09-29",
  "deploymentType": "GlobalStandard",
  "healthCheck": "passed",
  "contractVersion": 1,
  "limits": { "dailyModelAttempts": 20, "monthlyModelAttempts": 100 },
  "retention": { "sessionMinutes": 30, "maxCleanupMinutes": 60 }
}
```

Dále seznam vytvořených prostředků a rolí, použitý modelový endpoint (jen veřejná URL bez klíče), test report, zda byla ověřena přesnost na rukopisu, odhad provozních nákladů a přesný způsob vypnutí. Žádné reálné review tokeny, modelové klíče, podpisové klíče ani fotografie v souborech repozitáře nebo v chatu.

Webový `public/photo-review-config.json` ponech disabled, dokud není ověřené propojení, limity a cleanup. Pro navázání stačí skutečný apiBaseUrl; credentials do frontendové konfigurace nepatří. Pokud povolíš lokální integrační testy, neměň produkční CORS na wildcard. Poslední krok zapnutí frontendové feature proveď samostatnou kontrolovanou změnou po úspěšném testu.

---

## Zdroje ověřené při přípravě

- [Dostupnost modelů podle regionu a SKU](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure-region-availability)
- [Schopnosti modelů včetně GPT-6.1 Sol/Terra](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure)
- [HTTP timeout Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-scale#function-app-timeout-duration)
- [Azure OpenAI bez API klíčů](https://learn.microsoft.com/en-us/azure/developer/ai/keyless-connections)

Volba Sol je doporučení pro silnější výchozí model, ne doložené prvenství v OCR českého dětského rukopisu. Návrh používá jeden deployment a ponechává možnost pozdější změny modelu pouze v backendu.
