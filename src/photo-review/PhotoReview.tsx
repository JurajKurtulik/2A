import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, QrCode, Upload, RefreshCw } from "lucide-react";
import { useReviewConfig } from "./config";
import { reviewClient, preparePhoto, ReviewApiError } from "./client";
import { randomId } from "../random-id";
import {
  uploadLink,
  compareTranscription,
  type ReviewAssignment,
  type ReviewSession,
  type ReviewStatus,
} from "./contracts";
export type PhotoReviewResult = {
  assignmentId: string;
  texts: Record<string, string>;
  correct: number;
  total: number;
};
export function PhotoReview({
  assignment,
  onComplete,
  service,
}: {
  assignment: ReviewAssignment;
  service?: ReturnType<typeof reviewClient>;
  onComplete: (result: PhotoReviewResult) => void;
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
    [paused, setPaused] = useState(false);
  const [qr, setQr] = useState(""),
    [photo, setPhoto] = useState<Blob | null>(null),
    [preview, setPreview] = useState("");
  const mounted = useRef(true),
    fileVersion = useRef(0),
    requestId = useRef(randomId()),
    reportedSession = useRef("");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
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
          if (reportedSession.current !== session.id) {
            const texts = Object.fromEntries(
              next.result!.items.map((item) => [item.id, item.recognizedText]),
            );
            const rows = compareTranscription(assignment, texts);
            reportedSession.current = session.id;
            onCompleteRef.current({
              assignmentId: assignment.id,
              texts,
              correct: rows.filter((row) => row.correct).length,
              total: assignment.items.length,
            });
          }
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
  }, [client, session, paused, status?.status, assignment]);
  async function create() {
    if (!client || busy) return;
    setBusy(true);
    setError("");
    try {
      const next = await client.create(assignment, requestId.current);
      if (!mounted.current) return;
      setSession(next);
      setStatus(null);
      setPaused(false);
      setQr("");
    } catch (e) {
      if (mounted.current) {
        setError(message(e));
        if (e instanceof ReviewApiError && e.status === 410)
          requestId.current = randomId();
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
    if (!client || !session || !photo || busy) return;
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
          <strong>Kontrola z fotografie teď není zapnutá.</strong>
          <p>Přepis můžeš dál procvičovat na papír.</p>
        </div>
      )}
      {client && !session && (
        <button className="button primary" disabled={busy} onClick={create}>
          <QrCode size={18} />
          {busy
            ? "Připravuji propojení…"
            : "Připojit telefon nebo nahrát fotku"}
        </button>
      )}
      {error && (
        <p role="alert" className="feedback bad">
          {error}
        </p>
      )}
      {session && !completed && (
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
                requestId.current = randomId();
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
      {completed && (
        <p role="status" className="feedback good">
          Kontrola je hotová. Výsledek a jednotlivé rozdíly jsou níže.
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
