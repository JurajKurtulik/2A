import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, Check, RotateCcw, Star } from "lucide-react";
import { storyBanks, type StoryLevel } from "./banks/preschool-stories";
import {
  preschoolGameIds, preschoolGames, preschoolRounds,
  preschoolTopic, type ListenRound, type PreschoolGame, type PreschoolRound,
} from "./preschool";
import { makePreschoolTest, maxPreschoolGameItems, maxPreschoolTestItems, type PreschoolResult, type PreschoolTestCounts } from "./preschool-test";
import { BuildPuzzle, MazePuzzle, MorePuzzle, PictureCard, ShapePiece, StoryPuzzle } from "./PreschoolPuzzles";
import { FeedPuzzle } from "./FeedPuzzle";
import { BalancePuzzle, DoorPuzzle, StreetPuzzle, TripPuzzle } from "./PreschoolNumberGames";
import { IceCreamPuzzle, ListenPuzzle } from "./PreschoolExtraGames";
import "./preschool.css";

type Play = {
  game: PreschoolGame;
  rounds: PreschoolRound[];
  index: number;
  score: number;
  finished: boolean;
  level: StoryLevel;
  test?: ReturnType<typeof makePreschoolTest>;
  results?: PreschoolResult[];
};

export function PreschoolGames({ builder, onGames, onComplete, onTestComplete, recentStories = [], onStoriesSeen }: {
  builder: boolean;
  onGames: () => void;
  onComplete: (game: PreschoolGame, score: number, total: number, level: StoryLevel) => void;
  recentStories?: readonly string[];
  onStoriesSeen: (ids: string[]) => void;
  onTestComplete: (score: number, total: number, topics: PreschoolResult[]) => void;
}) {
  const [play, setPlay] = useState<Play | null>(null);
  const [chooseStory, setChooseStory] = useState(false);
  const [counts, setCounts] = useState<PreschoolTestCounts>({});
  const [testLevel, setTestLevel] = useState<StoryLevel>(1);
  const [variant, setVariant] = useState<ReturnType<typeof makePreschoolTest> | null>(null);
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const transition = useRef<HTMLElement | null>(null);
  const previousScreen = useRef("");
  const screen = play ? `${play.game}-${play.index}-${play.finished}` : builder ? "builder" : chooseStory ? "story-levels" : "menu";
  useEffect(() => {
    if (previousScreen.current) transition.current?.focus();
    previousScreen.current = screen;
  }, [screen]);
  useEffect(() => () => {
    audio.current?.pause();
    audio.current = null;
  }, []);

  function playSound(sound: Exclude<PreschoolGame, "listen"> | ListenRound["cue"] | "correct" | "retry" | "crunch") {
    if (sound !== "crunch") setAudioError(false);
    const src = new URL(`./preschool/audio/${sound === "street" ? "street-order" : sound}.wav`, document.baseURI).href;
    const player = audio.current ??= new Audio();
    if (player.src !== src) player.src = src;
    player.volume = sound === "crunch" ? 0.55 : sound === "correct" ? 0.65 : 1;
    player.currentTime = 0;
    void player.play().catch((error: unknown) => {
      if (sound !== "correct" && sound !== "retry" && sound !== "crunch" && player.src === src &&
        !(error instanceof DOMException && error.name === "AbortError")) setAudioError(true);
    });
  }

  function playInstruction(game: PreschoolGame, round: PreschoolRound) {
    if (round.kind === "listen") playSound(round.cue);
    else if (game !== "listen") playSound(game);
  }

  function resetRound() {
    setWrong([]);
    setSolved(false);
  }

  function start(game: PreschoolGame, level: StoryLevel = 1) {
    resetRound();
    setExportError(false);
    const rounds = preschoolRounds(game, level, recentStories);
    if (game === "story") {
      onStoriesSeen(rounds.flatMap(round => round.kind === "story" ? [round.storyId] : []));
    }
    setPlay({ game, rounds, index: 0, score: 0, finished: false, level });
    playInstruction(game, rounds[0]);
  }

  function next() {
    if (!play || !solved || play.finished) return;
    const right = Number(!wrong.length);
    const score = play.score + right;
    const id = preschoolTopic(play.game);
    const results = play.results?.map(topic => topic.id === id ? { ...topic, right: topic.right + right } : topic);
    if (play.index + 1 === play.rounds.length) {
      if (results) onTestComplete(score, play.rounds.length, results);
      else onComplete(play.game, score, play.rounds.length, play.level);
      setPlay({ ...play, score, results, finished: true });
      return;
    }
    resetRound();
    const index = play.index + 1;
    const game = play.test?.online[index].game ?? play.game;
    setPlay({ ...play, score, results, game, index });
    if (game !== play.game || game === "listen") playInstruction(game, play.rounds[index]);
  }

  function testVariant() {
    const chosen = variant ?? makePreschoolTest(counts, testLevel, recentStories);
    setVariant(chosen);
    return chosen;
  }

  function startTest() {
    const test = testVariant();
    const game = test.online[0].game;
    const rounds = test.online.map(item => item.round);
    const ids = rounds.flatMap(round => round.kind === "story" ? [round.storyId] : []);
    if (ids.length) onStoriesSeen(ids);
    resetRound();
    setExportError(false);
    setPlay({ game, rounds, index: 0, score: 0, finished: false, level: testLevel, test,
      results: preschoolGameIds.filter(id => counts[id]).map(id => ({ id: preschoolTopic(id), right: 0, total: counts[id]! })),
    });
    playInstruction(game, rounds[0]);
  }

  async function exportSheet(format: "pdf" | "docx" | "print") {
    if (exporting || (!play && !builder)) return;
    setExporting(true);
    setExportError(false);
    try {
      const test = play?.test ?? (builder && !play ? testVariant() : null);
      const { downloadPreschoolSheet, downloadPreschoolItems } = await import("./preschool-export");
      if (test) await downloadPreschoolItems(test.paper, format);
      else if (play) await downloadPreschoolSheet(play.game, play.rounds, format);
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }

  const back = () => {
    audio.current?.pause();
    setPlay(null);
  };
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const exportButtons = (["pdf", "docx", "print"] as const).map((format, index) =>
    <button type="button" key={format} className="button light"
      disabled={exporting || (!play && (!total || total > maxPreschoolTestItems))}
      onClick={() => void exportSheet(format)}>{["PDF", "Word", "Tisk"][index]}</button>);
  if (!play && builder) return (
    <section className="preschool-menu preschool-builder">
      <header className="preschool-toolbar">
        <button type="button" className="preschool-back" onClick={onGames} aria-label="Zpět ke hrám"><ChevronLeft /></button>
        <h1 tabIndex={-1} ref={element => { transition.current = element; }}>Předškolácký test</h1>
      </header>
      <div className="preschool-test-counts">
        {preschoolGameIds.map(id => <label key={id}>
          <span>{preschoolGames[id].title}</span>
          <select aria-label={preschoolGames[id].title} data-filled={counts[id] ? "" : undefined} value={counts[id] ?? 0} onChange={event => {
            setCounts({ ...counts, [id]: Number(event.target.value) });
            setVariant(null);
          }}>
            {Array.from({ length: maxPreschoolGameItems + 1 }, (_, count) => <option key={count} value={count}>{count}</option>)}
          </select>
        </label>)}
        {!!counts.story && <label><span>Počet obrázků v příběhu</span>
          <select value={testLevel} onChange={event => {
            setTestLevel(event.target.value === "2" ? 2 : 1);
            setVariant(null);
          }}><option value="1">3 obrázky</option><option value="2">5 obrázků</option></select>
        </label>}
      </div>
      <p role="status">Počet úloh {total} / {maxPreschoolTestItems}</p>
      <div className="preschool-test-actions">
        <button type="button" className="button primary" disabled={!total || total > maxPreschoolTestItems} onClick={startTest}>Spustit online</button>
        {exportButtons}
        {variant && <button type="button" className="button light" disabled={exporting} onClick={() => setVariant(makePreschoolTest(counts, testLevel, recentStories))}>Nová varianta</button>}
      </div>
      {exportError && <p role="alert">Pracovní list se nepodařilo připravit.</p>}
    </section>
  );
  if (!play && chooseStory) return (
    <section className="preschool-menu">
      <header className="preschool-toolbar">
        <button type="button" className="preschool-back" onClick={() => setChooseStory(false)} aria-label="Zpět ke hrám"><ChevronLeft /></button>
        <h1 tabIndex={-1} ref={element => { transition.current = element; }}>Co bylo nejdřív?</h1>
      </header>
      <div className="preschool-levels" aria-label="Vyber úroveň">
        {([1, 2] as const).filter(level => level === 1 || storyBanks[level].length > 0).map(level => {
          const count = level === 1 ? 3 : 5;
          return <button key={level} type="button" className={`preschool-game level-${level}`} onClick={() => start("story", level)}>
            <span className="preschool-level-cards" aria-hidden="true">
              {Array.from({ length: count }, (_, i) => <span key={i} />)}
            </span>
            <strong>{level === 1 ? "3 obrázky" : "5 obrázků"}</strong>
            <small>Úroveň {level}</small>
          </button>;
        })}
      </div>
    </section>
  );
  if (!play) return (
    <section className="preschool-menu">
      <h1 tabIndex={-1} ref={element => { transition.current = element; }}>Obrázkové hry</h1>
      <div className="preschool-games">
        {preschoolGameIds.map(id => (
          <button type="button" key={id} className={`preschool-game ${id}`} onClick={() => id === "story" && storyBanks[2].length > 0 ? setChooseStory(true) : start(id)}>
            {preschoolGames[id].picture === "build" ? (
              <span className="preschool-build-icon" aria-hidden="true">
                <ShapePiece shape="circle" /><ShapePiece shape="square" /><ShapePiece shape="triangle" />
              </span>
            ) : <PictureCard picture={preschoolGames[id].picture} />}
            <strong>{preschoolGames[id].title}</strong>
          </button>
        ))}
      </div>
      <small className="preschool-voice-note">Pokyny čte syntetický hlas.</small>
    </section>
  );

  const game = preschoolGames[play.game];
  const round = play.rounds[play.index];
  const feedback = {
    solved,
    onCorrect: () => { setSolved(true); playSound("correct"); },
    onWrong: () => { setWrong(["mistake"]); playSound("retry"); },
  };
  const roundKey = `${play.game}-${play.index}`;
  return (
    <section className="preschool-play" aria-label={game.title}>
      <header className="preschool-toolbar">
        <button type="button" className="preschool-back" onClick={back} aria-label={play.test ? "Zpět k sestavení testu" : chooseStory ? "Zpět na výběr úrovně" : "Zpět ke hrám"}><ChevronLeft /></button>
        <h1>{play.test && play.finished ? "Předškolácký test" : game.title}</h1>
        {!play.finished && <button type="button" className="preschool-speaker" ref={element => { transition.current = element; }}
          aria-label="Přehrát pokyn znovu" onClick={() => playInstruction(play.game, round)}>
          <img src="./preschool/pictures/speaker.png" alt="" />
        </button>}
      </header>
      {play.finished ? (
        <div className="preschool-finish">
          <Star size={64} aria-hidden="true" />
          <h2 tabIndex={-1} ref={element => { transition.current = element; }}>Hotovo!</h2>
          {play.test ? <><p>Správně na první pokus {play.score} z {play.rounds.length}</p>
            <button type="button" className="button primary" onClick={back}>Zpět k sestavení testu</button></>
            : <button type="button" className="button primary" onClick={() => start(play.game, play.level)}><RotateCcw /> Hrát znovu</button>}
        </div>
      ) : (
        <div className="preschool-board">
          <ol className="preschool-steps" aria-label={`Kolo ${play.index + 1} z ${play.rounds.length}`}>
            {play.rounds.length > 10 ? <li className="preschool-step-count">{play.index + 1} / {play.rounds.length}</li>
              : play.rounds.map((_, i) => <li key={i} aria-hidden="true" className={i <= play.index ? "reached" : ""} />)}
          </ol>
          {audioError && <p className="preschool-audio-error" role="status">Ťukni na reproduktor a poslechni si pokyn.</p>}
          {round.kind === "choice" && (
            <>
              {!!round.prompt.length && <div className={`preschool-prompt ${play.game}`}>
                {round.prompt.map((picture, i) => <PictureCard key={i} picture={picture} />)}
                {play.game === "pattern" && <span className="preschool-missing" aria-label="Chybějící obrázek">?</span>}
              </div>}
              <div className="preschool-choices">
                {round.options.map(picture => (
                  <button type="button" key={picture}
                    className={solved && picture === round.answer ? "correct" : wrong.includes(picture) ? "incorrect" : ""}
                    disabled={solved}
                    onClick={() => {
                      if (picture === round.answer) {
                        feedback.onCorrect();
                      } else {
                        if (!wrong.includes(picture)) setWrong([...wrong, picture]);
                        playSound("retry");
                      }
                    }}>
                    <PictureCard picture={picture} />
                  </button>
                ))}
              </div>
            </>
          )}
          {round.kind === "feed" && <FeedPuzzle key={roundKey} round={round} {...feedback} onCrunch={() => playSound("crunch")} />}
          {round.kind === "story" && <StoryPuzzle key={roundKey} round={round} {...feedback} />}
          {round.kind === "build" && <BuildPuzzle key={roundKey} round={round} {...feedback} />}
          {round.kind === "maze" && <MazePuzzle key={roundKey} round={round} {...feedback} />}
          {round.kind === "more" && <MorePuzzle key={roundKey} round={round} {...feedback} />}
          {round.kind === "trip" && <TripPuzzle key={roundKey} round={round} {...feedback} />}
          {round.kind === "balance" && <BalancePuzzle key={roundKey} round={round} {...feedback} />}
          {round.kind === "door" && <DoorPuzzle key={roundKey} round={round} {...feedback} />}
          {(round.kind === "street" || round.kind === "match") && <StreetPuzzle key={roundKey} round={round} {...feedback} />}
          {round.kind === "iceCream" && <IceCreamPuzzle key={roundKey} round={round} {...feedback} />}
          {round.kind === "listen" && <ListenPuzzle key={roundKey} round={round} {...feedback} />}
          <div className="preschool-feedback" role="status">
            {solved ? <Check aria-label="Správně" /> : !!wrong.length && <RotateCcw aria-label="Zkus to znovu" />}
          </div>
          {solved && <button type="button" className="preschool-next" aria-label={play.index + 1 === play.rounds.length ? "Dokončit hru" : "Další kolo"} onClick={next}>
            <ArrowRight />
          </button>}
        </div>
      )}
      <details className="preschool-print">
        <summary>Pro dospělé · pracovní list</summary>
        <p>{play.test ? "Úlohy jsou na papíře seskupené podle hry." : game.instruction}</p>
        {exportButtons}
        {exportError && <p role="alert">Pracovní list se nepodařilo připravit.</p>}
      </details>
    </section>
  );
}
