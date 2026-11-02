import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Upload } from "lucide-react";
import { useReviewConfig } from "./config";
import { reviewClient, preparePhoto } from "./client";
import { Consent, message } from "./PhotoReview";
export function MobilePhotoUpload({
  id,
  token,
}: {
  id: string;
  token: string;
}) {
  const { config, error: configError } = useReviewConfig();
  const client = useMemo(
    () => (config?.enabled ? reviewClient(config) : null),
    [config],
  );
  const [photo, setPhoto] = useState<Blob | null>(null),
    [preview, setPreview] = useState(""),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState("");
  const version = useRef(0),
    alive = useRef(true);
  useEffect(() => {
    history.replaceState(null, "", location.pathname + location.search);
    alive.current = true;
    return () => {
      alive.current = false;
      version.current++;
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
  async function choose(file?: File) {
    if (!file) return;
    const current = ++version.current;
    setBusy(true);
    setError("");
    setPhoto(null);
    try {
      const next = await preparePhoto(file);
      if (alive.current && version.current === current) setPhoto(next);
    } catch (e) {
      if (alive.current && version.current === current) setError(message(e));
    } finally {
      if (alive.current && version.current === current) setBusy(false);
    }
  }
  async function send() {
    if (!client || !photo || !consent || busy || sent) return;
    setBusy(true);
    setError("");
    try {
      await client.upload(id, token, photo);
      if (alive.current) {
        setSent(true);
        setPhoto(null);
      }
    } catch (e) {
      if (alive.current) setError(message(e));
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  return (
    <main className="mobile-photo">
      <span className="eyebrow">ŠKOLA HROU · FOTKA ŘEŠENÍ</span>
      <h1>Vyfoť svůj papír</h1>
      <p>
        Fotka se přiřadí k úloze otevřené na počítači. Výsledek a vysvětlení se
        zobrazí tam.
      </p>
      {configError && (
        <p role="alert" className="feedback bad">
          {configError}
        </p>
      )}
      {!config && !configError && <p role="status">Načítám nahrávání…</p>}
      {config && !config.enabled && (
        <p className="feedback">
          Nahrávání fotek zatím není připojené. Vrať se k zadání na počítači.
        </p>
      )}
      {error && (
        <p role="alert" className="feedback bad">
          {error}
        </p>
      )}
      {client && !sent && (
        <>
          <label className="button primary photo-file">
            <Camera size={20} />
            Vyfotit papír
            <input
              type="file"
              aria-label="Vyfotit papír"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              disabled={busy}
              onChange={(e) => {
                void choose(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <label className="button light photo-file">
            <Upload size={18} />
            Vybrat z galerie
            <input
              type="file"
              aria-label="Vybrat z galerie"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={(e) => {
                void choose(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <p className="hint">
            JPG, PNG nebo WebP do 15 MB. Foť za světla, celý text rovně a
            čitelně. Bez jména, obličeje a dalších osobních údajů.
          </p>
          {preview && (
            <img
              className="mobile-photo-preview"
              src={preview}
              alt="Fotka připravená k odeslání"
            />
          )}
          <Consent checked={consent} onChange={setConsent} />
          <button
            className="button primary"
            disabled={!photo || !consent || busy}
            onClick={send}
          >
            {busy
              ? "Připravuji nebo kontroluji fotku…"
              : "Odeslat a zkontrolovat"}
          </button>
          <p className="hint">
            Po odeslání vyčkej. Pokud spojení vypadne, nejprve ověř stav na
            počítači. Obnovením této stránky se propojení ztratí; můžeš znovu
            naskenovat původní QR kód, dokud platí.
          </p>
        </>
      )}
      {sent && (
        <div role="status" className="feedback good">
          <strong>Fotka byla zpracovaná.</strong>
          <p>
            Vrať se na počítač. Rodič tam potvrdí rozpoznaný text a zobrazí se
            výsledek.
          </p>
        </div>
      )}
    </main>
  );
}
