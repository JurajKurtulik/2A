import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check } from "lucide-react";
import {
  mazeStep, picturePath, pictureLabel, shapes,
  type BuildRound, type Direction, type MazeRound, type MoreRound, type Picture, type Shape, type StoryRound,
} from "./preschool";

export function PictureCard({ picture }: { picture: Picture }) {
  return <img src={picturePath(picture)} alt={pictureLabel(picture)} draggable={false} />;
}

export function ShapePiece({ shape }: { shape: Shape }) {
  return <span className={`preschool-shape ${shape}`} style={{ background: shapes[shape].color }} aria-hidden="true" />;
}

type Feedback = { solved: boolean; onCorrect: () => void; onWrong: () => void };

export function StoryPuzzle({ round, solved, onCorrect, onWrong }: Feedback & { round: StoryRound }) {
  const [placed, setPlaced] = useState<Picture[]>([]);
  const [mistake, setMistake] = useState<Picture | null>(null);
  const gridStyle = { "--puzzle-columns": round.order.length } as CSSProperties;
  return <>
    <div className="preschool-story-slots" style={gridStyle} aria-label="Pořadí příběhu">
      {round.order.map((_, index) => <span key={index}>
        {placed[index] ? <PictureCard picture={placed[index]} /> : <small aria-hidden="true">{index + 1}</small>}
      </span>)}
    </div>
    <div className="preschool-choices preschool-story-choices" style={gridStyle}>
      {round.options.map(picture => <button type="button" key={picture}
        disabled={solved || placed.includes(picture)}
        className={placed.includes(picture) ? "correct" : mistake === picture ? "incorrect" : ""}
        onClick={() => {
          if (picture !== round.order[placed.length]) {
            setMistake(picture);
            onWrong();
            return;
          }
          setMistake(null);
          setPlaced([...placed, picture]);
          if (placed.length + 1 === round.order.length) onCorrect();
        }}><PictureCard picture={picture} /></button>)}
    </div>
  </>;
}

export function BuildPuzzle({ round, solved, onCorrect, onWrong }: Feedback & { round: BuildRound }) {
  const [selected, setSelected] = useState<Shape | null>(null);
  const [placed, setPlaced] = useState<Record<number, Shape>>({});
  const [mistake, setMistake] = useState<number | null>(null);
  const gridStyle = { "--puzzle-columns": round.columns } as CSSProperties;
  const workspace = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ id: number; x: number; y: number; moved: boolean }>(null);
  const [ghost, setGhost] = useState<{ shape: Shape; x: number; y: number }>();

  function place(shape: Shape | null, index: number) {
    if (!shape || solved || placed[index]) return;
    if (shape !== round.cells[index]) {
      setMistake(index);
      onWrong();
      return;
    }
    setMistake(null);
    setPlaced({ ...placed, [index]: shape });
    if (Object.keys(placed).length + 1 === round.cells.filter(Boolean).length) onCorrect();
  }

  return <>
    <div className="preschool-shape-grid model" style={gridStyle} aria-label="Předloha">
      {round.cells.map((shape, index) => <span key={index} aria-label={shape ? shapes[shape].label : "prázdné políčko"}>
        {shape && <ShapePiece shape={shape} />}
      </span>)}
    </div>
    <div ref={workspace} className="preschool-shape-grid" style={gridStyle} aria-label="Sestav obrázek">
      {round.cells.map((shape, index) => <button key={index} type="button"
        aria-label={`Políčko ${index + 1}${placed[index] ? `, ${shapes[placed[index]].label}` : ""}`}
        disabled={solved || !!placed[index]}
        className={placed[index] ? "correct" : mistake === index ? "incorrect" : ""}
        data-build-cell={index} onClick={() => place(selected, index)}>{placed[index] && <ShapePiece shape={placed[index]} />}</button>)}
    </div>
    <div className="preschool-choices preschool-shape-palette" aria-label="Tvary">
      {round.palette.map(shape => <button key={shape} type="button"
        aria-label={shapes[shape].label} aria-pressed={selected === shape} disabled={solved}
        onPointerDown={event => {
          if (!event.isPrimary || event.button !== 0) return;
          pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={event => {
          const drag = pointer.current;
          if (!drag || drag.id !== event.pointerId || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
          if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 7) drag.moved = true;
          if (drag.moved) setGhost({ shape, x: event.clientX, y: event.clientY });
        }}
        onPointerUp={event => {
          if (pointer.current?.id !== event.pointerId || !pointer.current.moved) return;
          setGhost(undefined);
          const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-build-cell]");
          if (cell && workspace.current?.contains(cell)) place(shape, Number(cell.dataset.buildCell));
        }}
        onLostPointerCapture={() => setGhost(undefined)}
        onClick={event => { if (!event.detail || !pointer.current?.moved) setSelected(selected === shape ? null : shape); }}><ShapePiece shape={shape} /></button>)}
    </div>
    {ghost && <span className="feed-drag" style={{ left: ghost.x, top: ghost.y }}><ShapePiece shape={ghost.shape} /></span>}
  </>;
}

