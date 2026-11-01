export const syllables =
  "ko|čič|ka ma|li|na mo|týl be|ruš|ka ja|ho|da le|ta|dlo slu|níč|ko pa|nen|ka ško|la ze|le|ni|na čo|ko|lá|da po|me|ranč la|vi|ce ro|di|na za|hra|da ky|tič|ka ba|bič|ka o|kur|ka ko|lo ho|di|ny po|hád|ka če|pi|ce ma|min|ka ta|bu|le".split(
    " ",
  );
export const opposites =
  "velký:malý dlouhý:krátký rychlý:pomalý světlý:tmavý teplý:studený nahoře:dole den:noc suchý:mokrý veselý:smutný mladý:starý vysoký:nízký tichý:hlasitý čistý:špinavý blízko:daleko plný:prázdný lehký:těžký široký:úzký nový:starý sladký:hořký tvrdý:měkký otevřený:zavřený začátek:konec vpředu:vzadu dovnitř:ven"
    .split(" ")
    .map((x) => x.split(":"));
export const categories: [string, string[]][] = [
  ["ovoce", ["jablko", "hruška", "švestka", "banán", "meruňka", "třešeň"]],
  ["zelenina", ["mrkev", "okurka", "paprika", "rajče", "cibule", "kedluben"]],
  ["oblečení", ["tričko", "kalhoty", "bunda", "sukně", "svetr", "šaty"]],
  [
    "dopravní prostředky",
    ["autobus", "vlak", "tramvaj", "auto", "letadlo", "loď"],
  ],
  ["domácí zvířata", ["pes", "kočka", "kráva", "ovce", "koza", "slepice"]],
  [
    "květiny",
    ["růže", "tulipán", "kopretina", "narcis", "fialka", "pampeliška"],
  ],
  ["dny v týdnu", ["pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"]],
  ["nádobí", ["hrnek", "talíř", "miska", "sklenice", "hrnec", "pánev"]],
  [
    "školní potřeby",
    ["tužka", "sešit", "pravítko", "pero", "guma", "pastelka"],
  ],
  ["nábytek", ["stůl", "židle", "postel", "skříň", "křeslo", "police"]],
  ["stromy", ["dub", "buk", "smrk", "borovice", "bříza", "lípa"]],
  ["ptáci", ["vrabec", "kos", "čáp", "sýkora", "holub", "vlaštovka"]],
];
export const sentenceGroups: [string, string[]][] = [
  [
    "Oznamovací",
    [
      "Zítra pojedeme na výlet.",
      "Na zahradě roste jabloň.",
      "Dnes svítí slunce.",
      "Venku padá sníh.",
      "Petr maluje obrázek.",
      "Babička peče koláč.",
      "Na stole leží sešit.",
      "Děti si hrají na hřišti.",
    ],
  ],
  [
    "Tázací",
    [
      "Kde máš svůj penál?",
      "Kdo otevřel dveře?",
      "Kam jdeš po škole?",
      "Kde leží pravítko?",
      "Co máš v batohu?",
      "Kdy začíná vyučování?",
      "Proč se směješ?",
      "Kde bydlí tvoje teta?",
    ],
  ],
  [
    "Rozkazovací",
    [
      "Umyj si ruce!",
      "Polož knihu na stůl!",
      "Uklid si hračky!",
      "Zavři dveře!",
      "Vyčisti si zuby!",
      "Přines mi sešit!",
      "Nechoď do kaluže!",
      "Otevři prosím okno!",
    ],
  ],
];
export const dityni =
  "di:divadlo ni:nikdo di:hodiny ny:prázdniny ty:boty ti:ticho ty:tygr dy:když dy:dudy dy:sudy ti:tisk ni:nit ni:nic ty:tyčka ti:tikot di:divoký di:divák ti:tiskárna ni:niva ny:ženy ny:ceny ny:vlny ty:ploty dy:sady"
    .split(" ")
    .map((x) => x.split(":"));
