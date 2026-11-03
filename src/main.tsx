import { HandwritingPractice } from "./HandwritingPractice";
import { MobilePhotoUpload } from "./photo-review/MobilePhotoUpload";
import { readUploadLink } from "./photo-review/contracts";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Check,
  ChevronLeft,
  ChevronRight,
  Home,
  Leaf,
  RotateCcw,
  Sparkles,
  Star,
  Trophy,
  X,
  Settings,
  CheckCircle2,
} from "lucide-react";
import { topics, topicsForGrade, type Question, type Subject } from "./content";
import { isCorrect, makeSession, signature, subjectTopics } from "./engine";
import "./style.css";
import { WorksheetBuilder, type BuilderOptions } from "./WorksheetBuilder";
import {
  createWorksheet,
  subjectName,
  worksheetQuestions,
  type Worksheet,
} from "./worksheet";
import { migrateProfileNames } from "./profiles";
import { grades, getGrade, type Grade } from "./grades";
import {
  completionRecord,
  migrateHistory,
  type HistoryEntry,
} from "./progress";
type Profile = {
  name: string;
  avatar: string;
  history: HistoryEntry[];
  grade?: Grade;
  recent: string[];
};
type Data = {
  profiles: Profile[];
  active: number;
  profileNamesVersion?: number;
};
const initial: Data = {
  profiles: [
    { name: "Terezka", avatar: "🦊", history: [], recent: [] },
    { name: "Nelinka", avatar: "🐰", history: [], recent: [] },
  ],
  active: 0,
  profileNamesVersion: 1,
};
function readData(): Data {
  try {
    const d = JSON.parse(localStorage.getItem("skola-hrou-v1") || "null");
    if (
      d?.profiles?.length === 2 &&
      d.profiles.every(
        (p: Profile) =>
          typeof p.name === "string" &&
          Array.isArray(p.history) &&
          Array.isArray(p.recent),
      ) &&
      (d.active === 0 || d.active === 1)
    )
      return {
        ...migrateProfileNames(d),
        profiles: migrateProfileNames(d).profiles.map((p: Profile) => ({
          ...p,
          grade: getGrade(p.grade),
          history: p.history.map(migrateHistory),
        })),
      };
  } catch {}
  return initial;
}
type Session = {
  grade: Grade;
  worksheet?: Worksheet;
  questions: Question[];
  answers: Record<string, string>;
  firstAnswers: Record<string, string>;
  label: string;
  test: boolean;
  index: number;
  done: boolean;
  checked: Record<string, boolean>;
};
function App() {
  const [data, setData] = useState<Data>(readData),
    [page, setPage] = useState("home"),
    [session, setSession] = useState<Session | null>(null),
    [settings, setSettings] = useState(false),
    [storageError, setStorageError] = useState(false),
    [dragIndex, setDragIndex] = useState<number | null>(null);
  const [builder, setBuilder] = useState<BuilderOptions | null>(null),
    [lastWorksheet, setLastWorksheet] = useState<Worksheet | null>(null);
  const [handwritingDirty, setHandwritingDirty] = useState(false);
  const hasUnfinished = Boolean(session && !session.done) || handwritingDirty;
  const profile = data.profiles[data.active];
  const grade = getGrade(profile.grade);
  const currentTopics = topicsForGrade(grade);
  const currentHistory = profile.history.filter((h) => h.grade === grade);
  const [historyFilter, setHistoryFilter] = useState<
    "all" | "practice" | "test"
  >("all");
  const visibleHistory = currentHistory.filter(
    (h) => historyFilter === "all" || h.kind === historyFilter,
  );
  useEffect(() => {
    try {
      localStorage.setItem("skola-hrou-v1", JSON.stringify(data));
    } catch {
      setStorageError(true);
    }
  }, []);
  function persist(next: Data) {
    setData(next);
    try {
      localStorage.setItem("skola-hrou-v1", JSON.stringify(next));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }
  function updateProfile(p: Profile) {
    persist({
      ...data,
      profiles: data.profiles.map((v, i) => (i === data.active ? p : v)),
    });
  }
  function navigate(next: string) {
    if (
      hasUnfinished &&
      !window.confirm("Odejít ze cvičení? Rozpracované odpovědi se neuloží.")
    )
      return;
    setSession(null);
    setHandwritingDirty(false);
    setPage(next);
    window.scrollTo(0, 0);
  }
  function start(ids: string[], label: string, test = false, count = 8) {
    if (
      !ids.length ||
      ids.some((id) => !currentTopics.some((t) => t.id === id))
    )
      return;
    const questions = makeSession(ids, count, profile.recent);
    beginSession(questions, label, test);
  }
  function beginSession(
    questions: Question[],
    label: string,
    test: boolean,
    worksheet?: Worksheet,
  ) {
    setSession({
      grade: getGrade(worksheet?.grade ?? grade),
      worksheet,
      questions,
      answers: {},
      firstAnswers: {},
      label,
      test,
      index: 0,
      done: false,
      checked: {},
    });
    updateProfile({
      ...profile,
      recent: [...questions.map(signature), ...profile.recent].slice(0, 2000),
    });
    window.scrollTo(0, 0);
  }
  function startWorksheet(w: Worksheet) {
    setBuilder(null);
    setLastWorksheet(w);
    beginSession(
      worksheetQuestions(w),
      `${subjectName(w.subject)} · varianta ${w.id}`,
      true,
      w,
    );
  }
  function answer(value: string) {
    if (!session) return;
    setSession({
      ...session,
      answers: {
        ...session.answers,
        [session.questions[session.index].id]: value,
      },
      checked: {
        ...session.checked,
        [session.questions[session.index].id]: false,
      },
    });
  }
  function checkAnswer() {
    if (!session || session.test || session.done) return;
    const id = session.questions[session.index].id;
    setSession({
      ...session,
      checked: { ...session.checked, [id]: true },
      firstAnswers: {
        ...session.firstAnswers,
        [id]: session.firstAnswers[id] ?? session.answers[id] ?? "",
      },
    });
  }
  function advanceExercise() {
    if (!session || session.done) return;
    const question = session.questions[session.index];
    if (!session.test && !session.checked[question.id]) {
      checkAnswer();
    } else if (session.index < session.questions.length - 1) {
      setSession({ ...session, index: session.index + 1 });
    } else {
      submit();
    }
  }
  const totalCompleted = currentHistory.length,
    totalCorrect = currentHistory.reduce((n, h) => n + h.score, 0);
  function mascot() {
    return (
      <div className="mascot" aria-hidden="true">
        <div className="orbit one">✦</div>
        <div className="orbit two">✧</div>
        <div className="owl">
          <div className="ear left" />
          <div className="ear right" />
          <div className="face">
            <span className="eye">●</span>
            <span className="eye">●</span>
            <span className="beak" />
          </div>
          <div className="wing" />
          <div className="book">
            A<span>＋</span>
          </div>
        </div>
        <span className="mascot-label">Malé kroky. Velké objevy.</span>
      </div>
    );
  }
  function topicCards(subject: Subject) {
    if (!topicsForGrade(grade, subject).length)
      return (
        <div className="empty">
          <span>🌱</span>
          <h2>Tady brzy přibude nové učivo</h2>
          <p>Pro tento předmět v {grade}. třídě zatím nemáme cvičení.</p>
        </div>
      );
    return (
      <div className="topic-grid">
        {currentTopics
          .filter((t) => t.subject === subject)
          .map((t) => (
            <button
              key={t.id}
              className={"topic-card " + subject}
              onClick={() => start([t.id], t.title)}
            >
              <span className="topic-icon">{t.icon}</span>
              <span className="topic-info">
                <strong>{t.title}</strong>
                <small>{t.description}</small>
                <span className="tag">8 úloh · vlastním tempem</span>
              </span>
              <ArrowRight size={19} />
            </button>
          ))}
      </div>
    );
  }
  function renderQuestion(q: Question, value: string) {
    if (q.kind === "input")
      return (
        <label className="input-label">
          Tvoje odpověď
          <input
            autoFocus
            key={q.id}
            className="number-input"
            inputMode="numeric"
            autoComplete="off"
            value={value}
            onChange={(e) => answer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !session?.test) advanceExercise();
            }}
            placeholder="?"
            aria-label="Tvoje odpověď"
          />
        </label>
      );
    if (q.kind === "choice")
      return (
        <div className="choices">
          {q.choices?.map((c) => (
            <button
              key={c}
              className={"choice " + (value === c ? "selected" : "")}
              aria-pressed={value === c}
              onClick={() => answer(c)}
            >
              {c}
              {value === c && <Check size={20} />}
            </button>
          ))}
        </div>
      );
    if (q.kind === "syllables") {
      const letters = [...(q.text || "")];
      const selected = new Set<number>();
      let n = 0;
      for (const c of value) {
        if (c === "|") selected.add(n);
        else n++;
      }
      return (
        <div className="syllable-word">
          {letters.map((letter, i) => (
            <React.Fragment key={i}>
              <span>{letter}</span>
              {i < letters.length - 1 && (
                <button
                  aria-label={`Hranice slabiky za ${i + 1}. písmenem`}
                  aria-pressed={selected.has(i + 1)}
                  className={"split " + (selected.has(i + 1) ? "active" : "")}
                  onClick={() => {
                    selected.has(i + 1)
                      ? selected.delete(i + 1)
                      : selected.add(i + 1);
                    answer(
                      letters
                        .map((l, j) => l + (selected.has(j + 1) ? "|" : ""))
                        .join(""),
                    );
                  }}
                >
                  {selected.has(i + 1) ? "|" : "·"}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      );
    }
    if (q.kind === "case") {
      const words = value ? value.split(" ") : q.tokens || [];
      return (
        <div className="word-bank">
          {words.map((word, i) => (
            <button
              key={i}
              className="word"
              onClick={() =>
                answer(
                  words
                    .map((w, j) =>
                      j === i
                        ? (w[0] === w[0].toUpperCase()
                            ? w[0].toLowerCase()
                            : w[0].toUpperCase()) + w.slice(1)
                        : w,
                    )
                    .join(" "),
                )
              }
            >
              {word}
            </button>
          ))}
        </div>
      );
    }
    const selected = value ? (JSON.parse(value) as number[]) : [];
    function saveOrder(order: number[]) {
      answer(JSON.stringify(order));
    }
    return (
      <>
        <div className="order-target" aria-label="Sestavené pořadí">
          {selected.length === 0 && <span>Sem poskládej slova ↓</span>}
          {selected.map((idx, pos) => (
            <button
              key={idx}
              className="word placed"
              draggable
              onDragStart={() => setDragIndex(pos)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) {
                  const next = [...selected];
                  next.splice(pos, 0, next.splice(dragIndex, 1)[0]);
                  saveOrder(next);
                  setDragIndex(null);
                }
              }}
              onClick={() => saveOrder(selected.filter((i) => i !== idx))}
              title="Kliknutím vrátíš slovo do nabídky"
            >
              {q.tokens![idx]}
            </button>
          ))}
        </div>
        <div className="word-bank">
          {q.tokens?.map((word, idx) => (
            <button
              key={idx}
              className="word"
              disabled={selected.includes(idx)}
              onClick={() => saveOrder([...selected, idx])}
            >
              {word}
            </button>
          ))}
        </div>
        <p className="hint">
          Klikni na slova v pořadí. Kliknutím nahoře je vrátíš zpět. Sestavená
          slova můžeš také přetahovat.
        </p>
      </>
    );
  }
  function decoded(q: Question, value: string) {
    if (q.kind === "order") {
      try {
        const words = (JSON.parse(value) as number[])
          .map((i) => q.tokens![i])
          .join(" ");
        return q.topic === "wordorder" && words
          ? words[0].toLocaleUpperCase("cs") + words.slice(1) + "."
          : words;
      } catch {
        return "";
      }
    }
    return value;
  }
  const correct = (q: Question) =>
    isCorrect(q, decoded(q, session?.answers[q.id] || ""));
  // All evaluation paths use the displayed words rather than internal token indices.
  function submit() {
    if (!session || session.done) return;
    const decodedAnswers = Object.fromEntries(
      session.questions.map((q) => [
        q.id,
        decoded(q, session.answers[q.id] || ""),
      ]),
    );
    const unanswered = Object.values(decodedAnswers).filter((v) => !v).length;
    if (
      unanswered &&
      !confirm(`Zbývá ${unanswered} nevyplněných úloh. Přesto vyhodnotit?`)
    )
      return;
    updateProfile({
      ...profile,
      history: [
        completionRecord({
          label: session.label,
          test: session.test,
          grade: session.grade,
          variant: session.worksheet?.id,
          questions: session.questions,
          answers: decodedAnswers,
          firstAnswers: Object.fromEntries(
            Object.entries(session.firstAnswers).map(([id, value]) => [
              id,
              decoded(
                session.questions.find((q) => q.id === id)!,
                value,
              ),
            ]),
          ),
        }),
        ...profile.history,
      ],
    });
    setSession({ ...session, done: true });
    window.scrollTo(0, 0);
  }
  function changeGrade(value: string) {
    if (
      hasUnfinished &&
      !confirm("Změnou třídy opustíš rozpracované cvičení. Pokračovat?")
    )
      return;
    setSession(null);
    setHandwritingDirty(false);
    setBuilder(null);
    setHistoryFilter("all");
    updateProfile({ ...profile, grade: getGrade(Number(value)) });
  }
  function gradeSelect(id: string) {
    return (
      <label className="grade-picker" htmlFor={id}>
        <span>Třída</span>
        <select
          id={id}
          value={grade}
          onChange={(e) => changeGrade(e.target.value)}
        >
          {grades.map((g) => (
            <option key={g} value={g}>
              {g}. třída
            </option>
          ))}
        </select>
      </label>
    );
  }
  function emptyGrade() {
    return (
      <section className="empty grade-empty">
        <span>🌱</span>
        <h2>{grade}. třída teprve vyroste</h2>
        <p>
          Pro tento ročník zatím nemáme učivo. Nová témata sem budeme postupně
          přidávat.
        </p>
        <button className="button light" onClick={() => changeGrade("2")}>
          Přejít na 2. třídu <ArrowRight size={16} />
        </button>
      </section>
    );
  }
  const nav = [
    ["home", "Doma", Home],
    ["math", "Matematika", Calculator],
    ["czech", "Čeština", BookOpen],
    ["tests", "Zkus si písemku", Sparkles],
    ["progress", "Moje pokroky", Trophy],
  ] as const;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => navigate("home")}>
          <span className="brand-icon">
            <Leaf size={24} />
          </span>
          <span>
            škola
            <span className="brand-second">
              hrou<span className="brand-dot">.</span>
            </span>
          </span>
        </button>
        <span className="workspace-label">MALÍ OBJEVITELÉ</span>
        <nav>
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={(page === id ? "active " : "") + "nav-item"}
              onClick={() => navigate(id)}
            >
              <Icon size={21} />
              {label}
              {page === id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="class-badge">
            <div>
              {gradeSelect("sidebar-grade")}
              <small>Každý den o kousek dál</small>
            </div>
          </div>
          <button className="settings-link" onClick={() => setSettings(true)}>
            <Settings size={17} /> Profily a nastavení
          </button>
          <p>Vytvořeno pro radost z učení ♡</p>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Naše škola <ChevronRight size={14} />
            <strong>
              {session
                ? "Cvičení"
                : page === "handwriting"
                  ? "Přepis vět"
                  : nav.find((n) => n[0] === page)?.[1]}
            </strong>
          </div>
          <div className="topbar-right">
            <div className="mobile-grade">{gradeSelect("mobile-grade")}</div>
            <span className="star-count">
              <Star size={17} fill="currentColor" /> {totalCorrect}{" "}
              <span>objevů</span>
            </span>
            <button
              className="profile-button"
              onClick={() => setSettings(true)}
            >
              <span>{profile.avatar}</span>
              <span>{profile.name}</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </header>
        <main>
          {storageError && (
            <div role="alert" className="feedback bad">
              Prohlížeč nepovolil uložení pokroku. Cvičení funguje, ale výsledek
              po zavření nezůstane uložený.
            </div>
          )}
          {!session &&
            !currentTopics.length &&
            page !== "progress" &&
            emptyGrade()}
          {!session && currentTopics.length > 0 && page === "home" && (
            <>
              <div className="welcome-line">
                <span className="eyebrow">TVŮJ MALÝ SVĚT VELKÝCH OBJEVŮ</span>
                <span className="date-label">Učivo pro {grade}. třídu</span>
              </div>
              <section className="hero">
                <div className="hero-copy">
                  <span className="pill">
                    <span /> Každý pokus se počítá
                  </span>
                  <h1>
                    Ahoj, objevitelko!
                    <br />
                    Co dnes <em>prozkoumáme?</em>
                  </h1>
                  <p>
                    Trochu počítání, pár slov a spousta nových objevů.
                    <br className="desktop" /> Vyber si, na co máš dnes chuť.
                  </p>
                  <button
                    className="button primary"
                    disabled={!subjectTopics("math", grade).length}
                    onClick={() =>
                      start(
                        subjectTopics("math", grade),
                        "Malá matematická rozcvička",
                        false,
                        6,
                      )
                    }
                  >
                    Dáme si rozcvičku <ArrowRight size={18} />
                  </button>
                  <span className="hero-note">
                    Jen 6 úloh. A zvládneš je svým tempem.
                  </span>
                </div>
                {mascot()}
              </section>
              <div className="section-heading">
                <div>
                  <h2>Kam se dnes vydáme?</h2>
                  <p>Vyber si svou dnešní cestu za poznáním.</p>
                </div>
                <span className="section-meta">DVĚ CESTY, SPOUSTA OBJEVŮ</span>
              </div>
              <div className="subject-grid">
                <button
                  className="subject-card math"
                  onClick={() => navigate("math")}
                >
                  <span className="subject-art math-art">
                    <span>＋</span>
                    <span>7</span>
                    <span>＝</span>
                  </span>
                  <span className="subject-kicker">SVĚT ČÍSEL</span>
                  <h3>Matematika</h3>
                  <p>
                    Počítej, doplňuj a rozlouskni
                    <br />
                    malé číselné záhady.
                  </p>
                  <span className="subject-footer">
                    {topicsForGrade(grade, "math").length} okruhů k objevování{" "}
                    <span className="round-arrow">
                      <ArrowRight size={20} />
                    </span>
                  </span>
                </button>
                <button
                  className="subject-card czech"
                  onClick={() => navigate("czech")}
                >
                  <span className="subject-art czech-art">
                    <span>A</span>
                    <span>č</span>
                    <span>ě</span>
                  </span>
                  <span className="subject-kicker">SVĚT SLOV</span>
                  <h3>Český jazyk</h3>
                  <p>
                    Hraj si s písmenky, skládej slova
                    <br />a objevuj kouzlo vět.
                  </p>
                  <span className="subject-footer">
                    {topicsForGrade(grade, "czech").length} okruhů k objevování{" "}
                    <span className="round-arrow">
                      <ArrowRight size={20} />
                    </span>
                  </span>
                </button>
              </div>
              <section className="test-banner">
                <div className="banner-icon">
                  <Sparkles size={25} />
                </div>
                <div>
                  <span className="eyebrow">
                    MALÁ VÝZVA PRO VELKÉ OBJEVITELE
                  </span>
                  <h3>Co už všechno umíš?</h3>
                  <p>
                    Zkus si cvičnou písemku. V klidu, bez známek a vlastním
                    tempem.
                  </p>
                </div>
                <button
                  className="button light"
                  onClick={() => navigate("tests")}
                >
                  Vybrat písemku <ArrowRight size={17} />
                </button>
              </section>
              <div className="daily-note">
                <Leaf size={19} />
                <p>
                  <strong>Nemusí se všechno povést napoprvé.</strong> Každá
                  chyba nám ukazuje, co můžeme ještě objevit.
                </p>
              </div>
            </>
          )}
          {!session &&
            currentTopics.length > 0 &&
            (page === "math" || page === "czech") && (
              <>
                <span className="eyebrow">VYBER SI SVÉ DOBRODRUŽSTVÍ</span>
                <h1>{page === "math" ? "Svět čísel" : "Svět slov"}</h1>
                <p className="page-intro">
                  Jedno téma, pár úloh a zase budeš o kousek dál. Kam se
                  pustíme?
                </p>
                {topicCards(page)}
                {page === "czech" && grade === 2 && (
                  <button
                    className="topic-card czech handwriting-card"
                    onClick={() => navigate("handwriting")}
                  >
                    <span className="topic-icon">✍️</span>
                    <span className="topic-info">
                      <strong>Přepis na papír</strong>
                      <small>
                        Pět vět, papír a tužka. Vyfoť přepis a zobraz automatickou kontrolu.
                      </small>
                      <span className="tag">50 sad · 5 vět</span>
                    </span>
                    <ArrowRight size={19} />
                  </button>
                )}
              </>
            )}
          {!session && page === "handwriting" && grade === 2 && (
            <HandwritingPractice
              key={`${data.active}-${grade}`}
              recent={profile.recent}
              onWorkingChange={setHandwritingDirty}
              onChosen={(key) =>
                updateProfile({
                  ...profile,
                  recent: [
                    key,
                    ...profile.recent.filter((r) => r !== key),
                  ].slice(0, 2000),
                })
              }
              onBack={() => navigate("czech")}
              onComplete={(result) => {
                if (profile.history.some((h) => h.variant === result.variant))
                  return;
                updateProfile({
                  ...profile,
                  history: [
                    {
                      date: new Date().toISOString(),
                      label: "Přepis pěti vět · automatická kontrola z fotky",
                      kind: "practice",
                      grade: 2,
                      variant: result.variant,
                      score: result.correct,
                      total: result.total,
                      topics: [
                        {
                          id: "g2-czech-transcription",
                          right: result.correct,
                          total: result.total,
                        },
                      ],
                    },
                    ...profile.history,
                  ],
                });
              }}
            />
          )}
          {!session && currentTopics.length > 0 && page === "tests" && (
            <>
              <span className="eyebrow">V KLIDU A BEZ ZNÁMEK</span>
              <h1>Zkus si písemku</h1>
              <p className="page-intro">
                Vyber si učivo a počet příkladů. Písemku můžeš vyplnit online
                nebo stáhnout a vytisknout.
              </p>
              <div className="test-grid">
                {(["math", "czech"] as Subject[])
                  .filter((s) => topicsForGrade(grade, s).length > 0)
                  .map((s) => (
                    <section className={"test-card " + s} key={s}>
                      <span className="topic-icon">
                        {s === "math" ? "＋" : "Aa"}
                      </span>
                      <h2>{s === "math" ? "Matematika" : "Český jazyk"}</h2>
                      <p>Cvičná písemka · {grade}. třída</p>
                      <ul>
                        {currentTopics
                          .filter((t) => t.subject === s)
                          .map((t) => (
                            <li key={t.id}>{t.title}</li>
                          ))}
                      </ul>
                      <button
                        className="button primary"
                        onClick={() =>
                          setBuilder({ grade, subject: s, preset: "custom" })
                        }
                      >
                        Sestavit vlastní písemku <ArrowRight size={16} />
                      </button>
                      <div className="test-presets">
                        <span>Rychlé předvolby · výběr lze upravit</span>
                        <button
                          className="button light"
                          onClick={() =>
                            setBuilder({ grade, subject: s, preset: "short" })
                          }
                        >
                          Krátká · {topicsForGrade(grade, s).length * 2}{" "}
                          příkladů
                        </button>
                        <button
                          className="button light"
                          onClick={() =>
                            setBuilder({ grade, subject: s, preset: "long" })
                          }
                        >
                          Delší ·{" "}
                          {topicsForGrade(grade, s).length *
                            (s === "math" ? 4 : 3)}{" "}
                          příkladů
                        </button>
                      </div>
                    </section>
                  ))}
              </div>
            </>
          )}
          {!session &&
            page === "tests" &&
            lastWorksheet &&
            getGrade(lastWorksheet.grade) === grade && (
              <section className="saved-worksheet">
                <div>
                  <strong>Poslední sestavená písemka</strong>
                  <p>
                    {subjectName(lastWorksheet.subject)} · varianta{" "}
                    {lastWorksheet.id} ·{" "}
                    {worksheetQuestions(lastWorksheet).length} příkladů
                  </p>
                </div>
                <button
                  className="button light"
                  onClick={() =>
                    setBuilder({
                      subject: lastWorksheet.subject,
                      preset: "custom",
                      worksheet: lastWorksheet,
                    })
                  }
                >
                  Otevřít zadání a exporty <ArrowRight size={16} />
                </button>
              </section>
            )}
          {!session && page === "progress" && (
            <>
              <span className="eyebrow">KAŽDÝ MALÝ KROK JE VIDĚT</span>
              <h1>Tvoje objevy</h1>
              <p className="page-intro">
                Tady najdeš, co už se ti povedlo a co ještě můžeš zkusit.
              </p>
              <div className="stats">
                <div>
                  <Trophy />
                  <strong>{totalCompleted}</strong>
                  <span>dokončených dobrodružství</span>
                </div>
                <div>
                  <Star />
                  <strong>{totalCorrect}</strong>
                  <span>správných odpovědí</span>
                </div>
                <div>
                  <Leaf />
                  <strong>
                    {
                      new Set(
                        currentHistory.flatMap((h) =>
                          h.topics.map((t) => t.id),
                        ),
                      ).size
                    }
                  </strong>
                  <span>prozkoumaných témat</span>
                </div>
              </div>
              {!currentHistory.length ? (
                <div className="empty">
                  <span>🌱</span>
                  <h2>Tvoje cesta právě začíná</h2>
                  <p>
                    Dokonči cvičení nebo online písemku a výsledek se objeví
                    tady.
                  </p>
                  <button
                    className="button primary"
                    onClick={() => navigate("math")}
                  >
                    Začít objevovat <ArrowRight size={17} />
                  </button>
                </div>
              ) : (
                <>
                  <h2>Co ještě procvičit?</h2>
                  <div className="review-topics">
                    {currentTopics
                      .filter((t) =>
                        currentHistory.some((h) =>
                          h.topics.some(
                            (r) => r.id === t.id && r.right < r.total,
                          ),
                        ),
                      )
                      .map((t) => (
                        <button
                          className="button light"
                          key={t.id}
                          onClick={() => start([t.id], t.title)}
                        >
                          {t.title}
                          <RotateCcw size={15} />
                        </button>
                      ))}
                  </div>
                  <h2>Poslední dobrodružství · {grade}. třída</h2>
                  <div
                    className="history-filters"
                    aria-label="Druh dokončené aktivity"
                  >
                    {(
                      [
                        ["all", "Vše"],
                        ["practice", "Cvičení"],
                        ["test", "Písemky"],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        className="button light"
                        aria-pressed={historyFilter === key}
                        key={key}
                        onClick={() => setHistoryFilter(key)}
                      >
                        {label} (
                        {
                          currentHistory.filter(
                            (h) => key === "all" || h.kind === key,
                          ).length
                        }
                        )
                      </button>
                    ))}
                  </div>
                  {!visibleHistory.length && (
                    <p className="hint">
                      Zatím nemáš dokončenou aktivitu tohoto druhu.
                    </p>
                  )}
                  <div className="history">
                    {visibleHistory.map((h, i) => (
                      <div key={i}>
                        <span className="history-icon">
                          <CheckCircle2 size={20} />
                        </span>
                        <span>
                          <strong>{h.label}</strong>
                          <small>
                            {h.kind === "test" ? "Písemka" : "Cvičení"} ·{" "}
                            {h.grade}. třída ·{" "}
                            {new Date(h.date).toLocaleDateString("cs-CZ")}
                          </small>
                        </span>
                        <b>
                          {h.score} / {h.total}
                          {h.correctedScore !== undefined &&
                            h.correctedScore !== h.score && (
                              <small>
                                Po opravě: {h.correctedScore} / {h.total}
                              </small>
                            )}
                        </b>
                      </div>
                    ))}
                  </div>
                </>
              )}
              <p className="hint">
                Přehled zachovává výsledek před nápovědou i po opravě. Pokrok je
                uložený jen v tomto prohlížeči pro profil {profile.name}.
                Smazáním dat prohlížeče se odstraní.
              </p>
            </>
          )}
          {session &&
            !session.done &&
            (() => {
              const q = session.questions[session.index],
                value = session.answers[q.id] || "",
                checked = session.checked[q.id];
              return (
                <section className="exercise">
                  <button className="back-link" onClick={() => navigate(page)}>
                    <ChevronLeft size={17} /> Zpět na výběr
                  </button>
                  <div className="exercise-top">
                    <span className="eyebrow">
                      {session.test ? "CVIČNÁ PÍSEMKA" : "MALÉ PROCVIČOVÁNÍ"}
                    </span>
                    <span>
                      {session.index + 1} / {session.questions.length}
                    </span>
                  </div>
                  <h2>{session.label}</h2>
                  <div className="progress-track">
                    <span
                      style={{
                        width: `${((session.index + 1) / session.questions.length) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="question-card" key={q.id}>
                    <span className="tag">
                      {topics.find((t) => t.id === q.topic)?.title}
                    </span>
                    <h1 className="question-prompt">{q.prompt}</h1>
                    {q.text && q.kind !== "syllables" && (
                      <p className="question-text">{q.text}</p>
                    )}
                    {renderQuestion(q, value)}
                    {checked && !session.test && (
                      <div
                        role="status"
                        className={"feedback " + (correct(q) ? "good" : "bad")}
                      >
                        <strong>
                          {correct(q)
                            ? "Výborně, to se povedlo!"
                            : "Pojďme na to společně."}
                        </strong>
                        <p>{q.explanation}</p>
                        {!correct(q) && (
                          <p>
                            Správná odpověď: <strong>{q.answers[0]}</strong>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="exercise-actions">
                    <button
                      className="button light"
                      disabled={session.index === 0}
                      onClick={() =>
                        setSession({ ...session, index: session.index - 1 })
                      }
                    >
                      <ChevronLeft size={16} /> Předchozí
                    </button>
                    <button
                      className={
                        "button " +
                        (!session.test && !checked ? "check-answer" : "primary")
                      }
                      onClick={advanceExercise}
                    >
                      {!session.test && !checked ? (
                        <>
                          Zkontrolovat <Check size={16} />
                        </>
                      ) : session.index < session.questions.length - 1 ? (
                        <>
                          Další úloha <ArrowRight size={17} />
                        </>
                      ) : (
                        <>
                          Vyhodnotit <Sparkles size={17} />
                        </>
                      )}
                    </button>
                  </div>
                  <div className="question-dots" aria-label="Přejít na úlohu">
                    {session.questions.map((item, i) => (
                      <button
                        key={item.id}
                        aria-label={`Úloha ${i + 1}`}
                        aria-current={session.index === i ? "step" : undefined}
                        className={
                          (session.index === i ? "current " : "") +
                          (session.answers[item.id] ? "answered" : "")
                        }
                        onClick={() => setSession({ ...session, index: i })}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <p className="hint">
                    {session.test
                      ? "Všechna řešení uvidíš po vyhodnocení. Nemusíš nikam spěchat."
                      : "Chyba nevadí. Podívej se na vysvětlení a zkus odpověď opravit."}
                  </p>
                </section>
              );
            })()}
          {session?.done && (
            <section className="results">
              <div className="result-celebration">🎉</div>
              <span className="eyebrow">DALŠÍ DOBRODRUŽSTVÍ ZA TEBOU</span>
              <h1>
                {session.questions.every(correct)
                  ? "To se ti povedlo!"
                  : "Dobrý kus práce!"}
              </h1>
              <p className="page-intro">{session.label}</p>
              <div className="result-score">
                <strong>
                  {session.questions.filter(correct).length}
                  <small> / {session.questions.length}</small>
                </strong>
                <span>správných odpovědí</span>
              </div>
              {!session.test &&
                Object.keys(session.firstAnswers).length > 0 && (
                  <p className="hint">
                    Před nápovědou:{" "}
                    {
                      session.questions.filter((q) =>
                        isCorrect(
                          q,
                          decoded(
                            q,
                            session.firstAnswers[q.id] ??
                              session.answers[q.id] ??
                              "",
                          ),
                        ),
                      ).length
                    }{" "}
                    / {session.questions.length} · Po opravě:{" "}
                    {session.questions.filter(correct).length} /{" "}
                    {session.questions.length}
                  </p>
                )}
              <div className="result-buttons">
                {" "}
                {session.worksheet && (
                  <button
                    className="button light"
                    onClick={() =>
                      setBuilder({
                        subject: session.worksheet!.subject,
                        preset: "custom",
                        worksheet: session.worksheet,
                      })
                    }
                  >
                    Stejné zadání na papír <ArrowRight size={16} />
                  </button>
                )}
                {session.questions.some((q) => !correct(q)) && (
                  <button
                    className="button primary"
                    onClick={() =>
                      start(
                        [
                          ...new Set(
                            session.questions
                              .filter((q) => !correct(q))
                              .map((q) => q.topic),
                          ),
                        ],
                        "Procvičování obtížnějších témat",
                        false,
                        8,
                      )
                    }
                  >
                    Procvičit chyby <RotateCcw size={17} />
                  </button>
                )}
                <button
                  className="button light"
                  onClick={() =>
                    session.worksheet
                      ? startWorksheet(
                          createWorksheet(
                            session.worksheet.subject,
                            session.worksheet.sections.map((s) => ({
                              topic: s.topic,
                              count: s.questions.length,
                            })),
                            profile.recent,
                            grade,
                          ),
                        )
                      : start(
                          [...new Set(session.questions.map((q) => q.topic))],
                          session.label,
                          session.test,
                          session.questions.length,
                        )
                  }
                >
                  Nová varianta <Sparkles size={17} />
                </button>
                <button
                  className="button light"
                  onClick={() => navigate("home")}
                >
                  Domů <Home size={16} />
                </button>
              </div>
              <h2>Jak se dařilo v jednotlivých tématech?</h2>
              <div className="topic-results">
                {[...new Set(session.questions.map((q) => q.topic))].map(
                  (id) => {
                    const qs = session.questions.filter((q) => q.topic === id);
                    return (
                      <div key={id}>
                        <span>{topics.find((t) => t.id === id)?.title}</span>
                        <b>
                          {qs.filter(correct).length} / {qs.length}
                        </b>
                      </div>
                    );
                  },
                )}
              </div>
              <h2>Podívejme se na řešení</h2>
              <div className="answer-review">
                {session.questions.map((q, i) => (
                  <article
                    key={q.id}
                    className={correct(q) ? "right" : "wrong"}
                  >
                    <span className="review-status">
                      {correct(q) ? <Check size={19} /> : <X size={19} />}
                    </span>
                    <div>
                      <strong>
                        {i + 1}. {q.prompt}
                      </strong>
                      {q.text && <p>{q.text}</p>}
                      <p>
                        Tvoje odpověď:{" "}
                        <b>
                          {decoded(q, session.answers[q.id] || "") ||
                            "Nevyplněno"}
                        </b>
                      </p>
                      {!correct(q) && (
                        <p>
                          Správně: <b>{q.answers[0]}</b>
                        </p>
                      )}
                      <small>{q.explanation}</small>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>
        <footer>
          <span>
            Škola hrou <span className="footer-dot">●</span> Pro malé zvídavé
            hlavy
          </span>
          <span>Vlastním tempem. S radostí.</span>
        </footer>
      </div>
      {builder && (
        <WorksheetBuilder
          options={builder}
          recent={profile.recent}
          onClose={() => setBuilder(null)}
          onGenerated={(w) => {
            setLastWorksheet(w);
            updateProfile({
              ...profile,
              recent: [
                ...worksheetQuestions(w).map(signature),
                ...profile.recent,
              ].slice(0, 2000),
            });
          }}
          onOnline={startWorksheet}
        />
      )}
      {settings && (
        <div className="modal-overlay" onClick={() => setSettings(false)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Zavřít"
              onClick={() => setSettings(false)}
            >
              <X />
            </button>
            <h2 id="settings-title">Kdo dnes objevuje?</h2>
            <p>Každý má svůj pokrok v tomto prohlížeči.</p>
            {data.profiles.map((p, i) => (
              <div
                className={"profile-row " + (i === data.active ? "chosen" : "")}
                key={i}
              >
                <button
                  className="avatar-select"
                  aria-label={`Vybrat profil ${p.name}`}
                  onClick={() => {
                    if (
                      hasUnfinished &&
                      !confirm(
                        "Změnou profilu opustíš rozpracované cvičení. Pokračovat?",
                      )
                    )
                      return;
                    setSession(null);
                    setHandwritingDirty(false);
                    persist({ ...data, active: i });
                    setSettings(false);
                  }}
                >
                  {p.avatar}
                </button>
                <label>
                  Přezdívka
                  <input
                    maxLength={24}
                    value={p.name}
                    onChange={(e) =>
                      persist({
                        ...data,
                        profiles: data.profiles.map((v, j) =>
                          i === j ? { ...v, name: e.target.value } : v,
                        ),
                      })
                    }
                  />
                </label>
                {i === data.active && <Check size={20} />}
              </div>
            ))}
            <p className="hint">
              Profily nepotřebují účet. Výsledky zůstávají na tomto zařízení.
            </p>
            <button
              className="button light"
              onClick={() => {
                if (
                  confirm(
                    `Opravdu smazat pokrok profilu ${profile.name}? Tuto akci nelze vrátit.`,
                  )
                ) {
                  updateProfile({ ...profile, history: [], recent: [] });
                  setSettings(false);
                }
              }}
            >
              Smazat pokrok aktivního profilu
            </button>
            <button
              className="button primary"
              onClick={() => setSettings(false)}
            >
              Hotovo <Check size={16} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
function Entry() {
  const [route] = useState(() => {
    try {
      return { upload: readUploadLink(location.hash) };
    } catch {
      return {
        upload: null,
        error: "Odkaz pro nahrání fotky není platný. Naskenuj nový QR kód.",
      };
    }
  });
  if (route.error)
    return (
      <main className="mobile-photo">
        <h1>Propojení se nepodařilo</h1>
        <p role="alert">{route.error}</p>
      </main>
    );
  return route.upload ? (
    <MobilePhotoUpload id={route.upload.id} token={route.upload.token} />
  ) : (
    <App />
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Entry />
  </React.StrictMode>,
);
