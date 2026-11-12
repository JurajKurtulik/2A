import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, Check, RotateCcw, Star } from "lucide-react";
import {
  preschoolGameIds, preschoolGames, preschoolRounds,
  type PreschoolGame, type PreschoolRound,
} from "./preschool";
import { BuildPuzzle, MazePuzzle, MorePuzzle, PictureCard, ShapePiece, StoryPuzzle } from "./PreschoolPuzzles";
import "./preschool.css";

type Play = {
  game: PreschoolGame;
  rounds: PreschoolRound[];
  index: number;
  score: number;
  finished: boolean;
};

export function PreschoolGames({ onComplete }: {
  onComplete: (game: PreschoolGame, score: number, total: number) => void;
}) {
  const [play, setPlay] = useState<Play | null>(null);
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [carrot, setCarrot] = useState<number | null>(null);
  const [fed, setFed] = useState<number[]>([]);
  const [usedCarrots, setUsedCarrots] = useState<number[]>([]);
  const [audioError, setAudioError] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const transition = useRef<HTMLElement | null>(null);
  const previousScreen = useRef("");
  const screen = play ? `${play.game}-${play.index}-${play.finished}` : "menu";
  useEffect(() => {
    if (previousScreen.current) transition.current?.focus();
    previousScreen.current = screen;
  }, [screen]);
  useEffect(() => () => {
    audio.current?.pause();
    audio.current = null;
  }, []);

  function playSound(sound: PreschoolGame | "correct" | "retry") {
    setAudioError(false);
    const src = new URL(`./preschool/audio/${sound}.wav`, document.baseURI).href;
    const player = audio.current ??= new Audio();
    if (player.src !== src) player.src = src;
    player.volume = sound === "correct" ? 0.65 : 1;
    player.currentTime = 0;
    void player.play().catch((error: unknown) => {
      if (sound !== "correct" && sound !== "retry" && player.src === src &&
        !(error instanceof DOMException && error.name === "AbortError")) setAudioError(true);
    });
  }

  function resetRound() {
    setWrong([]);
    setSolved(false);
    setCarrot(null);
    setFed([]);
    setUsedCarrots([]);
  }

  function start(game: PreschoolGame) {
    resetRound();
    setExportError(false);
    setPlay({ game, rounds: preschoolRounds(game), index: 0, score: 0, finished: false });
    playSound(game);
  }

  function next() {
    if (!play || !solved || play.finished) return;
    const score = play.score + Number(!wrong.length);
    if (play.index + 1 === play.rounds.length) {
      onComplete(play.game, score, play.rounds.length);
      setPlay({ ...play, score, finished: true });
      return;
    }
    resetRound();
    setPlay({ ...play, score, index: play.index + 1 });
  }

  async function exportSheet(format: "pdf" | "docx" | "print") {
    if (!play || exporting) return;
    setExporting(true);
    setExportError(false);
    try {
      const { downloadPreschoolSheet } = await import("./preschool-export");
      await downloadPreschoolSheet(play.game, play.rounds, format);
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
  if (!play) return (
    <section className="preschool-menu">
      <h1 tabIndex={-1} ref={element => { transition.current = element; }}>Obrázkové hry</h1>
      <div className="preschool-games">
        {preschoolGameIds.map(id => (
          <button type="button" key={id} className={`preschool-game ${id}`} onClick={() => start(id)}>
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
        <button type="button" className="preschool-back" onClick={back} aria-label="Zpět ke hrám"><ChevronLeft /></button>
        <h1>{game.title}</h1>
        {!play.finished && <button type="button" className="preschool-speaker" ref={element => { transition.current = element; }}
          aria-label="Přehrát pokyn znovu" onClick={() => playSound(play.game)}>
          <img src="./preschool/pictures/speaker.png" alt="" />
        </button>}
      </header>
      {play.finished ? (
        <div className="preschool-finish">
          <Star size={64} aria-hidden="true" />
          <h2 tabIndex={-1} ref={element => { transition.current = element; }}>Hotovo!</h2>
          <button type="button" className="button primary" onClick={() => start(play.game)}><RotateCcw /> Hrát znovu</button>
        </div>
      ) : (
        <div className="preschool-board">
          <ol className="preschool-steps" aria-label={`Kolo ${play.index + 1} z ${play.rounds.length}`}>
            {play.rounds.map((_, i) => <li key={i} aria-hidden="true" className={i <= play.index ? "reached" : ""} />)}
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
          {round.kind === "feed" && (
            <>
              <div className="preschool-choices feeding" aria-label="Zajíčci">
                {Array.from({ length: round.count }, (_, i) => <button type="button" key={i}
                  aria-label={`Zajíček ${i + 1}${fed.includes(i) ? ", nakrmený" : ""}`}
                  className={fed.includes(i) ? "correct" : ""} disabled={solved || fed.includes(i)}
                  onClick={() => {
                    if (carrot === null) return;
                    setFed([...fed, i]);
                    setUsedCarrots([...usedCarrots, carrot]);
                    setCarrot(null);
                    playSound("correct");
                    if (fed.length + 1 === round.count) setSolved(true);
                  }}>
                  <PictureCard picture="rabbit" />
                  {fed.includes(i) && <span className="preschool-fed" aria-hidden="true"><PictureCard picture="carrot" /></span>}
                </button>)}
              </div>
              <div className="preschool-choices feeding carrots" aria-label="Mrkve">
                {Array.from({ length: round.count }, (_, i) => <button type="button" key={i}
                  aria-label={`Mrkev ${i + 1}`} aria-pressed={carrot === i} disabled={usedCarrots.includes(i)}
                  onClick={() => setCarrot(carrot === i ? null : i)}>
                  <PictureCard picture="carrot" />
                </button>)}
              </div>
            </>
          )}
          {round.kind === "story" && <StoryPuzzle key={roundKey} round={round} {...feedback} />}
          {round.kind === "build" && <BuildPuzzle key={roundKey} round={round} {...feedback} />}
          {round.kind === "maze" && <MazePuzzle key={roundKey} round={round} {...feedback} />}
          {round.kind === "more" && <MorePuzzle key={roundKey} round={round} {...feedback} />}
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
        <p>{game.instruction}</p>
        {(["pdf", "docx", "print"] as const).map((format, index) => <button type="button" key={format}
          className="button light" disabled={exporting} onClick={() => void exportSheet(format)}>
          {["PDF", "Word", "Tisk"][index]}
        </button>)}
        {exportError && <p role="alert">Pracovní list se nepodařilo připravit.</p>}
      </details>
    </section>
  );
}