export const detene =
  "dě:děti tě:dítě dě:děda ně:něco tě:těžký tě:tělo ně:sněženka ně:sněhulák dě:děj dě:neděle tě:štěně ně:koně tě:kotě ně:vůně ně:dlaně dě:lodě ně:básně tě:štěstí dě:děkuji dě:dělník tě:těsto tě:tělocvik ně:někdo ně:někam"
    .split(" ")
    .map((x) => x.split(":"));
export const wordSentences = [
  "Eva čte knihu.",
  "Maminka peče buchty.",
  "Petr má nové kolo.",
  "Klára si hraje doma.",
  "Pes běží po zahradě.",
  "Srnka běží po louce.",
  "Děti staví vysokou věž.",
  "Babička vaří dobrou polévku.",
  "Kočka spí na polštáři.",
  "Tomáš kreslí krásný obrázek.",
  "Ema nese nový batoh.",
  "Tatínek opravuje staré kolo.",
  "Malá žába skáče do vody.",
  "Naše kočka pije mléko.",
  "Velký pes hlídá dům.",
  "Jana zalévá barevné květiny.",
  "Malý ptáček hledá potravu.",
  "Červené jablko leží na stole.",
  "Na zahradě kvete růže.",
  "Na obloze svítí slunce.",
  "Pod stromem roste houba.",
  "Za domem teče potok.",
  "Ve škole zvoní zvonek.",
  "Na louce létá motýl.",
];
export const capitalSentences = [
  "V Praze bydlí Adam.",
  "V pondělí přijede teta Jana.",
  "Pes Azor běhá po zahradě.",
  "Ve středu jede Eliška do Brna.",
  "Náš pes se jmenuje Rex.",
  "Kamarád Tomáš potkal Aničku.",
  "V pátek jede Ondra do Plzně.",
  "Moje sestra se jmenuje Tereza.",
  "Pes Alík spí vedle Petra.",
  "Eva bydlí v Olomouci.",
  "Jana pojede do Liberce.",
  "Dědeček Josef čte knihu.",
  "Kočka Micka pije mléko.",
  "Babička Marie peče koláč.",
  "V Brně čeká Karel.",
  "Na výlet jede Klára.",
  "Můj bratr se jmenuje Jakub.",
  "V Ostravě bydlí Lucie.",
  "Malý Filip krmí Azora.",
  "Naše kočka Líza spí.",
  "Pavel navštíví Zlín.",
  "V Táboře čeká Anna.",
  "Sestra Monika má kolo.",
  "Dnes přijede strýc Martin.",
];
export const alternateSentences = [
  "Knihu čte Eva.",
  "Buchty peče maminka.",
  "Nové kolo má Petr.",
  "Doma si hraje Klára.",
  "Po zahradě běží pes.",
  "Po louce běží srnka.",
  "Vysokou věž staví děti.",
  "Dobrou polévku vaří babička.",
  "Na polštáři spí kočka.",
  "Krásný obrázek kreslí Tomáš.",
  "Nový batoh nese Ema.",
  "Staré kolo opravuje tatínek.",
  "Do vody skáče malá žába.",
  "Mléko pije naše kočka.",
  "Dům hlídá velký pes.",
  "Barevné květiny zalévá Jana.",
  "Potravu hledá malý ptáček.",
  "Na stole leží červené jablko.",
  "Růže kvete na zahradě.",
  "Slunce svítí na obloze.",
  "Houba roste pod stromem.",
  "Potok teče za domem.",
  "Zvonek zvoní ve škole.",
  "Motýl létá na louce.",
];

