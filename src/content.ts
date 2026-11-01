export type Subject = "math" | "czech";
export type Kind = "input" | "choice" | "order" | "syllables" | "case";
export type Question = {
  id: string;
  topic: string;
  prompt: string;
  text?: string;
  kind: Kind;
  answers: string[];
  choices?: string[];
  tokens?: string[];
  explanation: string;
};
export type Topic = {
  id: string;
  subject: Subject;
  title: string;
  description: string;
  icon: string;
};
export const topics: Topic[] = [
  {
    id: "arithmetic",
    subject: "math",
    title: "Počítání do 20",
    description: "Sčítání a odčítání malých čísel.",
    icon: "＋",
  },
  {
    id: "tens",
    subject: "math",
    title: "Celé desítky",
    description: "Po desítkách až do stovky.",
    icon: "10",
  },
  {
    id: "decompose",
    subject: "math",
    title: "Desítky a jednotky",
    description: "Rozlož číslo na dvě části.",
    icon: "▦",
  },
  {
    id: "missing",
    subject: "math",
    title: "Ztracené číslo",
    description: "Najdi číslo, které se schovalo.",
    icon: "?",
  },
  {
    id: "sequence",
    subject: "math",
    title: "Číselné řady",
    description: "Objev pravidlo a pokračuj.",
    icon: "→",
  },
  {
    id: "story",
    subject: "math",
    title: "Slovní úlohy",
    description: "Malé příběhy, velké přemýšlení.",
    icon: "✎",
  },
  {
    id: "alphabet",
    subject: "czech",
    title: "Hrátky s abecedou",
    description: "Seřaď slova od A do Ž.",
    icon: "A",
  },
  {
    id: "syllables",
    subject: "czech",
    title: "Slova a slabiky",
    description: "Rozděl slova malým kliknutím.",
    icon: "••",
  },
  {
    id: "sentences",
    subject: "czech",
    title: "Druhy vět",
    description: "Oznamujeme, ptáme se, přikazujeme.",
    icon: "?!",
  },
  {
    id: "opposites",
    subject: "czech",
    title: "Slovní protiklady",
    description: "Najdi slovo opačného významu.",
    icon: "↔",
  },
  {
    id: "categories",
    subject: "czech",
    title: "Co k sobě patří?",
    description: "Nadřazená a podřazená slova.",
    icon: "⌘",
  },
  {
    id: "wordorder",
    subject: "czech",
    title: "Poskládej větu",
    description: "Ze slov sestav celý příběh.",
    icon: "≡",
  },
  {
    id: "dityni",
    subject: "czech",
    title: "Di, dy, ti, ty, ni, ny",
    description: "Vyber slabiku do slova.",
    icon: "i/y",
  },
  {
    id: "detene",
    subject: "czech",
    title: "Dě, tě, ně",
    description: "Doplň správné háčky.",
    icon: "ě",
  },
  {
    id: "capitals",
    subject: "czech",
    title: "Velká písmena",
    description: "Jména lidí, zvířat a měst.",
    icon: "Aa",
  },
];
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
