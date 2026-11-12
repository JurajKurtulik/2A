export type StoryLevel = 1 | 2;
export type StoryFrame = readonly [art: string, description: string];
type IllustratedStory = readonly [id: string, frames: readonly StoryFrame[]];

// Each row is one storyboard in chronological order. The pictograms are
// composed into local PNG cards by scripts/build-preschool-stories.ts.
export const shortStories: readonly IllustratedStory[] = [
  ["chick", [["🥚", "Celé vajíčko"], ["🐣", "Kuřátko se klube ze skořápky"], ["🐥", "Kuřátko stojí venku"]]],
  ["snowman", [["❄ ⛄", "Na sněhu stojí sněhulák"], ["☀ ⛄ 💧", "Sněhulák na slunci taje"], ["💧 🥕", "Po sněhulákovi zbyla louže a mrkev"]]],
  ["toast", [["🍞", "Čerstvý chléb"], ["🍞 ♨", "Chléb se opéká"], ["🍞 🍓", "Topinka s jahodovou marmeládou"]]],
  ["lemonade", [["🍋", "Celý citron"], ["🍋 💧", "Z citronu vytéká šťáva"], ["🥤 🍋", "Hotová limonáda ve sklenici"]]],
  ["gift", [["🧸", "Plyšový medvídek připravený jako dárek"], ["🧸 🎀", "Medvídek s dárkovou stuhou"], ["🎁", "Dárek zabalený v krabici"]]],
  ["bubbles", [["🫧 🪄", "Bublifuk a první bublinka"], ["🫧 🫧 🫧", "Spousta bublin ve vzduchu"], ["💥", "Bubliny praskly"]]],
  ["pencil", [["✏", "Celá tužka"], ["✏ 📝", "Tužka píše na papír"], ["📝 ✅", "Hotový zápis"]]],
  ["rain", [["☁", "Nad zemí je mrak"], ["🌧", "Z mraku prší"], ["🌈", "Po dešti je vidět duha"]]],
  ["parcel", [["📦", "Balík čeká na odeslání"], ["🚚 📦", "Nákladní auto veze balík"], ["🏠 📦", "Balík dorazil k domu"]]],
  ["tea", [["☕", "Hrnek připravený na čaj"], ["☕ 🍵", "Do hrnku se nalévá čaj"], ["🍵 🍋", "Hotový čaj s citronem"]]],
  ["night", [["🌇", "Slunce zapadá za domy"], ["🌆 🌙", "Nad městem vyšel měsíc"], ["🌃", "Nad městem je noc"]]],
  ["handwash", [["🖐 🟤", "Špinavá ruka"], ["🖐 🧼 🫧", "Ruka s mýdlem a pěnou"], ["🖐 ✨", "Čistá ruka"]]],
  ["book", [["📕", "Zavřená kniha"], ["📖", "Kniha je otevřená"], ["📖 🔖", "Do otevřené knihy přibyla záložka"]]],
  ["mail", [["📝", "Napsaný dopis"], ["✉", "Dopis je v obálce"], ["📮", "Obálka je v poštovní schránce"]]],
  ["campfire", [["🪵", "Připravené dřevo"], ["🪵 🔥", "Dřevo hoří"], ["🪵 💧", "Oheň je uhašený vodou"]]],
  ["camera", [["🐶", "Pejsek se chystá na focení"], ["📸 🐶", "Fotoaparát fotí pejska"], ["🖼 🐶", "Hotová fotka pejska v rámečku"]]],
  ["popcorn", [["🌽", "Kukuřice"], ["🌽 ♨", "Kukuřičná zrnka se zahřívají"], ["🍿", "Hotový popcorn"]]],
  ["dogmeal", [["🐶 🥣", "Pejsek čeká u prázdné misky"], ["🐶 🥣 🍖", "V misce je jídlo"], ["🐶 😋", "Pejsek jídlo snědl"]]],
  ["raincoat", [["🌧 🧒", "Dítě vidí déšť"], ["🌧 🧒 ☂", "Dítě v dešti rozevřelo deštník"], ["🏠 ☂", "Dítě s deštníkem dorazilo domů"]]],
  ["music", [["🎸", "Připravená kytara"], ["🎸 🎶", "Na kytaru se hraje"], ["🎸 👏", "Po písničce lidé tleskají"]]],
];