// Ručně připravené rozšíření. Změna pořadí ani alternativní řešení nejsou nová položka.
syllables.push(
  ...`
jab|lko hruš|ka švest|ka ba|nán me|ruň|ka tře|šeň bro|skev ry|bíz bo|rův|ka o|stru|ži|na
bram|bo|ra ci|bu|le pap|ri|ka raj|če mr|kev řed|kev dý|ně ka|pus|ta sa|lát ce|ler
ka|ma|rád u|či|tel ses|tra ta|tí|nek dě|de|ček te|tič|ka strý|ček mi|min|ko dě|ti
ko|ru|na ko|šík taš|ka ka|be|la ba|tů|žek pe|nál se|šit tuž|ka pra|vít|ko pas|tel|ka
po|stýl|ka pe|ři|na pol|štář de|ka po|koj ku|chy|ně kou|pel|na zár|clo|na ko|be|rec žid|le
po|lév|ka ka|še ro|hlík hou|ska más|lo mlé|ko sý|ry sa|lám ko|láč buch|ta
ry|bič|ka žá|ba ve|ver|ka liš|ka je|ze|vec la|sič|ka ži|ra|fa ze|bra pa|pou|šek tuč|ňák
po|to|ček ře|ka je|ze|ro ryb|ník ka|mí|nek hla|di|na pa|se|ka lu|či|na o|blo|ha du|ha
ko|pre|ti|na pam|pe|liš|ka tu|li|pán nar|cis fi|al|ka rů|že sně|žen|ka sed|mi|krás|ka le|van|du|le ji|řin|ka
`
    .trim()
    .split(/\s+/),
);
opposites.push(
  ...`
bohatý:chudý zdravý:nemocný hladový:sytý statečný:zbabělý pilný:líný laskavý:krutý hodný:zlý poslušný:neposlušný trpělivý:netrpělivý opatrný:neopatrný
bezpečný:nebezpečný správný:nesprávný pravdivý:nepravdivý známý:neznámý stejný:odlišný rovný:křivý hladký:drsný hustý:řídký hluboký:mělký pevný:vratký
ostrý:tupý voňavý:páchnoucí chutný:nechutný slaný:neslaný zralý:nezralý živý:mrtvý bdělý:ospalý klidný:neklidný pozorný:nepozorný pečlivý:nedbalý
pořádný:nepořádný uklizený:neuklizený oblečený:svlečený obutý:bosý zamčený:odemčený zapnutý:vypnutý rozsvícený:zhasnutý spojený:rozdělený celý:rozbitý kulatý:hranatý
vpravo:vlevo ráno:večer včera:zítra před:za nad:pod uvnitř:venku sem:tam tamhle:tady ano:ne vždy:nikdy
často:zřídka všechno:nic všichni:nikdo mnoho:málo více:méně první:poslední výhra:prohra radost:smutek láska:nenávist pořádek:nepořádek
světlo:tma teplo:chlad hluk:ticho pravda:lež zdraví:nemoc odvaha:strach mír:válka přítel:nepřítel příchod:odchod nákup:prodej
stoupat:klesat přidat:ubrat přijít:odejít otevřít:zavřít zapnout:vypnout rozsvítit:zhasnout usnout:probudit_se smát_se:plakat vyhrát:prohrát najít:ztratit
`
    .trim()
    .split(/\s+/)
    .map((x) => x.replaceAll("_", " ").split(":")),
);
// Každé doplňované slovo je samostatná položka, nikoli pouze jiné pořadí nabídek.
dityni.push(
  ...`
 di:divoká di:divočák di:divadélko di:divačka di:divadelní di:kladivo   di:radit di:viditelný di:vidina di:chodit di:vodit di:schodiště
      dy:vždy dy:nikdy dy:tudy dy:kudy dy:tehdy dy:schody dy:jahody dy:zahrady  dy:hrady dy:proudy dy:medvědy dy:vody dy:plody
ti:tisíc ti:tisíce ti:tisknout ti:tiskopis ti:tiskový ti:tichošlápek ti:tichý ti:tichá ti:potichu ti:tiše    ti:cítit ti:chytit ti:platit ti:vrátit ti:ztratit ti:pustit ti:chytitelný
   ty:tykev ty:tykadlo ty:tyč ty:tyče ty:šaty ty:květy ty:sešity ty:mosty ty:listy ty:prsty   ty:karty ty:pláty
ni:nikam ni:nikde  ni:nitka ni:nitě ni:nikoli ni:nizoučký  ni:nižší ni:kniha ni:knihovna ni:knihy        
ny:zvony ny:slony ny:balony ny:citrony ny:melouny ny:komíny ny:hodiny ny:pramíny ny:koruny ny:maliny ny:noviny ny:peřiny ny:rodiny ny:skupiny ny:květiny ny:hladiny ny:pěny ny:rány ny:strany ny:změny
`
    .trim()
    .split(/\s+/)
    .map((x) => x.split(":")),
);
detene.push(
  ...`
dě:dědeček dě:dědečkův dě:dětský dě:dětská dě:dětské dě:děťátko dě:děvče dě:děvčátko dě:děkuje dě:poděkování dě:děkovat dě:dělit dě:dělení dě:oddělit dě:rozdělit dě:rozdělení dě:dělat dě:udělat dě:dělá dě:vydělat dě:dělnice dě:dědina dě:dědic dě:dědictví dě:naděje dě:pondělí dě:pondělní dě:sedět dě:seděl dě:vidět dě:viděl dě:vědět dě:věděl dě:pozdě dě:později dě:pradědeček dě:obědě dě:řadě dě:vodě
tě:těleso tě:tělesný tě:tělocvična tě:tělocvičný tě:těsný tě:těsně tě:těší tě:těšit tě:potěšit tě:těšení tě:těžká tě:těžké tě:těžce tě:těhotná tě:těstoviny tě:štětec tě:štěkat tě:štěká tě:štěňátko tě:štěrbina tě:štěrk tě:koště tě:ještě tě:letiště tě:hřiště tě:schodiště tě:bludiště tě:ohniště tě:stanoviště tě:květě tě:cestě tě:botě tě:chatě tě:plotě tě:světě tě:tetě  tě:městě tě:letět tě:letěl
ně:něha ně:něžný ně:něžná ně:několik ně:někdy ně:nějaký ně:nějaká ně:některý ně:některá ně:něčí ně:někam ně:někudy ně:někde ně:hodně ně:úplně ně:hlavně ně:správně ně:špatně ně:pěkně ně:krásně ně:jemně ně:pevně ně:rovně ně:klidně ně:pilně  ně:jasně ně:černě ně:hnědě ně:zeleně ně:červeně ně:silně ně:společně ně:denně ně:týdně ně:měsíčně ně:ročně ně:sněží ně:sněhuláček ně:jehně
`
    .trim()
    .split(/\s+/)
    .map((x) => x.split(":")),
);
// Ponechat jedinou položku pro každé skutečné zadání.
for (const bank of [syllables, opposites, dityni, detene]) {
  const seen = new Set<string>();
  for (let i = 0; i < bank.length;) {
    const value = bank[i];
    const key = Array.isArray(value) ? value[0] + ":" + value[1] : value;
    if (seen.has(key)) bank.splice(i, 1);
    else {
      seen.add(key);
      i++;
    }
  }
}

