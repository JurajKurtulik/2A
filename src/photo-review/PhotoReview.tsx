import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, QrCode, Upload, RefreshCw, CheckCircle2 } from "lucide-react";
import { useReviewConfig } from "./config";
import { reviewClient, preparePhoto, ReviewApiError } from "./client";
import {
  uploadLink,
  compareTranscription,
  type ReviewAssignment,
  type ReviewSession,
  type ReviewStatus,
} from "./contracts";
export type ConfirmedReview = {
  assignmentId: string;
  texts: Record<string, string>;
  correct: number;
  total: number;
};
export function PhotoReview({
  assignment,
  onConfirmed,
  service,
}: {
  assignment: ReviewAssignment;
  service?: ReturnType<typeof reviewClient>;
  onConfirmed: (result: ConfirmedReview) => void;
}) {
  const { config, error: configError } = useReviewConfig();
  const client = useMemo(
    () => service ?? (config?.enabled ? reviewClient(config) : null),
    [config, service],
  );
  const [session, setSession] = useState<ReviewSession | null>(null),
    [status, setStatus] = useState<ReviewStatus | null>(null);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [consent, setConsent] = useState(false),
    [ack, setAck] = useState(false),
    [paused, setPaused] = useState(false);
  const [texts, setTexts] = useState<Record<string, string>>({}),
    [qr, setQr] = useState(""),
    [photo, setPhoto] = useState<Blob | null>(null),
    [preview, setPreview] = useState(""),
    [saved, setSaved] = useState(false);
  const mounted = useRef(true),
    fileVersion = useRef(0),
    requestId = useRef(crypto.randomUUID());
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      fileVersion.current++;
    };
  }, []);
  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  useEffect(() => {
    if (!session) return;
    let alive = true;
    import("qrcode")
      .then((m) =>
        m.toDataURL(uploadLink(location.href, session), {
          width: 260,
          margin: 2,
          errorCorrectionLevel: "M",
        }),
      )
      .then((url) => {
        if (alive) setQr(url);
      })
      .catch(() => {
        if (alive)
          setError(
            "QR kód se nepodařilo připravit. Můžeš nahrát fotku na tomto zařízení.",
          );
      });
    return () => {
      alive = false;
    };
  }, [session]);
  useEffect(() => {
    if (
      !client ||
      !session ||
      paused ||
      saved ||
      status?.status === "completed" ||
      status?.status === "failed" ||
      status?.status === "expired"
    )
      return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      if (Date.now() >= Date.parse(session.expiresAt)) {
        if (active) setStatus({ ...session, status: "expired" });
        return;
      }
      try {
        const next = await client.status(assignment, session);
        if (!active) return;
        setStatus(next);
        setError("");
        if (next.status === "completed") {
          setTexts(
            Object.fromEntries(
              next.result!.items.map((i) => [i.id, i.recognizedText]),
            ),
          );
          return;
        }
        if (next.status === "failed" || next.status === "expired") return;
        timer = setTimeout(poll, document.hidden ? 15000 : 5000);
      } catch (e) {
        if (active) {
          setError(message(e));
          if (e instanceof ReviewApiError && e.status === 410)
            setStatus({ ...session, status: "expired" });
          else setPaused(true);
        }
      }
    };
    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [client, session, paused, saved, status?.status, assignment]);
  async function create() {
    if (!client || !consent || busy) return;
    setBusy(true);
    setError("");
    try {
      const next = await client.create(assignment, requestId.current);
      if (!mounted.current) return;
      setSession(next);
      setStatus(null);
      setPaused(false);
      setAck(false);
      setTexts({});
      setQr("");
    } catch (e) {
      if (mounted.current) {
        setError(message(e));
        if (e instanceof ReviewApiError && e.status === 410)
          requestId.current = crypto.randomUUID();
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function choose(file?: File) {
    if (!file) return;
    const version = ++fileVersion.current;
    setError("");
    setPhoto(null);
    setBusy(true);
    try {
      const prepared = await preparePhoto(file);
      if (mounted.current && version === fileVersion.current)
        setPhoto(prepared);
    } catch (e) {
      if (mounted.current && version === fileVersion.current)
        setError(message(e));
    } finally {
      if (mounted.current && version === fileVersion.current) setBusy(false);
    }
  }
  async function upload() {
    if (!client || !session || !photo || busy || !consent) return;
    setBusy(true);
    setError("");
    try {
      await client.upload(session.id, session.uploadToken, photo);
      if (!mounted.current) return;
      setPhoto(null);
      setStatus(null);
      setPaused(false);
    } catch (e) {
      if (mounted.current) {
        setError(message(e));
        if (e instanceof ReviewApiError && e.status === 410)
          setStatus({ ...session, status: "expired" });
        else setPaused(true);
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  const completed = status?.status === "completed";
  return (
    <section className="photo-review" aria-label="Kontrola řešení z fotografie">
      <div className="photo-review-heading">
        <Camera />
        <div>
          <h2>Kontrola z fotografie</h2>
          <p>Vyfoť pouze popsaný papír, bez obličeje a jména.</p>
        </div>
      </div>
      {configError && (
        <p role="alert" className="feedback bad">
          {configError}
        </p>
      )}
      {!service && !config && !configError && (
        <p role="status">Načítám možnosti kontroly…</p>
      )}
      {!service && config && !config.enabled && (
        <div className="feedback">
          <strong>Automatická kontrola se připravuje.</strong>
          <p>
            Věty si už můžeš přepsat na papír. Zatím je s tebou zkontroluje
            rodič. Nahrávání fotek zapneme po připojení služby v Azure.
          </p>
        </div>
      )}
      {client && !session && (
        <>
          <Consent checked={consent} onChange={setConsent} />
          <button
            className="button primary"
            disabled={!consent || busy}
            onClick={create}
          >
            <QrCode size={18} />
            {busy
              ? "Připravuji propojení…"
              : "Připojit telefon nebo nahrát fotku"}
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="feedback bad">
          {error}
        </p>
      )}
      {session && !completed && !saved && (
        <>
          <p role="status">
            {status?.status === "expired"
              ? "Platnost propojení skončila."
              : status?.status === "failed"
                ? "Kontrola se nezdařila."
                : status?.status === "processing"
                  ? "Fotka se kontroluje. Může to chvíli trvat."
                  : "Čekám na fotku z telefonu nebo tohoto zařízení."}
          </p>
          {!["expired", "failed"].includes(status?.status || "") && (
            <>
              <div className="photo-review-connect">
                {qr && (
                  <figure>
                    <img
                      src={qr}
                      width={260}
                      height={260}
                      alt="QR kód pro jednorázové nahrání fotografie"
                    />
                    <figcaption>
                      Naskenuj fotoaparátem telefonu.
                      <br />
                      Platnost do{" "}
                      {new Date(session.expiresAt).toLocaleTimeString("cs-CZ", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      .
                    </figcaption>
                  </figure>
                )}
                <div>
                  <h3>Nebo použij toto zařízení</h3>
                  <label className="button light photo-file">
                    <Upload size={17} />
                    Vybrat fotku
                    <input
                      aria-label="Vybrat fotku řešení"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={busy || status?.status === "processing"}
                      onChange={(e) => {
                        void choose(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <p className="hint">
                    JPG, PNG nebo WebP do 15 MB. Před odesláním fotku zmenšíme a
                    odstraníme metadata.
                  </p>
                </div>
              </div>
              {preview && (
                <div className="photo-preview">
                  <img
                    src={preview}
                    alt="Připravená fotografie před odesláním"
                  />
                  <button
                    className="button primary"
                    disabled={busy}
                    onClick={upload}
                  >
                    {busy
                      ? "Odesílám a kontroluji…"
                      : "Odeslat fotku ke kontrole"}
                  </button>
                </div>
              )}
              {paused && (
                <button
                  className="button light"
                  disabled={busy}
                  onClick={() => {
                    setPaused(false);
                    setError("");
                  }}
                >
                  <RefreshCw size={16} />
                  Ověřit stav kontroly
                </button>
              )}
            </>
          )}
          {["expired", "failed"].includes(status?.status || "") && (
            <p className="hint">
              Pro nový pokus založ novou kontrolu. Předchozí fotku služba
              odstraní podle doby uchování.
            </p>
          )}
          {["expired", "failed"].includes(status?.status || "") && (
            <button
              className="button light"
              disabled={busy}
              onClick={() => {
                requestId.current = crypto.randomUUID();
                setSession(null);
                setStatus(null);
                setPhoto(null);
                setError("");
              }}
            >
              Připravit novou kontrolu
            </button>
          )}
        </>
      )}
      {completed && !saved && (
        <div className="photo-recognition">
          <h3>Rodič zkontroluje rozpoznaný text</h3>
          <p>
            Nejprve porovnej tento přepis s tím, co je skutečně na fotce. Oprav
            pouze chyby rozpoznání, nikoli chyby dítěte.
          </p>
          {assignment.items.map((item, i) => {
            const recognized = status.result!.items.find(
              (row) => row.id === item.id,
            )!;
            return (
              <label key={item.id}>
                Věta {i + 1}
                {recognized.uncertain && (
                  <strong className="uncertain">
                    {" "}
                    · Nejasné místo – ověř podle papíru
                  </strong>
                )}
                <textarea
                  value={texts[item.id] ?? ""}
                  maxLength={1000}
                  onChange={(e) => {
                    setTexts({ ...texts, [item.id]: e.target.value });
                    setAck(false);
                  }}
                />
              </label>
            );
          })}
          <label className="review-consent">
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
            />
            Porovnal(a) jsem všechny věty s papírem a ručně ověřil(a) nejasná
            místa.
          </label>
          <button
            className="button primary"
            disabled={!ack}
            onClick={() => {
              const rows = compareTranscription(assignment, texts);
              setSaved(true);
              onConfirmed({
                assignmentId: assignment.id,
                texts,
                correct: rows.filter((r) => r.correct).length,
                total: rows.length,
              });
            }}
          >
            <CheckCircle2 size={18} />
            Potvrdit přepis a vyhodnotit
          </button>
        </div>
      )}
      {saved && (
        <p role="status" className="feedback good">
          Výsledek byl potvrzený rodičem.
        </p>
      )}
    </section>
  );
}
export function message(e: unknown) {
  return e instanceof Error
    ? e.message
    : "Kontrolní služba není dostupná. Zkus to později.";
}
export function Consent({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="review-consent">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      Jako rodič souhlasím s odesláním zadání a fotografie do naší služby v
      Microsoft Azure a modelu Microsoft Foundry za účelem kontroly. Fotografie
      se po zpracování odstraní; nedokončené relace a výsledky se mažou
      nejpozději do 60 minut.
    </label>
  );
}
