import type { TokenCredential } from '@azure/core-auth';
import { ApiError } from './contracts.js';

const vocabulary: Record<string, string> = {
  free: 'Nejprve zjisti, jaká anglická slovíčka chce žák procvičit. Pokud neví, nabídni barvy nebo zvířata.',
  colors: 'barvy', animals: 'zvířata', body: 'části těla', family: 'rodina',
  food: 'jídlo a pití', clothes: 'oblečení', toys: 'hračky', school: 'školní potřeby', numbers: 'čísla od jedné do dvaceti',
};
const math: Record<string, string> = {
  mental10: 'Dávej krátké příklady na sčítání a odčítání zpaměti. Všechna čísla včetně výsledku jsou celá od nuly do deseti.',
  mental20: 'Dávej krátké příklady na sčítání a odčítání zpaměti. Všechna čísla včetně výsledku jsou celá od nuly do dvaceti.',
  multiplication: 'Procvičuj malou násobilku s činiteli od jedné do deseti. Začni jednodušším příkladem a přizpůsob se žákovi.',
  stories20: 'Vymýšlej krátké slovní úlohy ze známého prostředí s jednou otázkou a jedním sčítáním nebo odčítáním. Čísla i výsledek musí být celá od nuly do dvaceti.',
  compare20: 'Řekni dvě různá celá čísla od nuly do dvaceti a zeptej se, které je větší nebo menší.',
};
const czech: Record<string, string> = {
  sentenceKinds: 'Řekni jednu krátkou větu s přirozenou intonací a nech žáka určit, zda je oznamovací, tázací, rozkazovací nebo přací. Střídej druhy a přijmi běžná dětská označení.',
  opposites: 'Řekni jedno běžné české slovo a zeptej se na jeho protiklad. Přijmi běžné smysluplné možnosti.',
  categories: 'Střídej hledání nadřazeného pojmu pro dva známé příklady a hledání jednoho podřazeného slova pro danou skupinu. Přijmi každý věcně správný příklad.',
};

function lessonFor(topic: string) {
  if (Object.hasOwn(vocabulary, topic)) return {
    subject: 'angličtiny',
    activity: `Procvičuj jednotlivá anglická slovíčka. Ptej se vždy na jedno a přijímej jednoslovné odpovědi. Okruh pro začátek: ${vocabulary[topic]}.`,
  };
  if (topic === 'sentences') return {
    subject: 'angličtiny',
    activity: 'Trénuj krátké věty z běžného života. V každém kole řekni význam jedné věty česky, pak ji pomalu vyslov anglicky a požádej žáka, aby ji zopakoval. Počkej. Pokud je ve větě nebo ve srozumitelné výslovnosti konkrétní chyba, laskavě předveď správný vzor a dej prostor k dalšímu pokusu se stejnou větou. Při nejistém poslechu požádej o zopakování. Přijmi srozumitelnou výslovnost i s přízvukem. Až se věta povede, krátce pochval a nabídni jednu novou větu.',
  };
  if (Object.hasOwn(math, topic)) return { subject: 'matematiky', activity: math[topic] };
  if (Object.hasOwn(czech, topic)) return { subject: 'češtiny', activity: czech[topic] };
}