const declarations = `
Ráno zpívá kos.|Na plotě sedí vrabec.|Dědeček zalévá záhon.|Maminka vaří polévku.|Tatínek opravuje židli.|Eva čte pohádku.|Jana kreslí sluníčko.|Tomáš staví věž.|Klára skládá puzzle.|Ondra krmí králíka.
Na louce kvete jetel.|U lesa teče potok.|Za domem stojí lípa.|Na nebi letí letadlo.|V rybníku plave kapr.|U břehu kváká žába.|Na poli roste obilí.|V zahradě dozrávají jahody.|Pod keřem spí ježek.|Z komína stoupá kouř.
Pes hlídá zahradu.|Kočka loví myš.|Slepice zobou zrní.|Kráva žere seno.|Ovce odpočívá ve stínu.|Kůň běží po louce.|Koza stojí u plotu.|Kachny plavou na vodě.|Veverka louská oříšek.|Sova létá v noci.
Dnes máme tělocvik.|Ve třídě visí mapa.|Na tabuli je příklad.|V penálu mám tužky.|Na lavici leží kniha.|Zvonění ukončilo přestávku.|Paní učitelka rozdává sešity.|Spolužáci si pomáhají.|Školník zamyká školu.|V jídelně voní oběd.
Na stole stojí váza.|Ve váze jsou tulipány.|Na okně visí záclona.|Pod stolem leží míč.|V pokoji svítí lampa.|U dveří stojí botník.|Na polici jsou kostky.|V kuchyni tikají hodiny.|V koupelně teče voda.|Na posteli leží deka.
Na jaře kvetou stromy.|V létě chodíme plavat.|Na podzim padá listí.|V zimě stavíme sněhuláky.|Po dešti vyšla duha.|Vítr rozhoupal větve.|Slunce zahřívá kameny.|Ranní tráva je mokrá.|Na okně se leskne kapka.|Nad horami jsou mraky.
Pekař peče rohlíky.|Lékař ošetřuje pacienta.|Hasič drží hadici.|Zahradník sází strom.|Řidič zastavil autobus.|Prodavačka váží jablka.|Kuchař míchá omáčku.|Pošťák nese dopis.|Kadeřnice stříhá vlasy.|Malíř natírá plot.
Vlak přijel na nádraží.|Tramvaj zastavila u parku.|Autobus jede do města.|Cyklista má přilbu.|Chodec čeká u přechodu.|Loď pluje po řece.|Balon letí nad polem.|Letadlo přistálo na letišti.|Auto stojí v garáži.|Sanitka houká na ulici.
Adam sbírá kaštany.|Eliška pouští draka.|Filip hází míčem.|Tereza peče sušenky.|Nelinka zalévá květiny.|Pavel skládá papír.|Anna hledá rukavici.|Karel staví sněhuláka.|Lucie zpívá písničku.|Jakub si čistí zuby.
Bratr myje nádobí.|Sestra prostírá stůl.|Teta přivezla koláče.|Strýc nese košík.|Babička plete šálu.|Děti sbírají šišky.|Na výletě jsme viděli hrad.|Po obědě čtu knihu.|Večer uklízím hračky.|Zítra navštívíme knihovnu.
`
  .trim()
  .split(/[|\n]+/)
  .map((x) => x.trim())
  .filter(Boolean);
