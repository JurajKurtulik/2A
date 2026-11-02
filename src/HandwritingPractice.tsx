import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Printer, RefreshCw } from "lucide-react";
import { transcriptionSets } from "./banks/transcription-grade2";
import { shuffle } from "./engine";
import { PhotoReview, type ConfirmedReview } from "./photo-review/PhotoReview";
import {
  explainTranscriptionDifference,
  compareTranscription,
  type ReviewAssignment,
} from "./photo-review/contracts";
export type TranscriptionResult = ConfirmedReview & { variant: string };
function nextSet(recent: string[]) {
  const sets = shuffle(transcriptionSets);
  return (
    sets.find((s) => !recent.includes(`transcription:${s.id}`)) ??
    sets.reduce((oldest, s) =>
      recent.indexOf(`transcription:${s.id}`) >
      recent.indexOf(`transcription:${oldest.id}`)
        ? s
        : oldest,
    )
  );
}
export function HandwritingPractice({
  recent,
  onChosen,
  onComplete,
  onBack,
  onWorkingChange,
}: {
  recent: string[];
  onChosen: (key: string) => void;
  onComplete: (result: TranscriptionResult) => void;
  onBack: () => void;
  onWorkingChange: (active: boolean) => void;
}) {
  const [set, setSet] = useState(() => nextSet(recent));
  const [assignment, setAssignment] = useState<ReviewAssignment>(() =>
    makeAssignment(set),
  );
  const [result, setResult] = useState<ConfirmedReview | null>(null);
  useEffect(() => {
    onWorkingChange(!result);
    return () => onWorkingChange(false);
  }, [assignment.id, result]);
  useEffect(() => {
    onChosen(`transcription:${set.id}`);
  }, [set.id]);
  function makeAssignment(value: typeof set): ReviewAssignment {
    return {
      schemaVersion: 1,
      id: crypto.randomUUID(),
      kind: "transcription",
      grade: 2,
      subject: "czech",
      items: value.sentences.map((expectedText, i) => ({
        id: `sentence-${i + 1}`,
        expectedText,
      })),
    };
  }
  function generate() {
    if (
      !result &&
      !confirm("Připravit jiné věty? Rozpracovaná kontrola se tím opustí.")
    )
      return;
    const next = nextSet(recent);
    setSet(next);
    setAssignment(makeAssignment(next));
    setResult(null);
  }
  return (
    <section className="handwriting-practice">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={17} />
        Zpět na češtinu
      </button>
      <span className="eyebrow">ČEŠTINA · 2. TŘÍDA · PAPÍR A TUŽKA</span>
      <h1>Přepiš pět vět</h1>
      <p className="page-intro">
        Připrav si papír a tužku. Věty přepiš přesně, včetně velkých písmen,
        háčků, čárek a znamének.
      </p>
      <ol className="transcription-sentences">
        {set.sentences.map((sentence) => (
          <li key={sentence}>{sentence}</li>
        ))}
      </ol>
      <div className="handwriting-actions">
        <button className="button light" onClick={() => window.print()}>
          <Printer size={17} />
          Vytisknout / uložit jako PDF
        </button>
        <button className="button light" onClick={generate}>
          <RefreshCw size={17} />
          Jiné věty
        </button>
        <span className="hint">
          Sada {set.id.split("-").at(-1)} z {transcriptionSets.length}
        </span>
      </div>
      <PhotoReview
        key={assignment.id}
        assignment={assignment}
        onConfirmed={(confirmed) => {
          setResult(confirmed);
          onComplete({ ...confirmed, variant: assignment.id });
        }}
      />
      {result && (
        <section className="transcription-result" aria-label="Výsledek přepisu">
          <h2>
            Správně přepsané věty: {result.correct} / {result.total}
          </h2>
          <p>
            Výsledek potvrzený rodičem se uložil do tvých pokroků. Úhlednost
            písma se nehodnotí.
          </p>
          {compareTranscription(assignment, result.texts).map((row, i) => (
            <article
              key={row.id}
              className={"feedback " + (row.correct ? "good" : "bad")}
            >
              <strong>
                Věta {i + 1}:{" "}
                {row.correct ? "Povedlo se" : "Podívejme se na rozdíl"}
              </strong>
              <p>Na papíře: {row.recognizedText || "Věta nebyla přepsaná."}</p>
              {!row.correct && (
                <>
                  <p>Vzor: {row.expectedText}</p>
                  <p>
                    {explainTranscriptionDifference(
                      row.expectedText,
                      row.recognizedText,
                    )}
                  </p>
                </>
              )}
            </article>
          ))}
        </section>
      )}
      {createPortal(
        <div className="print-root">
          <article className="handwriting-paper">
            <h1>Český jazyk – přepis pěti vět</h1>
            <p>2. třída · Sada {set.id.split("-").at(-1)}</p>
            <p>Jméno: _____________________ Datum: ______________</p>
            {set.sentences.map((sentence, i) => (
              <section key={sentence}>
                <p>
                  {i + 1}. {sentence}
                </p>
                <div className="handwriting-rule" />
              </section>
            ))}
          </article>
        </div>,
        document.body,
      )}
    </section>
  );
}
