import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileText,
  Monitor,
  Printer,
  RotateCcw,
  X,
} from "lucide-react";
import { topicsForGrade, type Subject } from "./content";
import {
  createWorksheet,
  subjectName,
  validateSelection,
  worksheetQuestions,
  type PaperPage,
  type Worksheet,
  type TopicSelection,
} from "./worksheet";

import { getGrade, type Grade } from "./grades";
export type BuilderOptions = {
  grade?: Grade;
  subject: Subject;
  preset: "custom" | "short" | "long";
  worksheet?: Worksheet;
};
type Props = {
  options: BuilderOptions;
  recent: string[];
  onClose: () => void;
  onGenerated: (w: Worksheet) => void;
  onOnline: (w: Worksheet) => void;
};
function PaperPreview({
  worksheet,
  pages,
  solutions = false,
}: {
  worksheet: Worksheet;
  pages: PaperPage[];
  solutions?: boolean;
}) {
  return (
    <>
      {pages.map((page, i) => (
        <div className="paper-page" key={i}>
          {i === 0 && (
            <>
              <div className="paper-title">
                {subjectName(worksheet.subject)} –{" "}
                {solutions ? "řešení pro rodiče" : "cvičná písemka"}
              </div>
              <div className="paper-meta">
                {getGrade(worksheet.grade)}. třída | Varianta {worksheet.id}
              </div>
              <div className="paper-name">
                {solutions
                  ? "Řešení patří ke stejnému označení varianty na zadání."
                  : "Jméno: __________________________    Datum: ______________"}
              </div>
            </>
          )}
          {page.rows.map((row, r) => (
            <div
              key={r}
              className={"paper-row " + (row.rule ? "paper-rule" : "")}
              style={{
                top: `${page.bodyTop + page.rows.slice(0, r).reduce((n, x) => n + x.height, 0)}pt`,
                height: `${row.height}pt`,
                fontSize: `${row.size}pt`,
                fontWeight: row.bold ? 700 : 400,
                gridTemplateColumns: `repeat(${row.cells.length || 1},1fr)`,
              }}
            >
              {row.cells.map((cell, c) => (
                <span
                  key={c}
                  style={
                    row.rule ? { height: `${row.height - 7}pt` } : undefined
                  }
                >
                  {cell}
                </span>
              ))}
            </div>
          ))}
          <div className="paper-footer">
            <span>Škola hrou | Varianta {worksheet.id}</span>
            <span>
              {i + 1} / {pages.length}
            </span>
          </div>
        </div>
      ))}
    </>
  );
}
export function WorksheetBuilder({
  options,
  recent,
  onClose,
  onGenerated,
  onOnline,
}: Props) {
  const grade = getGrade(options.worksheet?.grade ?? options.grade);
  const availableTopics = topicsForGrade(grade, options.subject);
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      availableTopics.map((t) => [
        t.id,
        options.preset === "custom"
          ? 0
          : options.preset === "short"
            ? 2
            : options.subject === "math"
              ? 4
              : 3,
      ]),
    ),
  );
  const [step, setStep] = useState(options.worksheet ? 3 : 1),
    [mode, setMode] = useState<"online" | "paper">("paper"),
    [worksheet, setWorksheet] = useState<Worksheet | null>(
      options.worksheet || null,
    ),
    [solutions, setSolutions] = useState(false),
    [pages, setPages] = useState<PaperPage[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState("");
  const dialog = useRef<HTMLDivElement>(null),
    requestVersion = useRef(0);
  const selections: TopicSelection[] = availableTopics
    .filter((t) => counts[t.id] > 0)
    .map((t) => ({ topic: t.id, count: counts[t.id] }));
  const total = selections.reduce((n, s) => n + s.count, 0),
    selectionError = validateSelection(options.subject, selections, grade);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  useEffect(() => {
    if (!worksheet || step !== 3) return;
    let cancelled = false;
    setPages([]);
    setError("");
    setBusy("preview");
    import("./export")
      .then((m) => m.prepareLayout(worksheet, solutions))
      .then((result) => {
        if (!cancelled) setPages(result.pages);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "Náhled se nepodařilo připravit. Zkontroluj připojení a zkus to znovu.",
          );
      })
      .finally(() => {
        if (!cancelled) setBusy("");
      });
    return () => {
      cancelled = true;
    };
  }, [worksheet, solutions, step]);
  function generate() {
    try {
      const selected =
        worksheet && step === 3
          ? worksheet.sections.map((s) => ({
              topic: s.topic,
              count: s.questions.length,
            }))
          : selections;
      const next = createWorksheet(
        options.subject,
        selected,
        [
          ...recent,
          ...(worksheet
            ? worksheetQuestions(worksheet).map(
                (q) =>
                  `${q.topic}:${q.prompt}:${q.text || ""}:${q.answers.join("/")}`,
              )
            : []),
        ],
        grade,
      );
      setWorksheet(next);
      onGenerated(next);
      if (step === 2 && mode === "online") {
        onOnline(next);
        return;
      }
      setSolutions(false);
      setError("");
      setStep(3);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Písemku se nepodařilo vytvořit.",
      );
    }
  }
  async function download(format: "pdf" | "docx") {
    if (!worksheet || busy) return;
    setBusy(format);
    setError("");
    const current = ++requestVersion.current;
    try {
      const m = await import("./export");
      const file =
        format === "pdf"
          ? await m.exportPdf(worksheet, solutions)
          : await m.exportDocx(worksheet, solutions);
      m.saveDownload(
        file,
        `pisemka-${worksheet.subject === "math" ? "matematika" : "cestina"}-${worksheet.id}${solutions ? "-reseni" : ""}.${format}`,
        format === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
    } catch {
      setError(
        "Soubor se nepodařilo vytvořit. Zkontroluj připojení a zkus stažení znovu.",
      );
    } finally {
      if (current === requestVersion.current) setBusy("");
    }
  }
  function keyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape" && !busy) {
      e.stopPropagation();
      onClose();
    }
    if (e.key === "Tab") {
      const controls = dialog.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex="0"]',
      );
      if (!controls?.length) return;
      const first = controls[0],
        last = controls[controls.length - 1];
      if (
        e.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === dialog.current)
      ) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
  return createPortal(
    <>
      <div className="worksheet-overlay">
        <div
          className="worksheet-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="builder-title"
          tabIndex={-1}
          ref={dialog}
          onKeyDown={keyDown}
        >
          <header className="builder-header">
            <div>
              <span className="eyebrow">
                PRO MALÉ OBJEVITELE I JEJICH RODIČE
              </span>
              <h2 id="builder-title">
                {subjectName(options.subject)} · vlastní písemka
              </h2>
            </div>
            <button
              className="icon-button"
              aria-label="Zavřít sestavení písemky"
              disabled={!!busy}
              onClick={onClose}
            >
              <X />
            </button>
          </header>
          <div className="builder-body">
            <div className="builder-steps" aria-label="Postup sestavení">
              {["Vybrat učivo", "Zvolit podobu", "Hotová písemka"].map(
                (label, i) => (
                  <span key={label} className={step === i + 1 ? "current" : ""}>
                    <b>{i + 1}</b>
                    {label}
                  </span>
                ),
              )}
            </div>
            {error && (
              <div role="alert" className="feedback bad">
                {error}
              </div>
            )}
            {step === 1 && (
              <>
                <h3>Co si chcete procvičit?</h3>
                <p className="builder-description">
                  Vyberte témata a počet příkladů. Každá písemka může být jiná.
                </p>
                <div className="selection-shortcuts">
                  <button
                    onClick={() =>
                      setCounts(
                        Object.fromEntries(
                          availableTopics.map((t) => [t.id, 2]),
                        ),
                      )
                    }
                  >
                    Vybrat všechna témata
                  </button>
                  <button onClick={() => setCounts({})}>Zrušit výběr</button>
                </div>
                <div className="builder-topics">
                  {availableTopics.map((t) => (
                    <div
                      className={
                        "builder-topic " + (counts[t.id] > 0 ? "chosen" : "")
                      }
                      key={t.id}
                    >
                      <label className="topic-checkbox">
                        <input
                          type="checkbox"
                          checked={counts[t.id] > 0}
                          onChange={(e) =>
                            setCounts({
                              ...counts,
                              [t.id]: e.target.checked ? 4 : 0,
                            })
                          }
                        />
                        <span>
                          <strong>{t.title}</strong>
                          <small>{t.description}</small>
                        </span>
                      </label>
                      {counts[t.id] > 0 && (
                        <label className="count-input">
                          <span>Počet příkladů</span>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            step={1}
                            aria-label={`Počet příkladů: ${t.title}`}
                            value={counts[t.id]}
                            onChange={(e) =>
                              setCounts({
                                ...counts,
                                [t.id]: Math.max(
                                  1,
                                  Number(e.target.value) || 1,
                                ),
                              })
                            }
                          />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
                <div className="builder-summary">
                  <span>
                    <strong>{selections.length}</strong> témat ·{" "}
                    <strong>{total}</strong> příkladů
                  </span>
                  <button
                    className="button primary"
                    disabled={!!selectionError}
                    onClick={() => setStep(2)}
                  >
                    Pokračovat <ArrowRight size={17} />
                  </button>
                </div>
                {selectionError && (
                  <p className="hint" role="status">
                    {selectionError}
                  </p>
                )}
              </>
            )}
            {step === 2 && (
              <>
                <h3>Jak chcete písemku vyplnit?</h3>
                <p className="builder-description">
                  Vybráno {selections.length} témat, celkem {total} příkladů.
                  Obě podoby používají stejná zadání.
                </p>
                <div className="mode-options">
                  <button
                    aria-pressed={mode === "online"}
                    className={mode === "online" ? "selected" : ""}
                    onClick={() => setMode("online")}
                  >
                    <Monitor size={32} />
                    <strong>Online</strong>
                    <span>Vyplňování v aplikaci a vyhodnocení na konci.</span>
                    {mode === "online" && <Check size={20} />}
                  </button>
                  <button
                    aria-pressed={mode === "paper"}
                    className={mode === "paper" ? "selected" : ""}
                    onClick={() => setMode("paper")}
                  >
                    <FileText size={32} />
                    <strong>Na papír</strong>
                    <span>
                      PDF, upravitelný Word nebo rovnou tisk. Řešení zvlášť.
                    </span>
                    {mode === "paper" && <Check size={20} />}
                  </button>
                </div>
                <div className="builder-summary">
                  <button className="button light" onClick={() => setStep(1)}>
                    <ArrowLeft size={16} /> Zpět k učivu
                  </button>
                  <button className="button primary" onClick={generate}>
                    {mode === "online"
                      ? "Vygenerovat a spustit"
                      : "Vygenerovat písemku"}{" "}
                    <ArrowRight size={17} />
                  </button>
                </div>
              </>
            )}
            {step === 3 && worksheet && (
              <>
                <div className="variant-heading">
                  <div>
                    <h3>Písemka je připravená</h3>
                    <p className="builder-description">
                      Varianta <strong>{worksheet.id}</strong> ·{" "}
                      {worksheet.sections.length} témat ·{" "}
                      {worksheetQuestions(worksheet).length} příkladů
                    </p>
                  </div>
                  <button
                    disabled={!!busy}
                    className="button light"
                    onClick={generate}
                  >
                    <RotateCcw size={16} /> Nová varianta
                  </button>
                </div>
                <div className="worksheet-actions">
                  <button
                    className="button primary"
                    disabled={!!busy}
                    onClick={() => onOnline(worksheet)}
                  >
                    <Monitor size={17} /> Spustit online
                  </button>
                  <button
                    className="button light"
                    disabled={!!busy || !pages.length}
                    onClick={() => download("pdf")}
                  >
                    <Download size={16} />
                    {busy === "pdf"
                      ? "Připravuji PDF…"
                      : `Stáhnout PDF${solutions ? " řešení" : ""}`}
                  </button>
                  <button
                    className="button light"
                    disabled={!!busy || !pages.length}
                    onClick={() => download("docx")}
                  >
                    <Download size={16} />
                    {busy === "docx"
                      ? "Připravuji Word…"
                      : `Stáhnout Word${solutions ? " řešení" : ""}`}
                  </button>
                  <button
                    className="button light"
                    disabled={!!busy || !pages.length}
                    onClick={() => window.print()}
                  >
                    <Printer size={16} /> Vytisknout{solutions ? " řešení" : ""}
                  </button>
                </div>
                <div className="preview-controls">
                  <label>
                    <input
                      type="checkbox"
                      checked={solutions}
                      disabled={!!busy}
                      onChange={(e) => setSolutions(e.target.checked)}
                    />{" "}
                    Zobrazit a stáhnout řešení pro rodiče
                  </label>
                  <span>
                    {pages.length
                      ? `${pages.length} stran${pages.length === 1 ? "a" : pages.length < 5 ? "y" : ""} A4`
                      : "Připravuji náhled…"}
                  </span>
                </div>
                <p className="hint">
                  {solutions
                    ? "Zobrazuje se samostatné řešení. Pro dětský pracovní list tuto volbu vypněte."
                    : "Zadání neobsahuje správné odpovědi. Řešení je dostupné samostatně přes přepínač výše."}{" "}
                  Stažení ani tisk zadání nemění.
                </p>
                <div
                  className="paper-scroll"
                  aria-label={
                    solutions ? "Náhled řešení pro rodiče" : "Náhled zadání"
                  }
                >
                  {pages.length ? (
                    <PaperPreview
                      worksheet={worksheet}
                      pages={pages}
                      solutions={solutions}
                    />
                  ) : (
                    <p role="status">Připravuji náhled písemky…</p>
                  )}
                </div>
                <div className="builder-summary">
                  <button
                    className="button light"
                    disabled={!!busy}
                    onClick={() => {
                      setCounts(
                        Object.fromEntries(
                          worksheet.sections.map((s) => [
                            s.topic,
                            s.questions.length,
                          ]),
                        ),
                      );
                      setStep(1);
                      setSolutions(false);
                    }}
                  >
                    Upravit výběr učiva
                  </button>
                  <button
                    className="button light"
                    disabled={!!busy}
                    onClick={onClose}
                  >
                    Hotovo <Check size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {worksheet && pages.length > 0 && (
        <div className="print-root">
          <PaperPreview
            worksheet={worksheet}
            pages={pages}
            solutions={solutions}
          />
        </div>
      )}
    </>,
    document.body,
  );
}