const questions = `
Jak se jmenuješ?|Kolik je ti let?|Kde bydlíš?|Kdy máš narozeniny?|Co rád čteš?|Jakou barvu má tvoje taška?|Kdo sedí vedle tebe?|Kam pojedeme na výlet?|Proč máš mokré boty?|Jak se dnes cítíš?
Kde roste jabloň?|Kdy dozrávají jahody?|Co roste na poli?|Kdo zalévá zahradu?|Jak voní růže?|Kolik máš semínek?|Kde stojí konev?|Proč strom ztrácí listy?|Kam zasadíme tulipán?|Čím naplníme květináč?
Kdo štěká za plotem?|Kde spí kočka?|Co jí králík?|Jak se jmenuje tvůj pes?|Kolik nohou má pavouk?|Který pták houká v noci?|Kam letí vlaštovky?|Proč má kachna mokré peří?|Kde bydlí včely?|Co nese veverka?
Kdy začíná přestávka?|Kde je tvoje učebnice?|Co máme za domácí úkol?|Kdo dnes rozdává sešity?|Jak se počítá tento příklad?|Kolik žáků je ve třídě?|Kam položíme výkresy?|Čím nakreslíš kruh?|Proč zvoní zvonek?|Kterou stránku otevřeme?
Co je dnes k obědu?|Kdo uvařil polévku?|Kde jsou čisté talíře?|Kolik rohlíků koupíme?|Jak chutná ten koláč?|Které ovoce máš rád?|Čím namažeme chléb?|Kam dáme nákup?|Proč je čaj horký?|Kdy upečeme buchty?
Kde mám rukavice?|Kdo zavřel okno?|Co leží pod postelí?|Jak se zapíná tato lampa?|Kolik pokojů má váš dům?|Kam uklidíme kostky?|Čí je tato čepice?|Kdy přijede babička?|Proč teče voda?|Kde visí ručník?
Jaké je dnes počasí?|Kdy vyjde slunce?|Proč prší?|Kde začíná duha?|Co rozhoupalo strom?|Kolik sněhu napadlo?|Kdy roztaje led?|Kam odletěl drak?|Čím se zahřejeme?|Který měsíc je nejkratší?
Kdy odjíždí vlak?|Kde zastavuje autobus?|Kam jede tato tramvaj?|Kdo řídí loď?|Jak se dostaneme do parku?|Kolik stojí jízdenka?|Proč svítí červená?|Kde je přechod pro chodce?|Čím pojedeme k tetě?|Kdy přiletí letadlo?
Kdo postavil tuto věž?|Jak se hraje tato hra?|Kde je schovaný míč?|Kolik kostiček potřebuješ?|Co budeme dnes vyrábět?|Kam půjdeme po obědě?|Čím přilepíme obrázek?|Kterou písničku zazpíváme?|Proč se papír roztrhl?|Kdy začne pohádka?
Kdo napsal tento dopis?|Komu patří tento batoh?|Co vidíš z okna?|Jak daleko je les?|Kde končí tato cesta?|Kolik šišek jsi našel?|Kam teče potok?|Čím nakrmíme ptáčky?|Který strom má žaludy?|Kdy půjdeme domů?
`
  .trim()
  .split(/[|\n]+/)
  .map((x) => x.trim())
  .filter(Boolean);
