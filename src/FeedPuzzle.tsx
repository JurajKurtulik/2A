import { useRef, useState, type PointerEvent } from "react";
import { Bell } from "lucide-react";
import { PictureCard } from "./PreschoolPuzzles";
import type { FeedRound } from "./preschool";

const basket = -1;

export function FeedPuzzle({ round, solved, onCorrect, onWrong, onCrunch }: {
  round: FeedRound;
  solved: boolean;
  onCorrect: () => void;
  onWrong: () => void;
  onCrunch: () => void;
}) {
  const total = round.portions.reduce((sum, count) => sum + count, 0);
  const firstServing = round.startingPortions?.[0];
  const [places, setPlaces] = useState(() => Array.from({ length: total }, (_, i) =>
    firstServing === undefined ? basket : Number(i >= firstServing)));
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const pointer = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const counts = round.portions.map((_, i) => places.filter(place => place === i).length);

  function move(id: number, destination: number) {
    setSelected(null);
    if (places[id] === destination) return;
    setPlaces(places.map((place, i) => i === id ? destination : place));
    setChecked(false);
    if (destination !== basket) onCrunch();
  }

  function endDrag(event: PointerEvent<HTMLButtonElement>, id: number) {
    if (!pointer.current?.moved || pointer.current.id !== event.pointerId) return;
    setDrag(null);
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-feed-place]");
    if (target && board.current?.contains(target)) move(id, Number(target.dataset.feedPlace));
  }

  function carrotsAt(place: number) {
    return places.map((location, id) => location === place && (
      <button key={id} type="button" className="feed-carrot" aria-label={`Mrkev ${id + 1}`}
        aria-pressed={selected === id} disabled={solved}
        onPointerDown={event => {
          if (!event.isPrimary || event.button !== 0) return;
          pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={event => {
          const active = pointer.current;
          if (!active || event.pointerId !== active.id || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
          if (Math.hypot(event.clientX - active.x, event.clientY - active.y) > 8) active.moved = true;
          if (active.moved) setDrag({ x: event.clientX, y: event.clientY });
        }}
        onPointerUp={event => endDrag(event, id)}
        onLostPointerCapture={() => setDrag(null)}
        onClick={event => {
          if (event.detail && pointer.current?.moved) return;
          setSelected(selected === id ? null : id);
        }}>
        <PictureCard picture="carrot" />
      </button>
    ));
  }

  function check() {
    setSelected(null);
    setChecked(true);
    if (counts.every((count, i) => count === round.portions[i])) onCorrect();
    else onWrong();
  }

  return (
    <div className="feed-puzzle" ref={board}>
      <div className="feed-rabbits">
        {round.portions.map((portion, i) => (
          <div className="feed-rabbit" key={i} data-feed-place={i}>
            <button className="feed-target" type="button" disabled={solved}
              aria-label={`Miska ${i + 1}: chce ${portion}, má ${counts[i]}`}
              onClick={() => selected !== null && move(selected, i)}>
              <PictureCard picture="rabbit" />
              <span className="feed-dots" aria-hidden="true">
                {Array.from({ length: portion }, (_, dot) => <span key={dot} />)}
              </span>
            </button>
            <div className="feed-bowl" data-result={solved ? "served" : checked && counts[i] !== portion ? "retry" : undefined}>
              <div className="feed-drop-area" aria-hidden="true" onClick={() => selected !== null && move(selected, i)} />
              {!solved && carrotsAt(i)}
            </div>
          </div>
        ))}
      </div>
      {!solved && (
        <>
          <div className="feed-basket" data-feed-place={basket}>
            <button className="feed-drop-area" type="button" aria-label="Vrátit mrkev do košíku"
              onClick={() => selected !== null && move(selected, basket)} />
            {carrotsAt(basket)}
          </div>
          <button type="button" className="feed-bell" aria-label="Zazvonit a zkontrolovat" onClick={check}><Bell /></button>
        </>
      )}
      {drag && <span className="feed-drag" aria-hidden="true" style={{ left: drag.x, top: drag.y }}><PictureCard picture="carrot" /></span>}
    </div>
  );
}
