# Posouzení: přepis pěti vět, QR nahrání a kontrola rukopisu

Stav: návrh a proveditelnost, ne implementace. Ověřeno podle oficiální dokumentace 1. 11. 2026. Žádná fotografie se současnou aplikací neodesílá a žádný AI endpoint není zapojen.

## Závěr

**Technicky ano; jen v samotném statickém GitHub Pages ne.** Web může zůstat na GitHub Pages. Pro QR propojení mobilu s aktivním cvičením na počítači, předání fotky a bezpečné volání AI potřebujeme malou serverovou službu. Je to rozumně malý samostatný modul, ale není to pouhé přidání tlačítka. Nejméně předvídatelná část je spolehlivost rozpoznávání dětského psacího písma a diakritiky.

GitHub Pages poskytuje statické HTML, CSS a JavaScript; neposkytuje aplikační server pro upload a ochranu API klíče. [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)

## Zamýšlený průchod

1. Počítač zobrazí pět zadaných vět a tlačítko „Nahrát fotku přes mobil“.
2. Malá služba založí úlohu s přesným zadáním a dvěma oddělenými náhodnými oprávněními: mobil smí jednou nahrát, počítač smí přečíst výsledek. Počítač ukáže QR odkaz na mobilní stránku s krátkodobým upload tokenem; neobsahuje API klíč, jméno dítěte ani token pro čtení výsledků.
3. Telefon otevře stránku přes HTTPS a nabídne fotoaparát nebo fotku z galerie. `input type=file accept=image/* capture=environment` může nabídnout zadní fotoaparát, konkrétní chování závisí na telefonu. Mobil i počítač nemusí být ve stejné Wi-Fi.
4. Telefon zmenší fotku, rodič potvrdí čitelnost a upload. Server ověří soubor a omezení velikosti.
5. Server pošle obraz a původní zadání vision modelu. Samostatné OCR není pro první prototyp nutné: model může přečíst obraz i vrátit návrh oprav. [OpenAI: Images and vision](https://developers.openai.com/api/docs/guides/images-vision)
6. Počítač si pravidelně vyzvedává stav úlohy; WebSocket není pro první verzi nutný. Výsledek obsahuje rozpoznaný text, porovnání po větách, vysvětlení a nečitelné úseky. Při nejistotě model nepočítá chybu jako jistou.
7. Rodič potvrdí nebo opraví rozpoznaný text a teprve potom se stanoví výsledek. Neúspěšný upload, zavřený telefon nebo timeout neztratí původní zadání a umožní nový QR odkaz.

## Nejmenší potřebná služba

- API pro založení úlohy, jednorázový upload, zjištění stavu a vyzvednutí výsledku.
- Krátkodobé privátní úložiště pro úlohu/fotku/výsledek, automatické mazání například po 30 minutách; vlastní provozní lhůtu bychom stanovili při implementaci.
- Tajný API klíč pouze na serveru; nikoli v repozitáři, JavaScriptu ani QR. Oficiální OpenAI dokumentace výslovně nedoporučuje vystavovat API klíče v klientském kódu. [API Authentication](https://developers.openai.com/api/reference/overview)
- Omezení počtu požadavků, velikosti souborů a výdajů; ověření rodiče při zakládání úloh. Veřejný nechráněný proxy endpoint by umožnil cizím lidem utrácet za API. CORS sám není ověření uživatele. Tokeny nesmí být v provozních logách; upload token má krátkou platnost a jen omezená práva.
- Žádné veřejné fotografie ani ukládání do GitHubu. Odstranit EXIF, fotit pouze pracovní list bez obličeje/jména, před prvním odesláním rodiči vysvětlit konkrétního příjemce a účel zpracování.

Poskytovatele backendu zatím nevybíráme a nic nezřizujeme. Mohlo by jít o jednu serverless službu s krátkodobým úložištěm. Existující vlastní endpoint lze použít, pokud přijímá obrázky, bezpečně uchovává klíč a podporuje požadované propojení zařízení. Pouhá URL modelu nebo ChatGPT předplatné tyto části nenahradí. Náklady závisejí na modelu, obrázcích, počtu kontrol a hostingu; bez konkrétního endpointu nelze stanovit cenu.

## Spolehlivost a rozsah hodnocení

Rozpoznávání není totéž jako pravopisná kontrola. Fotka může mít stín, rozmazání, malé znaky, šikmý papír nebo nejasnou čárku. Vision modely mají známá omezení čtení malého a otočeného textu a mohou se mýlit. [Omezení vision modelů](https://developers.openai.com/api/docs/guides/images-vision)

První verze by kontrolovala shodu přepisu se zadáním: vynechaná slova, jiná písmena, velká písmena, diakritiku a interpunkci. Nehodnotila by krasopis, motoriku ani úhlednost. Nečitelný znak musí vrátit k potvrzení rodiči, ne automaticky označit jako chybu dítěte. OCR nejprve nezávisle přepíše skutečně viděný text; porovnání nesmí potichu nahradit rukopis známým zadáním. Výsledek musí být navázán na konkrétní ID a nezměněné zadání.

Před zapojením do skóre otestovat po svolení rodiče reprezentativní české dětské rukopisy, různé telefony a světlo; ručně porovnat zejména chyby v čárkách, háčcích a nečitelných místech. Není nyní doložená přesnost, proto neslibujeme bezchybný počet chyb.

## Možné etapy a doporučení

| Varianta                                       | Složitost                                        | Omezení                                      |
| ---------------------------------------------- | ------------------------------------------------ | -------------------------------------------- |
| Pět vět na obrazovce/papíře + kontrola rodičem | Malá, funguje čistě na Pages                     | Bez automatického OCR                        |
| Přepis a fotka na stejném telefonu + AI        | Střední, server pro AI a ověření                 | Odpadá QR párování zařízení                  |
| Počítač + QR + telefon + AI                    | Střední až vyšší, backend a správa krátké relace | Více stavů, expirace, přenos mezi zařízeními |

Doporučení: pokud má aplikace zůstat co nejjednodušší, nyní ponechat přepis s kontrolou rodičem jako případný samostatný další krok. QR/AI dává smysl až jako samostatně schválená etapa: nejdřív ověřit přesnost rukopisu na malém prototypu, potom doplnit pohodlné QR propojení. Tato změna zásob nezavádí ani novou úlohu přepisu, ani upload, backend, účet, API klíč či placenou službu.