const commands = `
Podej mi prosím tužku!|Otevři si sešit!|Zavři svou knihu!|Napiš dnešní datum!|Přečti první větu!|Spočítej všechny kostky!|Nakresli velký kruh!|Vybarvi malé slunce!|Podtrhni správné slovo!|Doplň chybějící číslo!
Připrav si pastelky!|Ukliď si lavici!|Zvedni ruku!|Posaď se rovně!|Poslouchej pozorně!|Mluv prosím tiše!|Počkej na kamaráda!|Pomoz své sestře!|Rozděl se o kostky!|Vrať půjčenou knihu!
Umyj si obličej!|Učeš si vlasy!|Obuj si boty!|Obleč si bundu!|Zapni si kabát!|Nasaď si čepici!|Vezmi si rukavice!|Zavaž si tkaničky!|Pověs si šálu!|Připrav si batoh!
Prostři prosím stůl!|Podej mi čistý talíř!|Nalij vodu do sklenice!|Zamíchej polévku!|Opláchni jablko!|Oloupej banán!|Ukliď nádobí!|Otři mokrý stůl!|Zavři lednici!|Odnes prázdný hrnek!
Zalij květiny!|Naplň konev vodou!|Zasaď malé semínko!|Vytrhej plevel!|Posbírej spadaná jablka!|Shrab suché listí!|Přines zahradní lopatku!|Ulož hrábě do kůlny!|Zavři zahradní branku!|Nešlapej na záhon!
Nasyp ptáčkům zrní!|Naplň psovi misku!|Pohlaď opatrně kočku!|Přines králíkovi seno!|Neplaš lesní zvířata!|Pozoruj tiše veverku!|Nech broučka na listu!|Zavři dvířka klece!|Vyměň vodu v misce!|Netahej psa za ocas!
Rozhlédni se před přechodem!|Počkej na zelenou!|Jdi po chodníku!|Drž se zábradlí!|Nasaď si přilbu!|Připoutej se v autě!|Ustup od kraje nástupiště!|Nastup opatrně do autobusu!|Pusť staršího člověka sednout!|Neutíkej do silnice!
Hoď mi míč!|Chyť létající talíř!|Postav vysokou věž!|Slož papírovou lodičku!|Vystřihni tento obrázek!|Přilep křídlo drakovi!|Podej mi lepidlo!|Zkus to ještě jednou!|Přines další kostku!|Ulož hru do krabice!
Otevři dveře kočce!|Zhasni světlo v pokoji!|Rozsviť stolní lampu!|Zavři kohoutek!|Pověs ručník na háček!|Srovnej knihy na polici!|Ustel si postel!|Ukliď deku do skříně!|Otři si boty o rohožku!|Zaklepej na dveře!
Pojď se mnou na procházku!|Podívej se na oblohu!|Najdi na mapě řeku!|Ukaž mi svůj obrázek!|Vyprávěj mi pohádku!|Zazpívej oblíbenou písničku!|Zatleskej do rytmu!|Zavolej prosím babičce!|Pozdrav souseda!|Poděkuj za pomoc!
`
  .trim()
  .split(/[|\n]+/)
  .map((x) => x.trim())
  .filter(Boolean);
