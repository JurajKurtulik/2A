# Azure – příprava a ruční nasazení

Stav k **3. 11. 2026: pilotní infrastruktura, model a backend jsou nasazeny** po výslovném schválení uživatele. Model je `Succeeded` na kapacitě 1 a Function App běží. Health endpoint `/api/health` při předchozí kontrole vrátil `200 ready`. Uživatel schválil zapnutí veřejného frontendu; přesnost OCR není ověřena ani garantována. `backend/connection-output.json` je nesekretní handover artifact a může obsahovat pouze provozní metadata, nikdy credentials.

Autoritativní požadavky: [zadání](COPILOT_AZURE_HANDOFF.md), [API v1](PHOTO_REVIEW_API.md), [komponenta](PHOTO_REVIEW_COMPONENT.md). Backend má vlastní implementaci/testy; tento dokument ani infrastruktura je nenahrazují.

## Kontext a ověřené skutečnosti

- Subscription **Microsoft Hybrid Cloud CoE**, `0cbe0134-8723-4358-b1a7-c92972b92974`; tenant `2281a10d-617d-4692-a87c-7d4e5a420f35`. Kontext znovu přečten read-only; při rozdílu zastavit, nevolit jinou subscription.
- Region `uksouth`. Live Flex katalog potvrzuje Linux Node **24**, paměti **512/2048/4096 MB**, `FC1`, nejnižší povolený `maximumInstanceCount=1`. V šabloně 512 MB, jedna instance, HTTP concurrency 4, žádné Always Ready. Čtyři HTTP sloty umožňují číst status během synchronního uploadu. **512 MB je předběžná volba, nikoli změřená dostatečnost** pro souběžný dekodér a OCR. Timer a HTTP se mohou překrývat; souběžnost není globální mutex ani náhrada Blob CAS/lease.
- Předchozí live příprava ověřila dostupnost požadovaných názvů a modelu `gpt-6.1-sol` / `2026-09-29` / `GlobalStandard`, dostupnou kvótu **7000**. Jde o časový snímek, nikoli rezervaci. Poskytnutý modelový katalog obsahoval kapacitu default 10 / maximum 10000000, **ale nikoli doložené minimum/step**. Default není minimum a kvóta není totéž co SKU capacity nebo příslib RPM/TPM.
- Modelová kapacita je povinný parametr bez defaultu. [Produkční parametry](../infra/prod.bicepparam) obsahují **explicitní 0 pouze jako přípravný sentinel**, `deployModel=false`. Nula se neposílá modelovému deploymentu, protože celý modul je podmíněný. Při zapnutí vyžaduje modelový modul alespoň kladné číslo; tato obecná kontrola **není ověření skutečného minima modelu**. Před nasazením modelu doplnit skutečně ověřenou kapacitu, jednotky a krok. Žádné automatické přepnutí modelu, SKU, verze, regionu nebo jmen.

## Soubory a rozsah

- [Subscription entry point](../infra/main.bicep), [produkční parametry](../infra/prod.bicepparam).
- [Orchestrace](../infra/modules/resources.bicep), [storage](../infra/modules/storage.bicep), [Foundry](../infra/modules/foundry.bicep), [podmíněný model](../infra/modules/model.bicep), [Functions](../infra/modules/function.bicep), [role](../infra/modules/roles.bicep).
- [Lokální regresní kontrola](../infra/Test-Infrastructure.ps1): kompiluje do paměti, kontroluje vypínače, model, identity, retenci a role; neinstaluje ani nemění cloud.

Použity pevně verzované Azure Verified Modules: resource-group 0.4.0, storage-account 0.33.1, vault 0.14.2, cognitive-services/account 0.19.1, serverfarm 0.7.0, site 0.24.0. RG modul je záměrně 0.4.0 s live-advertised API 2021-04-01; novější 0.4.3/0.4.4 používají 2025-04-01, které cílová subscription při kontrole neinzerovala. AVM metadata telemetry je explicitně vypnutá; žádné secrets export configuration ani diagnostic sinks. Registry restore je stažení definic modulů, ne instalace nástroje nebo cloudové provisionování. Změnu verze AVM znovu auditovat včetně tranzitivních modulů a what-if.

