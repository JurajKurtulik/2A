export type StoryLevel = 1 | 2;
type IllustratedStory = readonly [id: string, frames: readonly string[]];

// Each entry names the original illustrations in chronological order.
export const storyBanks: Record<StoryLevel, readonly IllustratedStory[]> = {
  1: [
    ["pear-bites", ["Celá hruška","Nakousnutá hruška","Ohryzek hrušky"]],
    ["ice-pop", ["Celý nanuk","Nakousnutý nanuk","Dřívko po nanuku"]],
    ["pencil-sharpen", ["Tupá tužka","Tužka v ořezávátku","Ořezaná tužka"]],
    ["unroll", ["Srolovaný papír","Napůl rozvinutý papír","Úplně rozvinutý papír"]],
    ["socks-mend", ["Ponožka s dírou","Ponožka při zašívání","Ponožka se záplatou"]],
    ["apple-cut", ["Celé zelené jablko","Dvě půlky jablka","Jablko na plátky"]],
    ["brick-tower", ["Jedna kostka","Nízká věž","Vysoká věž"]],
    ["shell-open", ["Zavřená mušle","Napůl otevřená mušle","Mušle s perlou"]],
    ["gift-open", ["Zavřený dárek","Nadzvednuté víko","Medvídek v otevřeném dárku"]],
    ["spray-clean", ["Zablácené okno","Napůl umyté okno","Čisté okno"]],
    ["soap-wear", ["Velká kostka mýdla","Menší oblé mýdlo","Drobný zbytek mýdla"]],
    ["candle-short", ["Vysoká zapálená svíčka","Z poloviny vyhořelá svíčka","Nízký zbytek svíčky"]],
    ["snowman-build", ["Jedna sněhová koule","Dvě sněhové koule na sobě","Hotový sněhulák"]],
    ["leaf-colors", ["Zelený list","Zeleno-oranžový list","Oranžovočervený list"]],
    ["banana-ripen", ["Zelený banán","Žlutý banán","Hnědý přezrálý banán"]],
    ["flower-open", ["Zavřené poupě","Napůl otevřený květ","Rozkvetlý tulipán"]],
    ["egg-hatch", ["Celé vajíčko","Kuřátko se klube","Kuřátko stojí venku"]],
    ["sock-dry", ["Ponožka, ze které teče voda","Ponožka s jednou kapkou","Suchá ponožka"]],
    ["stamp-clay", ["Hladká placka z hlíny","Razítko se vtlačuje do hlíny","Hlína s otiskem listu"]],
    ["orange-peel", ["Celý pomeranč","Napůl oloupaný pomeranč","Oloupaný pomeranč"]],
  ],
  2: [
    ["frozen-puddle", ["Celá kostka ledu","Kostka s první loužičkou","Poloviční kostka ve vodě","Malý zbytek ledu","Louže bez ledu"]],
    ["flower-growth", ["Semínko na hlíně v květináči","Drobný klíček","Vyšší stonek se zelenými listy","Nerozkvetlé poupě","Rozkvetlá žlutá květina"]],
    ["pizza-making", ["Koule z těsta","Rozválené těsto","Těsto s rajčatovou omáčkou","Pizza se syrovou náplní","Upečená pizza"]],
    ["snowman-assembly", ["Jedna sněhová koule","Dvě sněhové koule na sobě","Tři koule bez obličeje","Sněhulák s očima a mrkví","Sněhulák s kloboukem a šálou"]],
    ["toy-road", ["Podvozek bez kol","Podvozek se dvěma koly","Podvozek se čtyřmi koly","Autíčko bez předního skla","Hotové červené autíčko"]],
    ["butterfly-life", ["Motýlí vajíčka na listu","Housenka na listu","Kukla na větvi","Motýl vylézá z kukly","Motýl s roztaženými křídly"]],
    ["gift-unwrapping", ["Zabalený dárek s mašlí","Dárek bez mašle","Dárek s natrženým papírem","Krabice s vykukujícím zajíčkem","Plyšový zajíček vybalený z krabice"]],
    ["balloon-inflate", ["Prázdný balónek","Trochu nafouknutý balónek","Napůl nafouknutý balónek","Nafouknutý zavázaný balónek","Prasklý balónek"]],
    ["cookie-making", ["Koule z těsta","Rozválené těsto","Syrová hvězdička","Upečená hvězdička","Hvězdička s polevou"]],
    ["lantern-fold", ["Čtverec oranžového papíru","Papír přeložený na obdélník","Přeložený papír s nastříhanými proužky","Stočený papírový lampion","Lampion s uchem"]],
    ["paper-plane", ["Rovný modrý papír","Přeložený modrý papír","Papír se složenou špičkou","Letadélko s jedním složeným křídlem","Hotové letadélko se dvěma křídly"]],
    ["sandcastle", ["Hromádka písku","Písek v převráceném kyblíku","Písková věž bez kyblíku","Pískový hrad s hradbou","Pískový hrad s vlajkou"]],
    ["sprout-bean", ["Suchá fazole","Prasklá fazole s kořínkem","Fazole s kořínkem a výhonkem","Klíček s malými listy","Fazole se dvěma velkými listy"]],
    ["tulip-growth", ["Cibulka tulipánu","Cibulka s výhonkem","Zavřené zelené poupě","Pootevřené červené poupě","Rozkvetlý červený tulipán"]],
    ["sunflower-fade", ["Rozkvetlá slunečnice","Slunečnice se svěšenými lístky","Slunečnice s napůl uschlými lístky","Slunečnice s posledními lístky","Terč slunečnice bez lístků"]],
    ["sliced-loaf", ["Celý bochník chleba","Bochník s jedním krajícem","Bochník se třemi krajíci","Patka a několik krajíců","Chléb nakrájený na krajíce"]],
    ["orange-juice", ["Celý pomeranč","Rozpůlený pomeranč","Pomeranč na odšťavňovači","Odšťavňovač plný šťávy","Sklenice pomerančové šťávy"]],
    ["corn-pop", ["Kukuřičný klas","Miska kukuřičných zrnek","Zrnka s prvními kousky popcornu","Miska napůl plná popcornu","Miska plná popcornu"]],
    ["clay-pot", ["Koule z fialové hlíny","Dno nádoby z hlíny","Nádoba s nízkými stěnami","Hotová fialová nádoba","Nádoba s bílými proužky"]],
    ["paint-pot", ["Obyčejný květináč","Květináč s jedním proužkem","Květináč se dvěma proužky","Květináč s proužky a puntíky","Ozdobený květináč s tulipánem"]],
    ["wooden-house", ["Základ z dřevěných kostek","Rozestavěné stěny","Domeček bez střechy","Domeček se střechou","Domeček s komínem"]],
    ["fruit-skewer", ["Prázdná špejle","Špejle s jahodou","Špejle s jahodou a kiwi","Špejle s jahodou, kiwi a pomerančem","Špejle s hroznem navíc"]],
    ["sandwich", ["Plátek bílého chleba","Chléb s listem salátu","Chléb se salátem a rajčetem","Chléb se salátem, rajčetem a sýrem","Přiklopený sendvič"]],
    ["yogurt-bowl", ["Prázdná modrá miska","Miska s bílým jogurtem","Jogurt s borůvkami","Jogurt s borůvkami a jahodami","Jogurt s ovocem a vločkami"]],
    ["boot-cleaning", ["Zablácená holínka","Holínka čistá nahoře","Holínka s trochou bláta na patě","Čistá mokrá holínka","Čistá suchá holínka"]],
    ["soap-bubbles", ["Očko bublifuku","Očko s malou bublinou","Očko se střední bublinou","Očko s velkou bublinou","Volně letící bublina"]],
    ["old-pencil", ["Nová dlouhá tužka","Trochu opotřebená tužka","Tužka zkrácená na polovinu","Krátká tužka","Drobný zbytek tužky"]],
    ["candle-making", ["Růžové kousky vosku","Roztavený vosk v konvičce","Vosk s knotem ve sklenici","Ztuhlá svíčka","Zapálená svíčka"]],
    ["peel-banana", ["Celý žlutý banán","Banán s kouskem odhrnuté slupky","Napůl oloupaný banán","Skoro oloupaný banán","Oloupaný banán"]],
    ["puzzle-assembly", ["Rámeček s jedním dílkem","Rámeček se dvěma dílky","Rámeček se třemi dílky","Rámeček se čtyřmi dílky","Složený obrázek květiny"]],
  ],
};

export const storyFrameId = (id: string, index: number) => `story-${id}-${index + 1}` as const;
export const storyFrameLabels = Object.fromEntries(
  [...storyBanks[1], ...storyBanks[2]].flatMap(([id, frames]) =>
    frames.map((description, index) => [storyFrameId(id, index), description]),
  ),
);
