import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import type { Login } from "./cloud-progress";

const api = import.meta.env.VITE_PROGRESS_API_URL ?? "https://p-func-skolahrou-jk.azurewebsites.net/api/v1/profile";
type Connection = { abort: AbortController; peer: RTCPeerConnection; mic?: MediaStream; timer?: number };
const vocabulary = {
  free: "Vybereme spolu", colors: "Barvy", animals: "Zvířata", body: "Části těla",
  family: "Rodina", food: "Jídlo a pití", clothes: "Oblečení", toys: "Hračky",
  school: "Školní potřeby", numbers: "Čísla do 20",
};
const subjects = {
  english: { label: "Angličtina", topics: vocabulary },
  math: { label: "Matematika", topics: {
    mental10: "Počítání do 10", mental20: "Počítání do 20",
    multiplication: "Malá násobilka", stories20: "Slovní úlohy do 20",
    compare20: "Porovnávání čísel do 20",
  } },
  czech: { label: "Čeština", topics: {
    sentenceKinds: "Druhy vět", opposites: "Slovní protiklady",
    categories: "Nadřazená a podřazená slova",
  } },
};
type Subject = keyof typeof subjects;

export function VoiceLesson({ login, grade }: { login: Login; grade: number }) {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [englishMode, setEnglishMode] = useState<"words" | "sentences" | null>(null);
  const [topic, setTopic] = useState("");
  const [greeting, setGreeting] = useState(false);
  const [state, setState] = useState<"idle" | "connecting" | "ready">("idle");
  const [status, setStatus] = useState("");
  const [resumeAudio, setResumeAudio] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const active = useRef<Connection | null>(null);

  function close() {
    const connection = active.current;
    active.current = null;
    if (!connection) return;
    window.clearTimeout(connection.timer);
    connection.abort.abort();
    connection.mic?.getTracks().forEach(track => track.stop());
    connection.peer.close();
    if (audio.current) audio.current.srcObject = null;
  }

  useEffect(() => {
    const stop = () => { close(); setState("idle"); setResumeAudio(false); };
    window.addEventListener("pagehide", stop);
    return () => { window.removeEventListener("pagehide", stop); close(); };
  }, []);

  function end(message: string) {
    close();
    setState("idle");
    setResumeAudio(false);
    setStatus(message);
  }

  async function start() {
    if (active.current || !topic) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
      setStatus("Tento prohlížeč hlasovou lekci nepodporuje.");
      return;
    }
    const connection: Connection = { abort: new AbortController(), peer: new RTCPeerConnection() };
    active.current = connection;
    setState("connecting");
    setStatus("Připojuji hlasového učitele…");
    const peer = connection.peer;
    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      if (active.current !== connection) { mic.getTracks().forEach(track => track.stop()); return; }
      connection.mic = mic;
      for (const track of mic.getAudioTracks()) {
        track.enabled = false;
        peer.addTrack(track, mic);
      }
      connection.timer = window.setTimeout(() => end("Připojení trvalo příliš dlouho. Zkus to znovu."), 30000);
      peer.ontrack = event => {
        if (!audio.current || active.current !== connection) return;
        audio.current.srcObject = event.streams[0] ?? new MediaStream([event.track]);
        void audio.current.play().catch(() => { if (active.current === connection) setResumeAudio(true); });
      };
      peer.onconnectionstatechange = () => {
        if (active.current === connection && ["failed", "closed"].includes(peer.connectionState)) end("Spojení se přerušilo.");
      };
      const events = peer.createDataChannel("oai-events");
      let live = false;
      events.onopen = () => {
        if (active.current !== connection) return;
        window.clearTimeout(connection.timer);
        connection.timer = window.setTimeout(() => end("Pětiminutová lekce skončila."), 5 * 60000);
        events.send(JSON.stringify(live
          ? { type: "session.commentary.append", delegation_id: null, content: "Zahaj lekci podle instrukcí. Krátce pozdrav česky a polož jednu otázku." }
          : { type: "response.create" }));
        mic.getAudioTracks().forEach(track => { track.enabled = true; });
        setState("ready");
        setStatus("Mikrofon je zapnutý. Až učitel domluví, můžeš odpovědět.");
      };
      events.onclose = () => { if (active.current === connection) end("Spojení se ukončilo."); };
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      const response = await fetch(`${api}/voice`, {
        method: "POST", signal: connection.abort.signal,
        headers: { Authorization: `Bearer ${login.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ topic, grade, greeting, sdp: offer.sdp, supportsLive: true }),
      });
      if (active.current !== connection) return;
      if (!response.ok) {
        end("Hlasový učitel teď není dostupný.");
        return;
      }
      live = response.headers.get("Content-Type")?.includes("application/json") ?? false;
      const sdp = live ? (await response.json() as { sdp: string }).sdp : await response.text();
      await peer.setRemoteDescription({ type: "answer", sdp });
    } catch (error) {
      if (active.current === connection) end(error instanceof DOMException && error.name === "NotAllowedError"
        ? "Povol mikrofon v prohlížeči a zkus to znovu." : "Připojení se nepodařilo. Zkus to znovu.");
    }
  }

  return <section className="voice-lesson">
    <h1>Povídej a procvičuj</h1>
    <fieldset disabled={state !== "idle"}>
      <legend>Co si chceš procvičit?</legend>
      <div className="voice-topics">
        {(Object.keys(subjects) as Subject[]).map(id => <button key={id}
          className={`button ${subject === id ? "primary" : "light"}`} type="button" aria-pressed={subject === id}
          onClick={() => { setSubject(id); setEnglishMode(null); setTopic(""); }}>{subjects[id].label}</button>)}
      </div>
    </fieldset>
    {subject === "english" && <fieldset disabled={state !== "idle"}>
      <legend>Co budeme říkat?</legend>
      <div className="voice-topics">
        <button type="button" className={`button ${englishMode === "words" ? "primary" : "light"}`}
          aria-pressed={englishMode === "words"} onClick={() => { setEnglishMode("words"); setTopic(""); }}>Slovíčka</button>
        <button type="button" className={`button ${englishMode === "sentences" ? "primary" : "light"}`}
          aria-pressed={englishMode === "sentences"} onClick={() => { setEnglishMode("sentences"); setTopic("sentences"); }}>Jednoduché věty</button>
      </div>
    </fieldset>}
    {subject && (subject !== "english" || englishMode === "words") && <fieldset disabled={state !== "idle"}>
      <legend>Téma lekce</legend>
      <div className="voice-topics">
        {Object.entries(subjects[subject].topics).map(([id, label]) => <button key={id}
          className={`button ${topic === id ? "primary" : "light"}`} type="button"
          aria-pressed={topic === id} onClick={() => setTopic(id)}>{label}</button>)}
      </div>
    </fieldset>}
    {topic && state === "idle" && <div className="voice-options">
      <label><input type="checkbox" checked={greeting} onChange={event => setGreeting(event.target.checked)} /> Pozdravit jménem z profilu</label>
      <p>Zvuk se během lekce posílá do Azure. Škola hrou nahrávku ani přepis neukládá.</p>
    </div>}
    {state === "idle"
      ? topic && <button type="button" className="button primary" onClick={() => void start()}><Mic /> Zahájit lekci</button>
      : <button type="button" className="button primary" onClick={() => end("Lekce skončila. Mikrofon je vypnutý.")}><MicOff /> Ukončit lekci</button>}
    {resumeAudio && <button type="button" className="button light" onClick={() => {
      void audio.current?.play().then(() => setResumeAudio(false)).catch(() => {});
    }}>Zapnout zvuk</button>}
    <audio ref={audio} autoPlay />
    <p role="status">{status}</p>
  </section>;
}