Projekt a model používají schématem potvrzené `Microsoft.CognitiveServices/accounts/projects@2025-06-01` a `accounts/deployments@2025-06-01` (samostatné AVM pro tyto typy nenalezeny). RBAC používá stabilní `2022-04-01`. Ostatní API jsou připnutá uvnitř AVM, neodvozují se automaticky z nejvyšší verze provideru. Seznam provider resource types nevrací všechny vnořené typy (např. deployments); samotná absence v tomto seznamu není důkaz nepodpory. **Kompilace není live serverová validace API v dané subscription**; tu ověřit před schválením a nepřepisovat API pokusným hádáním.

### Přesný inventář pro schválení

| Prostředek | Název / vlastnosti |
| --- | --- |
| RG | `p-rg-skolahrou-jk`; tagy workload=skolahrou, environment=p, owner=jk |
| Plan | `p-asp-skolahrou-jk`; Linux Flex `FC1`, on demand |
| Function App | `p-func-skolahrou-jk`; system-assigned MI, Node 24, HTTPS/TLS 1.2, FTP/SCM basic publishing vypnuto |
| Storage | `pstskolahroujk`; StorageV2, Standard_LRS, Hot, HTTPS/TLS 1.2, Shared Key a anonymní blob access vypnuty |
| Privátní kontejnery | `p-blob-skolahrou-jk`, `p-code-skolahrou-jk`; `publicAccess=None` |
| Vault | `p-kv-skolahrou-jk`; Standard, RBAC, soft delete 7 dní, purge protection |
| Foundry účet | `p-aif-skolahrou-jk`; AIServices S0, system MI, project management, local API keys vypnuty |
| Foundry projekt | `p-proj-skolahrou-jk`; system MI, bez dodatečných rolí/backing services/agents |
| Model – jen po dalším ověření | `p-model-skolahrou-jk`; přesně Sol/verze výše, GlobalStandard, NoAutoUpgrade, žádný spillover |
| Tajemství – až provozní bootstrap | `p-secret-skolahrou-jk`; **není v Bicepu, parametrech ani výstupech** |

Žádné aplikační fronty, tabulky, Azure Files share, SQL/Cosmos, Durable Functions, Event Grid, Service Bus, APIM, Agent Service, rezervovaný modelový server, App Insights nebo Log Analytics. Účet StorageV2 má služby platformy, ale šablona nepřidává queue/table data, binding ani roli. Při novém požadavku runtime se zastavit a vysvětlit, nikoli automaticky přidat role/služby.

**Síťový kompromis:** privátní blob data nejsou totéž co Private Endpoint. HTTPS endpointy Storage/Vault/Foundry jsou dostupné veřejnou sítí, ale chráněné Entra MI/RBAC; síťový default je Allow. Jde o záměrný levný návrh bez VNet/NAT/private endpoints dle zadání, nikoli síťově izolovanou enterprise konfiguraci. Pokud policy vyžaduje síťovou izolaci, je to blokátor a změna rozpočtu/architektury ke schválení. Neřešit zapnutím klíčů nebo anonymního přístupu.

### Role a bootstrap bez kruhové závislosti

Pouze identita Function App dostane:

| Role | Scope | Důvod |
| --- | --- | --- |
| Storage Blob Data Owner (`b7e6dc6d-f1e8-4753-8033-0f276bb0955b`) | nový storage account | Dokumentovaný host storage/Timer lock; host vytváří vlastní kontejnery. Současně pokrývá app blob operace a Flex deployment package. |
| Key Vault Secrets User (`4633458b-17de-408a-b874-0445c86b69e6`) | nový vault | Čtení podpisového klíče a jeho verzí přes SDK, nikoli zápis/rotace. |
| Cognitive Services OpenAI User (`5e0bd9bd-7b93-4f28-af87-19fc36ad61bd`) | Foundry account | Inferenční volání přes MI. |

