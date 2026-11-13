import type { TokenCredential } from '@azure/core-auth';
import { ApiError } from './contracts.js';
import { mutate, type Store } from './store.js';

const topics = { free: 'zjisti, co chce žák procvičit', colors: 'barvy', animals: 'zvířata', body: 'části těla' } as const;

export async function connectVoice(
  input: unknown, name: string | undefined, store: Store, credential: TokenCredential,
  config: { endpoint: string; deployment: string; liveDeployment?: string; daily: number },
) {
  const { topic, sdp, greeting, supportsLive } = (input ?? {}) as Record<string, unknown>;
  if (typeof topic !== 'string' || !Object.hasOwn(topics, topic) ||
      typeof sdp !== 'string' || !sdp.startsWith('v=0') || sdp.length > 24000 || typeof greeting !== 'boolean')
    throw new ApiError(400, 'invalid_voice_request');
  const endpoint = new URL(config.endpoint);
  if (!/^https:\/\/[a-z0-9-]+\.openai\.azure\.com\/$/.test(endpoint.href))
    throw new ApiError(503, 'configuration_unavailable');
  const day = new Date().toISOString().slice(0, 10);
  await mutate<{ day: string; count: number }>(store, 'quota/voice-pilot.json', previous => {
    if (previous && (!/^\d{4}-\d{2}-\d{2}$/.test(previous.day) || previous.day > day ||
        !Number.isSafeInteger(previous.count) || previous.count < 0)) throw new ApiError(503, 'voice_unavailable');
    const count = previous?.day === day ? previous.count : 0;
    if (count >= config.daily) throw new ApiError(429, 'voice_limit');
    return { day, count: count + 1 };
  });

  const token = await credential.getToken('https://ai.azure.com/.default');
  if (!token) throw new ApiError(503, 'voice_unavailable');
  const first = greeting && name ? `V první odpovědi oslov žáka českým vokativem tohoto křestního jména: ${JSON.stringify(name)}.` : 'V první odpovědi krátce pozdrav.';
  const instructions = [
    'Jsi přátelský hlasový učitel angličtiny pro českého začátečníka. Vysvětluj stručně česky a anglická slova vyslovuj přirozeně.',
    `Okruh pro začátek: ${topics[topic as keyof typeof topics]}.`, first,
    'Po pozdravu polož právě jednu krátkou otázku a ukonči svůj tah. Po každé otázce nebo výzvě k zopakování počkej, až žák odpoví. Úlohy tvoř sám a přizpůsobuj je podle toho, co žák umí.',
    'Začni jednotlivými slovy a přijímej jednoslovné odpovědi. Všechny pokyny a zpětnou vazbu říkej česky po celou lekci. Anglicky říkej jen procvičovaná slova a příklady.',
    'Při „nevím“ ukaž vzor a nabídni zopakování. Pokud řeči nerozumíš, požádej o zopakování. Výslovnost neznámkuj.',
    'Drž se věkově vhodné angličtiny. Na jiné téma stručně řekni, že tu procvičujete angličtinu, a vrať se k ní. Nežádej osobní údaje.',
    'Při sdělení o nebezpečí povzbuď žáka, aby se hned obrátil na důvěryhodného dospělého.',
  ].join(' ');
  if (supportsLive === true && config.liveDeployment) {
    const call = await fetch(new URL('/openai/v1/live/sessions', endpoint), {
      method: 'POST', signal: AbortSignal.timeout(12000),
      headers: { Authorization: `Bearer ${token.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session: { model: config.liveDeployment, instructions, audio: { output: { voice: 'marin' } },
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
