import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { ArrowDown, ArrowUp, Check } from "lucide-react";
import { PictureCard } from "./PreschoolPuzzles";
import {
  bearColors, bearPatterns, dotLayouts, matchingBear, pictureLabel, pizzaPairs, tripCapacity, tripCount,
  type BalanceRound, type BearPatch, type DoorRound, type Picture, type MatchRound, type StreetRound, type TripRound,
} from "./preschool";

type Feedback = { solved: boolean; onCorrect: () => void; onWrong: () => void };

function Confirm({ label, disabled, onClick }: {
  label: string; disabled: boolean; onClick: () => void;
}) {
  return <button type="button" className="feed-bell" aria-label={label} disabled={disabled} onClick={onClick}>
    <Check />
  </button>;
}

function Dots({ count }: { count: number }) {
  return <span className="number-dots" aria-hidden="true">
    {dotLayouts[count].map(position => <i key={position} style={{ gridArea: `${Math.ceil(position / 3)} / ${(position - 1) % 3 + 1}` }} />)}
  </span>;
}

export function TripPuzzle({ round, solved, onCorrect, onWrong }: Feedback & { round: TripRound }) {
  const [off, setOff] = useState<Picture[]>([]);
  const [aboard, setAboard] = useState<Picture[]>([]);
  const [answer, setAnswer] = useState<number | null>(null);
  const riders = [...round.stay, ...round.exit, ...round.waiting];
  const seats = riders.filter(picture => round.stay.includes(picture) || (round.exit.includes(picture) && !off.includes(picture)) || aboard.includes(picture));
  const ready = off.length === round.exit.length && aboard.length === round.waiting.length;

  function move(picture: Picture) {
    setAnswer(null);
    if (round.exit.includes(picture)) {
      setOff(off.includes(picture) ? off.filter(item => item !== picture) : [...off, picture]);
    } else {
      setAboard(aboard.includes(picture) ? aboard.filter(item => item !== picture) : [...aboard, picture]);
    }
  }

  function passenger(picture: Picture) {
    const exiting = round.exit.includes(picture);
    const seated = seats.includes(picture);
    if (round.stay.includes(picture)) return <span className="trip-rider" key={picture}><PictureCard picture={picture} /></span>;
    const direction = seated ? "Vystoupí" : "Nastoupí";
    return <button type="button" className="trip-rider" key={picture}
      aria-label={`${direction}: ${pictureLabel(picture)}`} disabled={solved || (!seated && seats.length === tripCapacity)}
      onClick={() => move(picture)}>
      <PictureCard picture={picture} />
      {!solved && (exiting === seated) && (seated ? <ArrowDown aria-hidden="true" /> : <ArrowUp aria-hidden="true" />)}
    </button>;
  }

  return <div className="new-puzzle trip-puzzle">
    <div className="trip-vehicle">
      <div className="trip-seats" aria-label="Sedadla autobusu">
        {seats.map(passenger)}
        {Array.from({ length: tripCapacity - seats.length }, (_, i) => <span className="trip-seat-empty" key={i} />)}
      </div>
      <PictureCard picture="tripBus" />
    </div>
    <div className="trip-stop" aria-label="Zvířátka na zastávce">
      <div aria-label="Čekají na nástup">{round.waiting.filter(picture => !aboard.includes(picture)).map(passenger)}</div>
      <div aria-label="Už vystoupila">{off.map(passenger)}</div>
    </div>
    <div className="puzzle-choice-row" aria-label="Kolik jich jede dál?">
      {round.options.map(count => <button type="button" key={count} aria-label={`Počet cestujících: ${count}`}
        aria-pressed={answer === count} disabled={!ready || solved} onClick={() => setAnswer(count)}><Dots count={count} /></button>)}
    </div>
    {!solved && <Confirm label="Zkontrolovat počet" disabled={answer === null}
      onClick={() => answer === tripCount(round) ? onCorrect() : onWrong()} />}
  </div>;
}