Role Blob Data Owner je širší než aplikační kontejner, protože **host/Timer** vyžaduje host kontejnery a blob oprávnění. Přidání contributor rolí na app/code kontejnery by stávající account oprávnění nezúžilo; proto žádné redundantní assignmenty. Žádná management-plane Owner/Contributor role, Queue/Table role ani Storage Account Contributor se aplikaci nepřidává. Foundry account/project identity nemají další role; projekt je pouze organizační prostředek.

Pořadí je storage/vault/account/plan → Function App a její MI → role assignments. Nastavení aplikace nemá závislost na výstupech rolí; role používají až její principal ID. **Nezveřejňovat balíček před dokončením a propagací rolí**. První start prázdné aplikace může mít přechodné chyby storage a není readiness důkaz. Role assignment completion není důkaz propagace data-plane.

Host storage: `AzureWebJobsStorage__accountName`, `AzureWebJobsStorage__credential=managedidentity`, bez connection stringu/client ID uživatelské identity. Flex package storage: `functionAppConfig.deployment.storage.authentication.type=SystemAssignedIdentity` na privátním code containeru. Žádný `WEBSITE_RUN_FROM_PACKAGE`, Azure Files klíč nebo staré Flex runtime settings. Publisher je operátor přihlášený přes Entra a podporovaný Flex/OneDeploy postup; jeho práva jsou oddělená od runtime MI. Pokud nástroj vyžaduje basic publishing/klíče, zastavit a ověřit podporovaný postup, nezapínat je potichu.

## Konfigurace backendu a oba vypínače

[Functions modul](../infra/modules/function.bicep) nastavuje přesná jména očekávaná backendem:

| Nastavení | Hodnota / zdroj |
| --- | --- |
| PHOTO_REVIEW_ENABLED | `false` (při každém IaC redeploy znovu vypnuto) |
| PHOTO_STORAGE_ACCOUNT_URL | ARM-returned Blob endpoint nového účtu |
| PHOTO_STORAGE_CONTAINER | `p-blob-skolahrou-jk` |
| PHOTO_KEY_VAULT_URL | ARM-returned URI vaultu |
| PHOTO_SIGNING_SECRET_NAME | `p-secret-skolahrou-jk` |
| AZURE_OPENAI_ENDPOINT | ARM-returned **account** endpoint, ne projektový endpoint ani vymyšlený hostname |
| AZURE_OPENAI_DEPLOYMENT | `p-model-skolahrou-jk`, i během přípravy bez modelu |
| PHOTO_MODEL_MAX_OUTPUT_TOKENS | `4096` |
| PHOTO_MODEL_TIMEOUT_MS | `120000` |
| PHOTO_REVIEW_DAILY_LIMIT / MONTHLY_LIMIT | `20` / `100`, globálně |
| PHOTO_ALLOWED_ORIGIN | `https://jurajkurtulik.github.io` |

Frontend [veřejná konfigurace](../public/photo-review-config.json) obsahuje schválené `enabled=true` a skutečný Function API base URL; publikace probíhá přes GitHub Pages workflow při pushi do `main`. Backend source/Bicep v GitHubu neznamená automatické Azure redeploy. Každý IaC redeploy může backendový `PHOTO_REVIEW_ENABLED` vypínač nastavit zpět na `false`, proto po infrastrukturních změnách ověřit cíleně. Parametr `deployModel=false` **není odstranění nebo vypnutí již existujícího deploymentu**: incremental deployment podmíněný prostředek vynechá, ale existující model nesmaže.

Platformní CORS omezuje origin a vypíná credentials. Přesné metody GET/POST/PUT/OPTIONS a hlavičky Content-Type/Authorization/X-Upload-Token/Idempotency-Key musí validovat backend; Bicep CORS neumí tyto aplikační kontroly nahradit. Otestovat skutečný platformní preflight (ten může obsloužit platforma před backendem), žádný wildcard, cookies ani cesta aplikace v originu. CORS není autentizace ani ochrana rozpočtu.

