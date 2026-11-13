import { useRef, useState, type CSSProperties } from "react";
import { PictureCard } from "./PreschoolPuzzles";
import { plateColors, type IceCreamRound, type ListenRound } from "./preschool";

type Feedback = { solved: boolean; onCorrect: () => void; onWrong: () => void };

export function IceCreamPuzzle({ round, solved, onCorrect, onWrong }: Feedback & { round: IceCreamRound }) {
  const [choice, setChoice] = useState<number>();
  return <div className="new-puzzle">
    <strong className="ice-count">{round.count}</strong>
    <div className="ice-options">
      {round.options.map(count => <button type="button" key={count} aria-label={`Počet kopečků: ${count}`}
        disabled={solved} data-result={choice === count ? (solved ? "correct" : "retry") : undefined}
        onClick={() => { setChoice(count); if (count === round.count) onCorrect(); else onWrong(); }}>
        {[Math.min(5, count), Math.max(0, count - 5)].filter(Boolean).map((group, row) => <span key={row}>
          {Array.from({ length: group }, (_, i) => <PictureCard key={i} picture="iceBall" />)}
        </span>)}
      </button>)}
    </div>
  </div>;
}

const plateLabels = { pink: "Růžový", blue: "Modrý", green: "Zelený" };

export function ListenPuzzle({ round, solved, onCorrect, onWrong }: Feedback & { round: ListenRound }) {
  const [selected, setSelected] = useState(false);
  const [attempt, setAttempt] = useState<number>();
  const [ghost, setGhost] = useState<{ x: number; y: number }>();
  const board = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ id: number; x: number; y: number; moved: boolean }>(null);

  function place(index: number) {
    setSelected(false);
    setAttempt(index);
    if (index === round.answer) onCorrect();
    else onWrong();
  }

  return <div className="new-puzzle listen-puzzle" ref={board}>
    <div className="listen-plates">
      {round.plates.map((color, i) => <button key={color} type="button" className="listen-plate"
        data-listen-plate={i} aria-label={`${plateLabels[color]} talíř, místo ${i + 1}`}
        style={{ "--plate": plateColors[color] } as CSSProperties}
        disabled={solved} data-result={attempt === i && !solved ? "retry" : undefined}
        onClick={() => selected && place(i)}>
        {solved && attempt === i && <PictureCard picture="muffin" />}
      </button>)}
    </div>
    {!solved && <button type="button" className="listen-muffin" aria-label="Muffin" aria-pressed={selected}
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return;
        pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        const drag = pointer.current;
        if (!drag || drag.id !== event.pointerId || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
        if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 7) drag.moved = true;
        if (drag.moved) setGhost({ x: event.clientX, y: event.clientY });
      }}
      onPointerUp={event => {
        if (pointer.current?.id !== event.pointerId || !pointer.current.moved) return;
        setGhost(undefined);
        const plate = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-listen-plate]");
        if (plate && board.current?.contains(plate)) place(Number(plate.dataset.listenPlate));
      }}
      onLostPointerCapture={() => setGhost(undefined)}
      onClick={event => { if (!event.detail || !pointer.current?.moved) setSelected(!selected); }}>
      <PictureCard picture="muffin" />
    </button>}
    {ghost && <span className="feed-drag" aria-hidden="true" style={{ left: ghost.x, top: ghost.y }}><PictureCard picture="muffin" /></span>}
  </div>;
}
