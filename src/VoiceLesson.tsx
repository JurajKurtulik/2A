import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import type { Login } from "./cloud-progress";

const api = import.meta.env.VITE_PROGRESS_API_URL ?? "https://p-func-skolahrou-jk.azurewebsites.net/api/v1/profile";
type Connection = { abort: AbortController; peer: RTCPeerConnection; mic?: MediaStream; timer?: number };
const topics = { free: "Vybereme spolu", colors: "Barvy", animals: "Zvířata", body: "Části těla" };

export function VoiceLesson({ login }: { login: Login }) {
  const [topic, setTopic] = useState("free");
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
    if (active.current) return;
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
        body: JSON.stringify({ topic, greeting, sdp: offer.sdp, supportsLive: true }),
      });
      if (active.current !== connection) return;
      if (!response.ok) {
        end(response.status === 429
          ? "Dnešní počet zkušebních lekcí je vyčerpaný." : "Hlasový učitel teď není dostupný.");
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
    <h1>Angličtina nahlas</h1>
    <p>Krátká lekce s AI učitelem. Vyber si téma, nebo ho vymyslete spolu.</p>
    <fieldset disabled={state !== "idle"}>
      <legend>Téma lekce</legend>
      <div className="voice-topics">
        {Object.entries(topics).map(([id, label]) => <button key={id} className={`button ${topic === id ? "primary" : "light"}`}
          type="button" aria-pressed={topic === id} onClick={() => setTopic(id)}>{label}</button>)}
      </div>
    </fieldset>
    {state === "idle" && <div className="voice-options">
      <label><input type="checkbox" checked={greeting} onChange={event => setGreeting(event.target.checked)} /> Pozdravit jménem z profilu</label>
      <p>Zvuk se během lekce posílá do Azure. Škola hrou nahrávku ani přepis neukládá.</p>
    </div>}
    {state === "idle"
      ? <button type="button" className="button primary" onClick={() => void start()}><Mic /> Zahájit lekci</button>
      : <button type="button" className="button primary" onClick={() => end("Lekce skončila. Mikrofon je vypnutý.")}><MicOff /> Ukončit lekci</button>}
    {resumeAudio && <button type="button" className="button light" onClick={() => {
      void audio.current?.play().then(() => setResumeAudio(false)).catch(() => {});
    }}>Zapnout zvuk</button>}
    <audio ref={audio} autoPlay />
    <p role="status">{status}</p>
  </section>;
}