App logging je Warning, Function/Host.Results Error, file logging never; HTTP access logging, detailed errors a request tracing vypnuté. Není nakonfigurovaný App Insights connection string ani nový placený diagnostický sink. Cleanup chybu propaguje jako sanitizovanou neúspěšnou invokaci. Backend přesto nesmí logovat text/OCR, JPEG/base64, request/response body, Authorization, upload/owner/create tokeny, SDK request headers či modelový error body. Ověřit i výchozí SDK logy a platformní diagnostiku; Bicep nedokáže odstranit provider-side provozní záznamy. Bez obsahových logů sledovat cleanup/readiness/kvótu přes bezpečné souhrny a platformní metriky.

## Validační a schvalovací brány

1. **Lokálně:** existující Azure CLI/Bicep kompilátor, žádná instalace nebo elevation. Z kořene spustit `pwsh -File infra/Test-Infrastructure.ps1`; samostatně `az bicep build --file infra/main.bicep --stdout` a `az bicep build-params --file infra/prod.bicepparam --stdout`. stdout nepřesměrovávat do rootu. `modelCapacity` zůstává explicitní parametr i v přípravě. Root frontend testy/build nejsou backend testy.
2. **Kontext:** read-only `az account show`, ověřit přesný tenant/subscription výše. Zkontrolovat provider registration, policy/deny assignments, locks a oprávnění deployera k subscription/RG deployments a `Microsoft.Authorization/roleAssignments/write`. Nic automaticky neregistrovat, nepřidělovat operátorovi role ani nevytvářet identity.
3. **Jména těsně před vytvořením:** regionální/parent scope plánu a Foundry projektu/modelu, globální storage/Flex hostname/vault/Foundry custom subdomain. Read-only storage `az storage account check-name --name pstskolahroujk`; vault `az keyvault check-name --name p-kv-skolahrou-jk`; Foundry ARM checkDomainAvailability a Web checknameavailability se správným typem a API dle aktuálního schématu. Tyto metadata check API mohou mít HTTP POST, nejsou to resource create. Prohlédnout i soft-deleted vault/Foundry names a seznam existujících prostředků. Při obsazení/jiném účelu **zastavit**; žádný random suffix, automatické recovery/replacement ani úprava cizí retence. Dostupnost se může změnit i po kontrole.
4. **Flex:** před nasazením bylo ověřeno Node24, 512 MB, max instances=1 a concurrency=4; aktuální Function App je nasazená. Regionální memory quota není důkazem volné fyzické kapacity. Po bootstrapu ověřit skutečné zpracování JPEG v 512 MB/4 HTTP slotech; při prokázaném nedostatku navrhnout 2048 MB s cenovým dopadem, ne automaticky zvětšit.
5. **Model pouze pokud deployModel=true:** znovu načíst regionální modelový katalog, přesný model/version/kind/SKU, available subscription quota a skutečné capacity min/max/step/jednotky/RPM/TPM. Vyžádat potvrzení Azure/portálu/supportu, pokud minimum není vráceno; **default 10 ani kvóta 7000 nesmí suplovat minimum**. Ověřit podporu image input, strict JSON, MI audience, inference API/deadline/output 4096 a nepersistentních požadavků. Žádné placené testovací volání bez souhlasu. Chybějící údaje blokují modelové nasazení; přípravný `deployModel=false` je nepředstírá jako ověřené.
6. **Serverová validace a what-if:** live `validate` uspěl pro skutečně nasazené model-enabled hodnoty (`deployModel=true`, kapacita 1); nested modul diagnostics upozornily na short-circuit/incomplete expansion. What-if není úplný inventář vnořených změn; pro tento pilot uživatel výslovně potvrdil, že tento nedostatek není blokátor. Nasazení succeeded a skutečné prostředky jsou zaznamenány v [implementation status](AZURE_IMPLEMENTATION_STATUS.md). Checkov není nainstalovaný; bez instalace jej nelze vykázat jako passed. Statické lokální kontroly nejsou jeho ekvivalent.
7. Předložit člověku inventář, role, výsledky validate/what-if a odhad nákladů níže. Získat **výslovné schválení placeného nasazení**, včetně modelCapacity při případném zapnutí modelu. Teprve pak ručně subscription deployment create se stejnými schválenými vstupy a umístěním metadat. Žádný automatický deployment script/CI job. Před/po každém pokusu zaznamenat inventář; při selhání nemažte prostředky jen podle názvu/času vzniku.

