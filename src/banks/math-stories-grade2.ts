// Odlišné situace, ne přejmenování jedné postavy. Čísla doplňuje engine.
export type StoryTemplate = {
  id: string;
  operation: "add" | "subtract";
  forms: [string, string, string];
  text: string;
};
export const storyTemplates: StoryTemplate[] = [
  {
    id: "basket",
    operation: "add",
    forms: ["jablko", "jablka", "jablek"],
    text: "Do košíku jsme dali {a}. Ze stromu jsme přidali ještě {b}. Kolik jablek je teď v košíku?",
  },
  {
    id: "bus",
    operation: "subtract",
    forms: ["osobu", "osoby", "osob"],
    text: "V autobusu jsme napočítali {a}. Na zastávce jsme viděli vystoupit {b}. Kolik osob zůstalo v autobusu?",
  },
  {
    id: "library",
    operation: "subtract",
    forms: ["knihu", "knihy", "knih"],
    text: "Na polici jsme měli {a}. Čtenáři si vypůjčili {b}. Kolik knih zůstalo na polici?",
  },
  {
    id: "beads",
    operation: "add",
    forms: ["korálek", "korálky", "korálků"],
    text: "Na náramek jsme navlékli {a}. Potom jsme navlékli ještě {b}. Kolik korálků je na náramku?",
  },
  {
    id: "eggs",
    operation: "subtract",
    forms: ["vejce", "vejce", "vajec"],
    text: "V krabičce jsme měli {a}. Na pečení jsme použili {b}. Kolik vajec zůstalo v krabičce?",
  },
  {
    id: "feeder",
    operation: "add",
    forms: ["ptáčka", "ptáčky", "ptáčků"],
    text: "U krmítka jsme viděli {a}. Potom jsme viděli přiletět ještě {b}. Kolik ptáčků je u krmítka?",
  },
  {
    id: "parking",
    operation: "subtract",
    forms: ["auto", "auta", "aut"],
    text: "Na parkovišti jsme viděli {a}. Potom jsme viděli odjet {b}. Kolik aut tam zůstalo?",
  },
  {
    id: "savings",
    operation: "add",
    forms: ["korunu", "koruny", "korun"],
    text: "Do pokladničky jsme uložili {a}. Za pomoc na zahradě jsme získali ještě {b}. Kolik korun je nyní v pokladničce?",
  },
  {
    id: "tickets",
    operation: "subtract",
    forms: ["vstupenku", "vstupenky", "vstupenek"],
    text: "Na představení připravili {a}. U pokladny prodali {b}. Kolik vstupenek ještě mohou prodat?",
  },
  {
    id: "garden",
    operation: "add",
    forms: ["sazenici", "sazenice", "sazenic"],
    text: "Ráno jsme zasadili {a}. Odpoledne jsme zasadili ještě {b}. Kolik sazenic jsme zasadili celkem?",
  },
  {
    id: "balloons",
    operation: "subtract",
    forms: ["balonek", "balonky", "balonků"],
    text: "Na oslavu jsme nafoukli {a}. Během oslavy jsme propíchli {b}. Kolik balonků zůstalo celých?",
  },
  {
    id: "chestnuts",
    operation: "add",
    forms: ["kaštan", "kaštany", "kaštanů"],
    text: "Na školním dvoře jsme našli {a}. V parku jsme našli ještě {b}. Kolik kaštanů jsme nasbírali?",
  },
  {
    id: "train",
    operation: "add",
    forms: ["vagon", "vagony", "vagonů"],
    text: "K vláčku jsme připojili {a}. Připojili k němu ještě {b}. Kolik vagonů má nyní vláček?",
  },
  {
    id: "cookies",
    operation: "subtract",
    forms: ["sušenku", "sušenky", "sušenek"],
    text: "Na talíř jsme položili {a}. Děti snědly {b}. Kolik sušenek zůstalo na talíři?",
  },
  {
    id: "team",
    operation: "add",
    forms: ["hráče", "hráče", "hráčů"],
    text: "Na hřišti jsme viděli {a}. Ze šatny jsme viděli přijít ještě {b}. Kolik hráčů je teď na hřišti?",
  },
  {
    id: "post",
    operation: "subtract",
    forms: ["dopis", "dopisy", "dopisů"],
    text: "Pošťák měl v brašně {a}. Už doručil {b}. Kolik dopisů ještě musí doručit?",
  },
  {
    id: "aquarium",
    operation: "add",
    forms: ["rybku", "rybky", "rybek"],
    text: "Do akvária jsme nejdřív dali {a}. Přidali jsme do něj ještě {b}. Kolik rybek v něm nyní plave?",
  },
  {
    id: "candles",
    operation: "subtract",
    forms: ["svíčku", "svíčky", "svíček"],
    text: "Na dortu jsme zapálili {a}. Oslavenec sfoukl {b}. Kolik svíček ještě hoří?",
  },
  {
    id: "album",
    operation: "add",
    forms: ["fotografii", "fotografie", "fotografií"],
    text: "Do alba jsme uložili {a}. Z výletu jsme do něj přidali {b}. Kolik fotografií je v albu?",
  },
  {
    id: "paper",
    operation: "subtract",
    forms: ["list papíru", "listy papíru", "listů papíru"],
    text: "Na tvoření jsme měli {a}. Na lodičky jsme použili {b}. Kolik listů papíru nám zbylo?",
  },
  {
    id: "flowers",
    operation: "add",
    forms: ["květinu", "květiny", "květin"],
    text: "Do jedné vázy jsme dali {a}. Do druhé vázy jsme dali {b}. Kolik květin bylo v obou vázách dohromady?",
  },
  {
    id: "shop",
    operation: "subtract",
    forms: ["rohlík", "rohlíky", "rohlíků"],
    text: "V obchodě měli na prodej {a}. Zákazník koupil {b}. Kolik rohlíků v obchodě zůstalo?",
  },
  {
    id: "tower",
    operation: "add",
    forms: ["kostku", "kostky", "kostek"],
    text: "Na stavbu věže jsme použili {a}. Na střechu jsme použili ještě {b}. Kolik kostek jsme použili celkem?",
  },
  {
    id: "pencils",
    operation: "subtract",
    forms: ["pastelku", "pastelky", "pastelek"],
    text: "Do společné krabice jsme dali {a}. Na kreslení jsme vyndali {b}. Kolik pastelek zůstalo v krabici?",
  },
  {
    id: "pond",
    operation: "add",
    forms: ["kachnu", "kachny", "kachen"],
    text: "Na rybníku jsme viděli {a}. Pak jsme viděli ze břehu připlavat ještě {b}. Kolik kachen teď plave na rybníku?",
  },
  {
    id: "apples",
    operation: "subtract",
    forms: ["hrušku", "hrušky", "hrušek"],
    text: "Na stromě jsme napočítali {a}. Vítr shodil na zem {b}. Kolik hrušek zůstalo na stromě?",
  },
];
export function counted(n: number, forms: StoryTemplate["forms"]) {
  return `${n} ${forms[n === 1 ? 0 : n >= 2 && n <= 4 ? 1 : 2]}`;
}
export function storyText(template: StoryTemplate, a: number, b: number) {
  return template.text
    .replace("{a}", counted(a, template.forms))
    .replace("{b}", counted(b, template.forms));
}