const arrows = {
  up: { label: "Nahoru", icon: ArrowUp }, right: { label: "Doprava", icon: ArrowRight },
  down: { label: "Dolů", icon: ArrowDown }, left: { label: "Doleva", icon: ArrowLeft },
};

export function MazePuzzle({ round, solved, onCorrect, onWrong }: Feedback & { round: MazeRound }) {
  const [position, setPosition] = useState(round.start);
  const [blocked, setBlocked] = useState<Direction | null>(null);
  const width = round.map[0].length;
  function move(direction: Direction) {
    if (solved) return;
    const next = mazeStep(round, position, direction);
    if (next === null) {
      setBlocked(direction);
      onWrong();
      return;
    }
    setPosition(next);
    setBlocked(null);
    if (next === round.goal) onCorrect();
  }
  function keyboard(event: KeyboardEvent) {
    const direction = event.key.slice(5).toLowerCase() as Direction;
    if (!event.key.startsWith("Arrow") || !Object.hasOwn(arrows, direction)) return;
    event.preventDefault();
    move(direction);
  }
  return <>
    <div className={`preschool-maze${width >= 7 ? " large" : ""}`} style={{ "--puzzle-columns": width } as CSSProperties}
      aria-label={`Kočka je v řádku ${Math.floor(position / width) + 1}, políčko ${position % width + 1}`}>
      {[...round.map.join("")].map((tile, index) => <span key={index}
        className={tile === "#" ? "wall" : tile === "G" ? "goal" : ""}>
        {index === position ? <PictureCard picture="cat" /> : tile === "G" ? <PictureCard picture="house" /> : null}
      </span>)}
    </div>
    <div className="preschool-maze-controls" onKeyDown={keyboard} aria-label="Šipky pro pohyb">
      {(Object.keys(arrows) as Direction[]).map(direction => {
        const { icon: Icon, label } = arrows[direction];
        return <button type="button" key={direction} aria-label={label} disabled={solved}
          className={blocked === direction ? "incorrect" : ""} onClick={() => move(direction)}><Icon /></button>;
      })}
    </div>
  </>;
}

export function MorePuzzle({ round, solved, onCorrect, onWrong }: Feedback & { round: MoreRound }) {
  const [mistake, setMistake] = useState<number | null>(null);
  const answer = Number(round.counts[1] > round.counts[0]);
  return <div className="preschool-more">
    {round.counts.map((count, index) => <button type="button" key={index} disabled={solved}
      aria-label={`${index === 0 ? "Levá" : "Pravá"} skupina, počet obrázků ${count}`}
      className={solved && index === answer ? "correct" : mistake === index ? "incorrect" : ""}
      onClick={() => {
        if (index === answer) onCorrect();
        else { setMistake(index); onWrong(); }
      }}>
      {Array.from({ length: count }, (_, i) => <PictureCard key={i} picture={round.picture} />)}
      {solved && index === answer && <Check className="more-check" aria-hidden="true" />}
    </button>)}
  </div>;
}