## Provozní bootstrap tajemství (až po schváleném provisionování)

- Operátor potřebuje **již autorizované** Key Vault data-plane oprávnění pro zápis tajemství (např. schválenou dočasnou Secrets Officer roli), ne runtime aplikace. Šablona toto oprávnění nepřiděluje. ARM Contributor sám nestačí. Pokud chybí, zastavit a neobcházet přepnutím access policy/klíčů.
- V lokálním důvěryhodném procesu bez transcriptu/debug logů použít kryptografický RNG k vytvoření alespoň **32 náhodných bajtů**, bezpečně zakódovat a přes Key Vault SDK `setSecret` uložit přímo do `p-secret-skolahrou-jk`. Žádný plaintext do argumentu shellu, historie, souboru, Bicep parametru/outputu, chatu, logu ani clipboardu. Návrat SDK (obsahuje i value) nevypisovat; zaznamenat nanejvýš neveřejnou provozní evidenci verze bez hodnoty. Nepoužívat stabilní deterministický seed nebo výchozí klíč.
- Backend načte přes system MI + Key Vault SDK nejnovější platný secret při založení relace, uloží v metadatech její **konkrétní versioned secret URI / version**, nikoli samotnou hodnotu. Další ověření/idempotentní create musí používat původní verzi, i po rotaci; samotný versionless Key Vault app-setting reference toto nezajišťuje. Připnout/validovat host vaultu a přesné jméno; klient nesmí vybírat cizí secret URI. Bicep nastavuje jen vault URL a jméno, ne hodnotu nebo versioned reference.
- Starší verzi zachovat čitelnou pro všechny aktivní relace/idempotentní mapy: minimálně 30 minut plus clock skew, cache a cleanup/recovery rezervu (prakticky ověřené okno alespoň 60 minut). Až po vypršení všech závislých relací lze starou verzi deaktivovat. Standardní delete secret maže všechny verze daného jména, není to nástroj na jednotlivé verze. Neprovádět rotaci během testu bez ověření kontinuitních případů.
- Vault soft delete/purge protection chrání **podpisové klíče**, nikoli fotografie; nelze slibovat jejich okamžitý nevratný purge. Cache v paměti má omezené TTL/velikost, žádná serializace hodnot do blobů či logů. Model nepotřebuje API key; MI je výchozí a klíčový fallback není schválen.

Po propagaci rolí ověřit Blob/Key Vault přístup skutečnou runtime MI, potom publikovat samostatný backend balíček podporovaným Flex postupem. Při `deployModel=false` je chybějící model očekávaný; nevracet falešné „production ready“. Porovnat skutečný account endpoint s API očekávaným SDK (případné OpenAI endpointy vrácené providerem), neodvozovat dostupnost ze jména. Enable backend až po úspěšné konfiguraci, bootstrapu, quota/CAS/cleanup testech; frontend zůstává vypnutý pro řízený test.

## Retence a soukromí

Na **novém** storage account jsou vypnuté blob/container soft delete, versioning, automatic snapshots, change feed a point-in-time restore. Žádné immutable policy, backups, object replication ani lifecycle archive. Důsledek: nižší obnovitelnost omylem smazaných dat a balíčku; pokud policy ochrany vynucuje, zastavit a vyřešit rozpor s dočasnými fotkami. Vypnutí versioningu/soft delete na existujícím účtu **nesmaže dřívější verze/snapshots/soft-deleted položky**; ověřit je explicitně. Nové snapshots/backups nevytvářet ani během diagnostiky.