export async function connectVoice(
  input: unknown, name: string | undefined, credential: TokenCredential,
  config: { endpoint: string; deployment: string; liveDeployment?: string },
) {
  const { topic, grade, sdp, greeting, supportsLive } = (input ?? {}) as Record<string, unknown>;
  const lesson = typeof topic === 'string' ? lessonFor(topic) : undefined;
  if (!lesson || (grade !== undefined && (typeof grade !== 'number' || !Number.isInteger(grade) || grade < 1 || grade > 9)) ||
      typeof sdp !== 'string' || !sdp.startsWith('v=0') || sdp.length > 24000 || typeof greeting !== 'boolean')
    throw new ApiError(400, 'invalid_voice_request');
  const endpoint = new URL(config.endpoint);
  if (!/^https:\/\/[a-z0-9-]+\.openai\.azure\.com\/$/.test(endpoint.href))
    throw new ApiError(503, 'configuration_unavailable');
  const token = await credential.getToken('https://ai.azure.com/.default');
  if (!token) throw new ApiError(503, 'voice_unavailable');
  const first = greeting && name ? `V první odpovědi oslov žáka českým vokativem tohoto křestního jména: ${JSON.stringify(name)}.` : 'V první odpovědi krátce pozdrav.';
  const instructions = [
    `Jsi přátelský hlasový učitel ${lesson.subject} pro českého školáka${grade === undefined ? '' : ` z ${grade}. třídy`}.`,
    first, lesson.activity,
    'Po pozdravu zadej právě jeden krátký úkol nebo polož jednu otázku. Po každé otázce nebo výzvě dej dítěti čas a počkej na jeho odpověď. Úlohy tvoř sám, vyhodnocuj je a přizpůsobuj tomu, co žák umí.',
    'Pokyny a zpětnou vazbu říkej stručně česky po celou lekci. Anglicky vyslovuj jen procvičovaná slova a věty.',
    'Při „nevím“ krátce pomoz nebo předveď vzor. Pokud řeči nerozumíš, požádej o zopakování.',
    'Po zpětné vazbě plynule pokračuj jedním dalším úkolem. Nikdy sám nenavrhuj konec ani se neptej, jestli chce žák pokračovat. Když žák výslovně chce skončit, krátce se rozluč.',
    `Drž se vybraného okruhu ${lesson.subject}. Pokud rozhovor odbočí, laskavě ho vrať k procvičování. Nežádej osobní údaje.`,
    'Při sdělení o nebezpečí povzbuď žáka, aby se hned obrátil na důvěryhodného dospělého.',
  ].join(' ');
  if (supportsLive === true && config.liveDeployment) {
    const delivery = 'Mluv klidně a o něco pomaleji než v běžném rozhovoru. Používej krátké věty a dělej mezi nimi přirozené pauzy. Česky mluv se spisovnou českou výslovností a přirozenou českou intonací. Před anglickým slovem udělej krátkou pauzu, vyslov ho zřetelně a potom pokračuj česky.';
    const call = await fetch(new URL('/openai/v1/live/sessions', endpoint), {
      method: 'POST', signal: AbortSignal.timeout(12000),
      headers: { Authorization: `Bearer ${token.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session: { model: config.liveDeployment, instructions: `${instructions} ${delivery}`, audio: { output: { voice: 'marin' } },
          delegation: { type: 'client' } },
        transport: { type: 'webrtc', sdp },
      }),
    });
    if (!call.ok) {
      console.warn('GPT-Live session creation failed', call.status, call.headers.get('x-request-id'));
      throw new ApiError(503, 'voice_unavailable');
    }
    const result = await call.json() as { transport?: { sdp?: string } };
    if (typeof result.transport?.sdp !== 'string' || !result.transport.sdp.startsWith('v=0'))
      throw new ApiError(503, 'voice_unavailable');
    return { sdp: result.transport.sdp };
  }
  const created = await fetch(new URL('/openai/v1/realtime/client_secrets', endpoint), {
    method: 'POST', signal: AbortSignal.timeout(12000),
    headers: { Authorization: `Bearer ${token.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ session: { type: 'realtime', model: config.deployment, instructions, tracing: null,
      output_modalities: ['audio'], max_output_tokens: 300,
      audio: { input: { turn_detection: { type: 'server_vad', silence_duration_ms: 1000 } }, output: { voice: 'coral' } },
    } }),
  });
  if (!created.ok) throw new ApiError(503, 'voice_unavailable');
  const { value } = await created.json() as { value?: string };
  if (!value) throw new ApiError(503, 'voice_unavailable');
  const call = await fetch(new URL('/openai/v1/realtime/calls?webrtcfilter=on', endpoint), {
    method: 'POST', signal: AbortSignal.timeout(12000),
    headers: { Authorization: `Bearer ${value}`, 'Content-Type': 'application/sdp' }, body: sdp,
  });
  if (!call.ok) throw new ApiError(503, 'voice_unavailable');
  return call.text();
}