for (const [index, extra] of [declarations, questions, commands].entries())
  sentenceGroups[index][1].push(
    ...extra.filter((x) => !sentenceGroups[index][1].includes(x)),
  );

const orderingTriples = `
Eva|zalévá|růži
Petr|staví|dřevěný most
Klára|čistí|zelené jablko
Tomáš|hledá|ztracený klíč
Ema|sbírá|barevné listy
Jana|krmí|malého králíka
Babička|plete|teplou šálu
Tatínek|myje|červené auto
Maminka|zalévá|pokojové květiny
Dědeček|opravuje|starý plot
Eva|nese|proutěný košík
Petr|pouští|papírového draka
Klára|vyrábí|barevný větrník
Tomáš|čte|napínavou pohádku
Ema|lepí|papírové domečky
Jana|maluje|modrou loď
Babička|krájí|čerstvý chléb
Tatínek|připravuje|ovocný salát
Maminka|prostírá|sváteční stůl
Dědeček|sází|mladý stromek
Eva|počítá|dřevěné kostky
Petr|skládá|velké puzzle
Klára|píše|krátký dopis
Tomáš|kreslí|vysoký hrad
Ema|hledá|červenou pastelku
Jana|otvírá|novou knihu
Babička|vaří|sladkou kaši
Tatínek|zametá|zahradní cestu
Maminka|zdobí|narozeninový dort
Dědeček|sbírá|zralé hrušky
Eva|obléká|malou panenku
Petr|uklízí|rozházené hračky
Klára|staví|pískový kopec
Tomáš|krmí|hladové kachny
Ema|pozoruje|barevného motýla
Jana|trhá|zralé jahody
Babička|suší|voňavé bylinky
Tatínek|nese|těžkou tašku
Maminka|žehlí|bílou košili
Dědeček|brousí|zahradní nůžky
Eva|koupe|gumovou kachničku
Petr|opravuje|rozbité autíčko
Klára|plete|barevný náramek
Tomáš|fotí|lesní studánku
Ema|myje|špinavou misku
Jana|sází|malou cibulku
Babička|peče|jablečný závin
Tatínek|věší|vyprané prádlo
Maminka|balí|malý dárek
Dědeček|zalévá|zelený salát
Eva|rovná|školní sešity
Petr|hledá|pruhovanou ponožku
Klára|vystřihuje|papírové vločky
Tomáš|nafukuje|barevný balonek
Ema|zdobí|vánoční stromeček
Jana|čistí|zahradní stolek
Babička|nese|čerstvé rohlíky
Tatínek|montuje|novou polici
Maminka|míchá|hustou omáčku
Dědeček|čte|ranní noviny
Eva|připravuje|svačinu
Petr|drží|dlouhé lano
Klára|sbírá|hladké kamínky
Tomáš|pozoruje|malé mravence
Ema|přikrývá|spící koťátko
Jana|natírá|dřevěnou budku
Babička|louská|vlašské ořechy
Tatínek|řeže|suchou větev
Maminka|češe|dlouhé vlasy
Dědeček|plní|ptačí krmítko
Eva|vyndává|čisté talíře
Petr|přenáší|malou lavičku
Klára|utírá|mokré okno
Tomáš|vymýšlí|veselou pohádku
Ema|skládá|čisté ručníky
Jana|rozbaluje|novou stavebnici
Babička|sešívá|roztrženou kapsu
Tatínek|kontroluje|brzdy kola
Maminka|ukládá|vyprané povlečení
Dědeček|chystá|prázdné květináče
`
  .trim()
  .split("\n")
  .map((line) => line.split("|"));