Backend maže foto hned po pokusu i chybě; Timer každých 5 minut čistí expirované app relace/fotky/výsledky/create mapy, běžný cíl do 60 minut. Nepoužívat lifecycle policy jako minutový scheduler. Nikdy nesmazat kvótu/ETag/lease koordinaci ani `p-code-skolahrou-jk`, host runtime kontejnery a platformní klíče běžným app cleanupem. Výsledky/OCR jen po dobu relace; žádná trvalá historie OCR. Kvóta přetrvá do rollover období a nepřechází restartem na nulu.

**Timer outage, zastavená aplikace, neúspěšné RBAC nebo storage výpadek mohou zpozdit úklid**; nelze garantovat 60 minut za všech okolností. Před zapnutím ověřit aspoň jeden skutečný cyklus, alertovat bezpečnou kontrolou stáří a mít ruční purge přes schválenou identitu omezený na aplikační transient prefixes. Pokud rodič vyžaduje absolutní lhůtu i při platformním výpadku, současný návrh ji nesplňuje a feature musí zůstat off do dohody o politice.

Azure/model provider může mít vlastní abuse monitoring/data retention odlišnou od app blob retence. GlobalStandard může zpracovávat mimo UK (schváleno), ale aplikace nesmí slibovat odstranění všech provider kopií do 60 minut. Před ostrým provozem doložit aktuální smluvní podmínky, provider-side retention, případnou způsobilost pro modified abuse monitoring, podporu nepersistentních požadavků (`store=false`, pokud API podporuje), bez threadů, uložené chat history, agentů, files API nebo trvalých OCR artefaktů. Úspěšné smazání blobu toto nedokazuje.

## Náklady – maloobchodní USD, bez garance stropu

Ověřené sazby při přípravě (2. 11. 2026), před daní/kurzem/slevami/granty:

| Meter | USD |
| --- | --- |
| Sol short-context input | 2 / 1 000 000 tokenů |
| Sol short-context output | 10 / 1 000 000 tokenů |
| Flex on-demand compute | 0.000037 / GB-s |
| Flex execution | 0.40 / 1 000 000 executions |
| LRS Hot capacity | 0.0192 / GB-měsíc |
| Blob writes | 0.059 / 10 000 |
| Blob reads (a ověřený other-operation meter) | 0.0047 / 10 000 |
| Key Vault Standard operations | 0.03 / 10 000 |

- **100 pokusů × 120 s × 0.5 GB** = 6000 GB-s = **0.222 USD compute**, plus 0.00004 USD executions samotných OCR uploadů. Tato paměť a délka nejsou změřené; zahrnout i create/status/cleanup/decoder a rozběh. 2048 MB by za stejný čas znamenalo 0.888 USD compute.
- Model při 100 pokusech a průměru 5000 input + 2000 output = **3 USD**; 10000 input + 4000 output = **6 USD**. Nejde o worst-case: image tokeny/reasoning/účtované output tokeny a kontextové pásmo se musí změřit. Output budget 4096 a 100 měsíčních pokusů neomezují neznámou vstupní tokenizaci absolutním cenovým stropem.
- Timer každých 5 minut v 30 dnech = 8640 executions; při **předpokladu** 1 s a 512 MB cca 0.15984 USD compute + 0.003456 USD execution. Není to bezplatný idle příslib; skutečná délka závisí na množství dat.
- Ilustrace 1 GB-měsíc + 10k writes + 10k reads + 10k other = **0.0876 USD**; 1000 KV operations = **0.003 USD**. Výčet nemusí zahrnovat všechny metery, list/lease/ETag opakování, data transfer, platformní host operace, neúspěšné požadavky ani cenu dalších budoucích služeb.
- Hrubý příklad uvedených složek přibližně **3.48–6.48 USD/měsíc**, nikoli nabídka, worst-case ani garance; 5000/2000 a 10000/4000 tokenů jsou předpoklady. Ověřit subscription-specific free grant/credit, platnost meterů a actual bill, neodečítat neověřený grant. Žádný absolutní cost ceiling.