export const longStories: readonly IllustratedStory[] = [
  ["birthday", [["🥣 🥚", "Miska a vajíčka na těsto"], ["🥣 🥄", "Těsto se míchá"], ["🍰", "Dort je upečený"], ["🎂", "Dort se svíčkami"], ["🎂 🎉", "Oslava s hotovým dortem"]]],
  ["packing", [["🎒", "Prázdný batoh"], ["🎒 📕", "Do batohu se dává kniha"], ["🎒 📕 🍎", "Ke knize přibylo jablko"], ["🎒 📕 🍎 🥤", "Do batohu přibylo i pití"], ["🎒 🏫", "S připraveným batohem do školy"]]],
  ["beachcastle", [["🏖", "Prázdná pláž"], ["🏖 🪣", "Na pláž přibyl kyblík"], ["🏖 🪣 🏰", "Z písku vznikl hrad"], ["🏖 🏰 🚩", "Hrad dostal vlaječku"], ["🌊 🏰", "K hradu se dostala vlna"]]],
  ["camping", [["🎒 🌲", "Turista dorazil do lesa s batohem"], ["🌲 ⛺", "V lese stojí stan"], ["⛺ 🔥", "U stanu hoří večerní oheň"], ["⛺ 🌙", "U stanu je noc"], ["⛺ 🌅", "U stanu vyšlo slunce"]]],
  ["airport", [["🧳", "Zavazadlo je připravené"], ["🧳 🎫", "Cestující má také letenku"], ["🧳 🛫", "Letadlo startuje se zavazadlem"], ["✈ ☁", "Letadlo letí nad mraky"], ["🛬 🧳", "Po přistání cestující vyzvedne zavazadlo"]]],
  ["fishing", [["🪝", "Připravený háček"], ["🪝 🪱", "Na háček přibyla návnada"], ["🪝 🌊", "Háček je ve vodě"], ["🎣 🐟", "Na prut se chytila ryba"], ["🪣 🐟", "Ryba je v kbelíku"]]],
  ["roadwork", [["🛣 🕳", "Na silnici je díra"], ["🛣 🕳 🚧", "Díru obklopily zábrany"], ["🚧 🚜", "Za zábranami pracuje stroj"], ["🛣 🚧", "Silnice je opravená, zábrany ještě stojí"], ["🛣 🚗", "Po opravené silnici zase jede auto"]]],
  ["sweeping", [["🍂 🍂 🍂", "Listí je rozházené po zemi"], ["🍂 🍂 🧹", "Začíná zametání"], ["🧹 🍂 🪣", "Listí se smetá do nádoby"], ["🍂 🪣", "Listí je v nádobě"], ["✨ 🧹", "Zem je zametená"]]],
  ["deliverymeal", [["📱 🍔", "Objednávka hamburgeru"], ["🍔 🧑‍🍳", "Kuchař připravuje hamburger"], ["🍔 🛍", "Jídlo je v tašce k rozvozu"], ["🚲 🛍", "Kurýr veze tašku na kole"], ["🏠 🍔", "Hamburger dorazil domů"]]],
  ["seedtree", [["🌰", "Žalud"], ["🌰 🪴", "Žalud se zasadí do nádoby"], ["🌱", "Vyrostl klíček"], ["🌿", "Malý stromek povyrostl"], ["🌳", "Vyrostl velký strom"]]],
  ["washing", [["🧦 🟤", "Špinavá ponožka"], ["🧦 🧺", "Ponožka je v koši na prádlo"], ["🧦 🧼 🫧", "Ponožka se pere v pěně"], ["🧦 💧", "Vypraná ponožka ještě kape"], ["🧦 ☀ ✨", "Čistá ponožka uschla na slunci"]]],
  ["snowtrack", [["❄", "Napadl čerstvý sníh"], ["❄ 🥾", "Bota vstoupila do sněhu"], ["❄ 👣", "Ve sněhu zůstala stopa"], ["❄ 👣 👣", "Ve sněhu přibyly další stopy"], ["☀ 💧", "Slunce sníh rozpustilo"]]],
  ["lock", [["🚪 🔒", "Dveře jsou zamčené"], ["🚪 🔒 🔑", "Ke dveřím přibyl klíč"], ["🚪 🔓 🔑", "Zámek je odemčený"], ["🚪 🧒", "Dítě prochází dveřmi"], ["🏠 🧒", "Dítě je uvnitř domu"]]],
  ["paint", [["📄", "Prázdný papír"], ["📄 🖌", "Na papíře začíná malování"], ["📄 🖌 🎨", "Přibyly barvy"], ["🖼 🖌", "Obrázek je hotový"], ["🖼 🏠", "Obrázek visí doma"]]],
  ["orangejuice", [["🍊", "Celý pomeranč"], ["🍊 🔪", "Pomeranč se rozkrojil"], ["🍊 💧", "Z půlek se mačká šťáva"], ["🍊 🥛", "Šťáva je ve sklenici"], ["🥛 🧊", "Do sklenice přibyl led"]]],
  ["soup", [["🥕 🥔", "Zelenina na polévku"], ["🥕 🥔 🔪", "Zelenina se krájí"], ["🥕 🥔 🫕", "Zelenina je v hrnci"], ["🫕 ♨", "Polévka se vaří"], ["🥣 🥄", "Polévka je v misce k jídlu"]]],
  ["library", [["📕 🏠", "Doma je přečtená kniha"], ["📕 🎒", "Kniha se dává do batohu"], ["📕 🎒 🚶", "Čtenář jde s knihou ven"], ["📕 📚", "Kniha se vrací mezi ostatní knihy"], ["📚 📗 🎒", "Čtenář odnáší jinou knihu"]]],
  ["rescue", [["🐱 🌳", "Kočka uvízla na stromě"], ["🐱 🌳 🚒", "Ke stromu přijeli hasiči"], ["🐱 🌳 🪜", "Ke stromu přistavili žebřík"], ["🐱 🪜 🧑‍🚒", "Hasič snáší kočku dolů"], ["🐱 🏠", "Kočka je doma v bezpečí"]]],
  ["trainride", [["🎫", "Cestující má jízdenku"], ["🎫 🚉", "S jízdenkou čeká na nádraží"], ["🚉 🚆", "Vlak přijel na nádraží"], ["🚆 🏞", "Vlak jede krajinou"], ["🚆 🏙", "Vlak dorazil do města"]]],
  ["dishes", [["🍽 🟤", "Špinavý talíř"], ["🍽 💧", "Talíř se namáčí"], ["🍽 🧽 🫧", "Talíř se myje houbičkou"], ["🍽 💧 ✨", "Umytý talíř se oplachuje"], ["🍽 ✨", "Čistý suchý talíř"]]],
  ["kite", [["🪁", "Drak je připravený"], ["🪁 🧵", "K drakovi se přivázala šňůra"], ["🪁 🧵 💨", "Vítr draka zvedá"], ["🪁 ☁", "Drak letí vysoko u mraků"], ["🪁 🌳", "Drak se zachytil na stromě"]]],
  ["eggmeal", [["🥚", "Vajíčko ve skořápce"], ["🥚 🥣", "Vajíčko se rozklepne do misky"], ["🥣 🥄", "Vajíčko se v misce rozmíchá"], ["🍳 ♨", "Vajíčko se smaží"], ["🍳 🍽", "Hotové vajíčko je na talíři"]]],
  ["bird", [["🪹", "Prázdné ptačí hnízdo"], ["🪺", "V hnízdě jsou vajíčka"], ["🪹 🐣", "V hnízdě se klube mládě"], ["🪹 🐥", "Mládě sedí v hnízdě"], ["🐦 ☁", "Ptáček vyletěl z hnízda"]]],
  ["bread", [["🌾", "Obilí na mouku"], ["🌾 🥣", "Z obilí je mouka v misce"], ["🥣 🥄 💧", "Z mouky a vody se míchá těsto"], ["🍞 ♨", "Chléb se peče"], ["🍞 🔪", "Upečený chléb se krájí"]]],
  ["map", [["🗺", "Mapa před výletem"], ["🗺 🧭", "Podle mapy se určí směr"], ["🧭 🥾", "Turista se vydává na cestu"], ["🥾 ⛰", "Turista stoupá na kopec"], ["⛰ 🚩", "Turista dorazil k vlajce na vrcholu"]]],
  ["watercycle", [["🌊", "Voda je v moři"], ["🌊 ☀", "Slunce ohřívá vodu"], ["🌊 ☀ ☁", "Nad vodou se tvoří mrak"], ["🌧 ⛰", "Z mraku prší do hor"], ["⛰ 💧 🌊", "Voda z hor odtéká zpět do moře"]]],
  ["repair", [["🚲 🛞", "Kolo má sundanou pneumatiku"], ["🚲 🛞 🔧", "Pneumatika se opravuje"], ["🚲 🔧", "Pneumatika je zpět na kole"], ["🚲 🪖", "Cyklista si chystá helmu"], ["🚴", "Cyklista jede na opraveném kole"]]],
  ["museum", [["🦴 🟫", "V zemi leží kost"], ["🦴 🟫 ⛏", "Kost se odkrývá"], ["🦴 🖌", "Kost se čistí štětcem"], ["🦴 📦", "Kost se balí do krabice"], ["🦴 🏛", "Kost je vystavená v muzeu"]]],
  ["balloon", [["🎈 🧵", "Balónek na šňůrce"], ["🎈 🧵 💨", "Vítr tahá balónek za šňůrku"], ["🎈 💨", "Šňůrka se pustila"], ["🎈 ☁", "Balónek vyletěl k mrakům"], ["💥 ☁", "Balónek ve vzduchu praskl"]]],
  ["astronaut", [["🧑‍🚀 🚀", "Astronaut je u rakety na zemi"], ["🚀 🔥", "Motory rakety se zapálily"], ["🚀 ☁", "Raketa letí nad mraky"], ["🚀 🌕", "Raketa doletěla k Měsíci"], ["🧑‍🚀 🌕 🚩", "Astronaut na Měsíci postavil vlajku"]]],
];

export const storyBanks = { 1: shortStories, 2: longStories } as const;
export const storyFrameId = (id: string, index: number) => `story-${id}-${index + 1}` as const;
export const storyFrameLabels = Object.fromEntries(
  [...shortStories, ...longStories].flatMap(([id, frames]) =>
    frames.map(([, description], index) => [storyFrameId(id, index), description]),
  ),
);