export function BalancePuzzle({ round, solved, onCorrect, onWrong }: Feedback & { round: BalanceRound }) {
  const [locations, setLocations] = useState(() => round.starting.flatMap((count, place) =>
    Array.from({ length: count }, () => place)));
  const [selected, setSelected] = useState<number | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const pointer = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const puzzle = useRef<HTMLDivElement>(null);
  const counts = round.starting.map((_, place) => locations.filter(location => location === place).length);
  const tilt = Math.max(-12, Math.min(12, (counts[1] - counts[0]) * 5));
  const tiltStyle = { "--tilt": `${tilt}deg`, "--travel": `${Math.sin(tilt * Math.PI / 180) * 33}%` } as CSSProperties;

  function move(place: number, apple = selected) {
    if (apple === null) return;
    setLocations(current => current.map((location, index) => apple === index ? place : location));
    setSelected(null);
  }

  function drop(event: PointerEvent<HTMLButtonElement>, apple: number) {
    if (pointer.current?.id !== event.pointerId || !pointer.current.moved) return;
    setGhost(null);
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-apple-place]");
    if (target && puzzle.current?.contains(target)) move(Number(target.dataset.applePlace), apple);
  }

  function apples(place: number) {
    return locations.map((location, index) => location === place && (
      <button className="balance-apple" type="button" key={index} aria-label={`Jablko ${index + 1}`}
        aria-pressed={selected === index} disabled={solved}
        onPointerDown={event => {
          if (!event.isPrimary || event.button !== 0) return;
          pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={event => {
          const active = pointer.current;
          if (!active || active.id !== event.pointerId || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
          if (Math.hypot(event.clientX - active.x, event.clientY - active.y) > 7) active.moved = true;
          if (active.moved) setGhost({ x: event.clientX, y: event.clientY });
        }}
        onPointerUp={event => drop(event, index)} onLostPointerCapture={() => setGhost(null)}
        onClick={event => {
          if (event.detail && pointer.current?.moved) return;
          setSelected(selected === index ? null : index);
        }}>
        <PictureCard picture="apple" />
      </button>
    ));
  }

  return <div className="new-puzzle balance-puzzle" ref={puzzle}>
    <div className="balance-machine" style={tiltStyle}>
      <img className="balance-arm-art" src="./preschool/pictures/balanceArm.png" alt="" draggable={false} />
      <img className="balance-base-art" src="./preschool/pictures/balanceBase.png" alt="" draggable={false} />
      {[0, 1].map(place => <div className={`balance-pan pan-${place}`} key={place}>
        <img src="./preschool/pictures/balanceBowl.png" alt="" draggable={false} />
        <div className="balance-pan-apples" data-apple-place={place} style={{ "--apples": counts[place] } as CSSProperties}>
          <button className="puzzle-drop-target" type="button" aria-label={`${place === 0 ? "Levá" : "Pravá"} miska, jablka: ${counts[place]}`}
            disabled={solved} onClick={() => move(place)} />
          {apples(place)}
        </div>
      </div>)}
    </div>
    <div className="balance-basket" data-apple-place={2}>
      <button className="puzzle-drop-target" type="button" aria-label="Dát jablko do košíku" disabled={solved} onClick={() => move(2)} />
      {apples(2)}
    </div>
    {ghost && <span className="feed-drag" aria-hidden="true" style={{ left: ghost.x, top: ghost.y }}><PictureCard picture="apple" /></span>}
    {!solved && <Confirm label="Zkontrolovat váhu" disabled={false} onClick={() => {
      setSelected(null);
      if (!counts[2] && counts[0] === counts[1]) onCorrect();
      else onWrong();
    }} />}
  </div>;
}

function PatternSwatch({ color, pattern }: { color?: BearPatch["color"]; pattern?: BearPatch["pattern"] }) {
  return <span aria-hidden="true" className={`pattern-swatch ${pattern ?? ""}`}
    style={{ "--patch": color ? bearColors[color].color : "#315444" } as CSSProperties} />;
}

export function DoorPuzzle({ round, solved, onCorrect, onWrong }: Feedback & { round: DoorRound }) {
  const [selected, setSelected] = useState<number | null>(null);
  return <div className="new-puzzle door-puzzle">
    <div className="door-sign">
      <PictureCard picture="house" />
      <div className="door-clue" aria-label={`Nápověda: ${bearColors[round.clue.color].label}, ${bearPatterns[round.clue.pattern]}`}>
        <PatternSwatch color={round.clue.color} />
        <span aria-hidden="true">+</span>
        <PatternSwatch pattern={round.clue.pattern} />
      </div>
    </div>
    <div className="puzzle-choice-row bear-options" aria-label="Medvídci">
      {round.options.map((patch, i) => <button type="button" key={i}
        aria-label={`Medvídek: ${bearColors[patch.color].label}, ${bearPatterns[patch.pattern]}`}
        aria-pressed={selected === i} disabled={solved} onClick={() => setSelected(i)}>
        <span className="bear-art">
          <PictureCard picture="logicBear" />
          <PatternSwatch color={patch.color} pattern={patch.pattern} />
        </span>
      </button>)}
    </div>
    {!solved && <Confirm label="Zkontrolovat medvídka" disabled={selected === null}
      onClick={() => selected !== null && (matchingBear(round.clue, round.options[selected]) ? onCorrect() : onWrong())} />}
  </div>;
}

export function StreetPuzzle({ round, solved, onCorrect, onWrong }: Feedback & { round: StreetRound | MatchRound }) {
  const matching = round.kind === "match";
  const pieces = matching ? round.slices : round.houses;
  const model = matching ? round.pizzas : round.model;
  const order = matching ? model.map(pizza => pizzaPairs.find(pair => pair[0] === pizza)![1]) : model;
  const [selected, setSelected] = useState<Picture | null>(null);
  const [slots, setSlots] = useState<(Picture | null)[]>(() => pieces.map(() => null));

  const track = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ house: Picture; x: number; y: number } | null>(null);
  const pointer = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);

  function place(index: number, house = selected) {
    if (house) {
      const previous = slots.indexOf(house);
      setSlots(slots.map((current, i) => i === index ? house : i === previous ? slots[index] : current));
      setSelected(null);
    } else {
      setSelected(slots[index]);
    }
  }

  function dragHouse(house: Picture | null) {
    return {
      onPointerDown(event: PointerEvent<HTMLButtonElement>) {
        pointer.current = null;
        if (!house || !event.isPrimary || event.button !== 0) return;
        pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      onPointerMove(event: PointerEvent<HTMLButtonElement>) {
        const active = pointer.current;
        if (!house || active?.id !== event.pointerId || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
        if (Math.hypot(event.clientX - active.x, event.clientY - active.y) > 7) active.moved = true;
        if (active.moved) setDrag({ house, x: event.clientX, y: event.clientY });
      },
      onPointerUp(event: PointerEvent<HTMLButtonElement>) {
        if (!house || pointer.current?.id !== event.pointerId || !pointer.current.moved) return;
        setDrag(null);
        const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-street-slot]");
        if (target && track.current?.contains(target)) place(Number(target.dataset.streetSlot), house);
      },
      onLostPointerCapture() { setDrag(null); },
    };
  }

  return <div className={`new-puzzle street-puzzle${matching ? " pizza-puzzle" : ""}`}>
    <div className="street-track street-model" aria-label={matching ? "Celé pizzy" : "Vzor ulice"}>
      {model.map(house => <span key={house}><PictureCard picture={house} /></span>)}
    </div>
    <div className="street-track" aria-label="Ulice" ref={track}>
      {slots.map((house, i) => <button type="button" className="street-slot" key={i}
        aria-label={`Místo ${i + 1}${house ? `, ${pictureLabel(house)}` : ", prázdné"}`} disabled={solved}
        data-street-slot={i} {...dragHouse(house)} aria-pressed={!!house && selected === house}
        onClick={event => { if (!event.detail || !pointer.current?.moved) place(i); }}>
        {house && <PictureCard picture={house} />}
      </button>)}
    </div>
    <div className="puzzle-choice-row street-houses" aria-label={matching ? "Dílky pizzy" : "Volné domečky"}>
      {pieces.map(house => <button type="button" key={house} aria-pressed={selected === house} disabled={solved || slots.includes(house)}
        {...dragHouse(house)} onClick={event => {
          if (!event.detail || !pointer.current?.moved) setSelected(selected === house ? null : house);
        }}><PictureCard picture={house} /></button>)}
    </div>
    {drag && <span className="feed-drag" aria-hidden="true" style={{ left: drag.x, top: drag.y }}><PictureCard picture={drag.house} /></span>}
    {!solved && <Confirm label={matching ? "Zkontrolovat pizzy" : "Zkontrolovat ulici"} disabled={slots.includes(null)} onClick={() => {
      setSelected(null);
      if (slots.every((house, i) => house === order[i])) onCorrect();
      else onWrong();
    }} />}
  </div>;
}