for (const [subject, verb, object] of orderingTriples) {
  const sentence = `${subject} ${verb} ${object}.`;
  if (wordSentences.includes(sentence)) continue;
  wordSentences.push(sentence);
  const tail = ["Eva", "Petr", "Klára", "Tomáš", "Ema", "Jana"].includes(
    subject,
  )
    ? subject
    : subject.toLocaleLowerCase("cs");
  alternateSentences.push(
    `${object[0].toLocaleUpperCase("cs")}${object.slice(1)} ${verb} ${tail}.`,
  );
}
capitalSentences.push(
  ...wordSentences.filter((x) => !capitalSentences.includes(x)),
);
// Abeceda i nadřazené pojmy čerpají ze společného rozšířeného slovníku.
const categoryExtras: Record<string, string[]> = {
  ovoce: [
    "broskev",
    "pomeranč",
    "mandarinka",
    "citron",
    "ananas",
    "rybíz",
    "angrešt",
    "borůvka",
    "malina",
    "ostružina",
  ],
  zelenina: [
    "brambora",
    "česnek",
    "petržel",
    "celer",
    "salát",
    "květák",
    "brokolice",
    "dýně",
    "cuketa",
    "ředkvička",
  ],
  oblečení: [
    "kabát",
    "čepice",
    "šála",
    "rukavice",
    "ponožky",
    "košile",
    "mikina",
    "kraťasy",
    "pyžamo",
    "vesta",
  ],
  "dopravní prostředky": [
    "trolejbus",
    "metro",
    "motocykl",
    "vrtulník",
    "plachetnice",
    "kánoe",
    "koloběžka",
    "kolo",
  ],
  "domácí zvířata": [
    "prase",
    "kachna",
    "husa",
    "králík",
    "kůň",
    "osel",
    "krocan",
    "morče",
  ],
  květiny: [
    "sedmikráska",
    "sněženka",
    "bledule",
    "jiřina",
    "slunečnice",
    "karafiát",
    "hyacint",
    "levandule",
  ],
  "dny v týdnu": ["neděle"],
  nádobí: [
    "konvice",
    "pekáč",
    "poklička",
    "naběračka",
    "cedník",
    "džbán",
    "cukřenka",
    "mísa",
  ],
  "školní potřeby": [
    "kružítko",
    "fix",
    "štětec",
    "vodovky",
    "tempery",
    "lepidlo",
    "nůžky",
    "penál",
    "učebnice",
    "ořezávátko",
  ],
  nábytek: [
    "komoda",
    "lavice",
    "pohovka",
    "knihovna",
    "botník",
    "stolek",
    "sekretář",
    "taburet",
  ],
  stromy: [
    "javor",
    "jasan",
    "jedle",
    "modřín",
    "vrba",
    "topol",
    "jabloň",
    "hrušeň",
    "ořešák",
    "jírovec",
  ],
  ptáci: [
    "sova",
    "datel",
    "straka",
    "sojka",
    "orel",
    "labuť",

    "vrána",
    "stehlík",
  ],
};
for (const [name, words] of categories)
  words.push(...categoryExtras[name].filter((x) => !words.includes(x)));
