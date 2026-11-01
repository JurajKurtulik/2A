import React, { useState } from "react";
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
import { topics, type Question, type Subject } from "./content";
import { isCorrect, makeSession, signature, subjectTopics } from "./engine";
import "./style.css";
type RecordEntry = {
  date: string;
  label: string;
  score: number;
  correctedScore?: number;
  total: number;
  topics: { id: string; right: number; total: number }[];
};
type Profile = {
  name: string;
  avatar: string;
  history: RecordEntry[];
  recent: string[];
};
type Data = { profiles: Profile[]; active: number };
const initial: Data = {
  profiles: [
    { name: "První průzkumnice", avatar: "🦊", history: [], recent: [] },
    { name: "Druhá průzkumnice", avatar: "🐰", history: [], recent: [] },
  ],
  active: 0,
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
      return d;
  } catch {}
  return initial;
}
type Session = {
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
  const profile = data.profiles[data.active];
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
      session &&
      !session.done &&
      !window.confirm("Odejít ze cvičení? Rozpracované odpovědi se neuloží.")
    )
      return;
    setSession(null);
    setPage(next);
    window.scrollTo(0, 0);
  }
  function start(ids: string[], label: string, test = false, count = 8) {
    const questions = makeSession(ids, count, profile.recent);
    setSession({
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
      recent: [...questions.map(signature), ...profile.recent].slice(0, 250),
    });
    window.scrollTo(0, 0);
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
    if (!session) return;
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
  const totalCompleted = profile.history.length,
    totalCorrect = profile.history.reduce((n, h) => n + h.score, 0);
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
    return (
      <div className="topic-grid">
        {topics
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
              if (e.key === "Enter" && !session?.test) checkAnswer();
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
    if (!session) return;
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
    const totals = [...new Set(session.questions.map((q) => q.topic))].map(
      (id) => {
        const qs = session.questions.filter((q) => q.topic === id);
        return {
          id,
          right: qs.filter((q) =>
            isCorrect(
              q,
              decoded(
                q,
                session.firstAnswers[q.id] ?? session.answers[q.id] ?? "",
              ),
            ),
          ).length,
          total: qs.length,
        };
      },
    );
    updateProfile({
      ...profile,
      history: [
        {
          date: new Date().toISOString(),
          label: session.label,
          score: totals.reduce((n, t) => n + t.right, 0),
          correctedScore: session.questions.filter(correct).length,
          total: session.questions.length,
          topics: totals,
        },
        ...profile.history,
      ].slice(0, 100),
    });
    setSession({ ...session, done: true });
    window.scrollTo(0, 0);
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
            <span>2.A</span>
            <div>
              <strong>Naše třída</strong>
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
              {session ? "Cvičení" : nav.find((n) => n[0] === page)?.[1]}
            </strong>
          </div>
          <div className="topbar-right">
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
          {!session && page === "home" && (
            <>
              <div className="welcome-line">
                <span className="eyebrow">TVŮJ MALÝ SVĚT VELKÝCH OBJEVŮ</span>
                <span className="date-label">Učivo pro 2. třídu</span>
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
                    onClick={() =>
                      start(
                        subjectTopics("math"),
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
                    6 okruhů k objevování{" "}
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
                    9 okruhů k objevování{" "}
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
          {!session && (page === "math" || page === "czech") && (
            <>
              <span className="eyebrow">VYBER SI SVÉ DOBRODRUŽSTVÍ</span>
              <h1>{page === "math" ? "Svět čísel" : "Svět slov"}</h1>
              <p className="page-intro">
                Jedno téma, pár úloh a zase budeš o kousek dál. Kam se pustíme?
              </p>
              {topicCards(page)}
            </>
          )}
          {!session && page === "tests" && (
            <>
              <span className="eyebrow">V KLIDU A BEZ ZNÁMEK</span>
              <h1>Zkus si písemku</h1>
              <p className="page-intro">
                Odpovědi můžeš měnit. Správné řešení si ukážeme až na konci.
              </p>
              <div className="test-grid">
                {(["math", "czech"] as Subject[]).map((s) => (
                  <section className={"test-card " + s} key={s}>
                    <span className="topic-icon">
                      {s === "math" ? "＋" : "Aa"}
                    </span>
                    <h2>{s === "math" ? "Matematika" : "Český jazyk"}</h2>
                    <p>Čtvrtletní příprava · 2. třída</p>
                    <ul>
                      {topics
                        .filter((t) => t.subject === s)
                        .map((t) => (
                          <li key={t.id}>{t.title}</li>
                        ))}
                    </ul>
                    <button
                      className="button primary"
                      onClick={() =>
                        start(
                          subjectTopics(s),
                          `${s === "math" ? "Matematika" : "Čeština"} · krátká písemka`,
                          true,
                          s === "math" ? 12 : 18,
                        )
                      }
                    >
                      Krátká písemka · {s === "math" ? 12 : 18} úloh{" "}
                      <ArrowRight size={16} />
                    </button>
                    <button
                      className="button light"
                      onClick={() =>
                        start(
                          subjectTopics(s),
                          `${s === "math" ? "Matematika" : "Čeština"} · velká písemka`,
                          true,
                          s === "math" ? 24 : 27,
                        )
                      }
                    >
                      Větší výzva · {s === "math" ? 24 : 27} úloh
                    </button>
                  </section>
                ))}
              </div>
            </>
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
                  <span>dokončených cvičení</span>
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
                        profile.history.flatMap((h) =>
                          h.topics.map((t) => t.id),
                        ),
                      ).size
                    }
                  </strong>
                  <span>prozkoumaných témat</span>
                </div>
              </div>
              {!profile.history.length ? (
                <div className="empty">
                  <span>🌱</span>
                  <h2>Tvoje cesta právě začíná</h2>
                  <p>Dokonči první cvičení a tvůj pokrok se objeví tady.</p>
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
                    {topics
                      .filter((t) =>
                        profile.history.some((h) =>
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
                  <h2>Poslední dobrodružství</h2>
                  <div className="history">
                    {profile.history.map((h, i) => (
                      <div key={i}>
                        <span className="history-icon">
                          <CheckCircle2 size={20} />
                        </span>
                        <span>
                          <strong>{h.label}</strong>
                          <small>
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
                    {!session.test && (
                      <button className="button light" onClick={checkAnswer}>
                        Zkontrolovat <Check size={16} />
                      </button>
                    )}
                    {session.index < session.questions.length - 1 ? (
                      <button
                        className="button primary"
                        onClick={() =>
                          setSession({ ...session, index: session.index + 1 })
                        }
                      >
                        Další úloha <ArrowRight size={17} />
                      </button>
                    ) : (
                      <button className="button primary" onClick={submit}>
                        Vyhodnotit <Sparkles size={17} />
                      </button>
                    )}
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
                    start(
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
                      session &&
                      !session.done &&
                      !confirm(
                        "Změnou profilu opustíš rozpracované cvičení. Pokračovat?",
                      )
                    )
                      return;
                    setSession(null);
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
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