Limity **20/den a 100/měsíc** se rezervují atomicky serverem před modelem; jeden nejistý/timeout pokus se nevrací ani automaticky neopakuje. HTTP/Storage útok stojí peníze i při vypnutém modelu a jediné instanci. Budget alert je jen upozornění, není kill switch; budget resource ani další placená ochrana nebyly přidány bez schválené částky/příjemce.

## Zapnutí, nouzové vypnutí a závěrečný úklid

Před řízeným zapnutím: backend unit/integration a více-klientské Blob CAS/lease testy, Node24/512MB image memory test, model JSON/deadline/retries, token role separation, CORS/no-store, actual MI a key version rotation, denní/měsíční globální kvóta a cleanup po chybě/restartu. Health nevolá model a nevypisuje endpointy/identifikátory/klíče. Schválený reálný český rukopis z telefonu a QR→upload→poll→ruční potvrzení ověřit zvlášť. Jedna fotka není důkaz perfektní přesnosti.

1. Incident: **PHOTO_REVIEW_ENABLED=false** v aplikaci; blokovat nové create/upload/model, ale zachovat bezpečný owner status a Timer úklid. Frontend `enabled=false` samostatně; počítat s cache Pages. IaC redeploy také vrací backend false, ale pro incident je rychlejší cílená změna nastavení bez jiných infrastrukturních změn.
2. Při HTTP zneužití app zastavit; tím se zastaví i **Timer**. Ověřit a ručně bezpečně odstranit zbylá transient app data; nesmazat počítadla, code nebo host kontejnery. Shutdown bez úklidu neplní retenční cíl. Vypnutí samotné feature či `deployModel=false` nesmaže model/účty a nemusí zastavit všechny náklady.
3. Trvalé zrušení: inventář a vlastnictví ověřit, zachovat pouze povolenou neobsahovou provozní evidenci, získat samostatný souhlas k mazání. Smazat pouze potvrzené prostředky této aplikace. Kvóty nemažte během aktivního provozu, aby se neotevřelo dalších 100 pokusů.
4. Vault purge protection/soft delete a Foundry/provider soft-delete mohou držet názvy/metadata po odstranění; účetní data a provider-side retention mají jiný režim. Ověřit aktivní i deleted prostředky, role assignments, deployment packages a policy/backup zbytky. Nic nepurgeovat/nerestorovat automaticky kvůli kolizi jména. Host data nemaže aplikační cleanup; až výslovně schválený teardown dedikovaného účtu.
5. Až po skutečném nasazení a smoke testech zaznamenat skutečný HTTPS API endpoint a pravdivé výsledky. Žádný předem vyplněný `healthCheck=passed`; frontend zapnout až po dalším samostatném souhlasu.

## Oficiální podklady

- [Functions IaC a Flex deployment storage](https://learn.microsoft.com/en-us/azure/azure-functions/functions-infrastructure-as-code)
- [Timer identity a Storage Blob Data Owner](https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-timer#connections)
- [Identity-based host storage](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference#connecting-to-host-storage-with-an-identity)
- [Foundry account/project model](https://learn.microsoft.com/en-us/azure/foundry/how-to/upgrade-azure-openai)
- [Project Bicep schema](https://learn.microsoft.com/en-us/azure/templates/microsoft.cognitiveservices/2025-06-01/accounts/projects)
- [Deployment Bicep schema](https://learn.microsoft.com/en-us/azure/templates/microsoft.cognitiveservices/2025-06-01/accounts/deployments)
- [Azure OpenAI data privacy](https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/openai/data-privacy)
