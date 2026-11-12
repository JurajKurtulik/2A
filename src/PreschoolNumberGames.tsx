import { useState, type CSSProperties } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bell, Check } from "lucide-react";
import { PictureCard } from "./PreschoolPuzzles";
import {
  bearColors, bearPatterns, dotLayouts, matchingBear, pictureLabel, streetFarIndex, streetNeighborIndex, tripCount,
  type BalanceRound, type BearPatch, type DoorRound, type Picture, type StreetHouse, type StreetRound, type TripRound,
} from "./preschool";

type Feedback = { solved: boolean; onCorrect: () => void; onWrong: () => void };

function Confirm({ label, bell = false, disabled, onClick }: {
  label: string; bell?: boolean; disabled: boolean; onClick: () => void;
}) {
  return <button type="button" className="feed-bell" aria-label={label} disabled={disabled} onClick={onClick}>
    {bell ? <Bell /> : <Check />}
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
      aria-label={`${direction}: ${pictureLabel(picture)}`} disabled={solved || (!seated && seats.length === 5)}
      onClick={() => move(picture)}>
      <PictureCard picture={picture} />
      {!solved && (exiting === seated) && (seated ? <ArrowDown aria-hidden="true" /> : <ArrowUp aria-hidden="true" />)}
    </button>;
  }

  return <div className="new-puzzle trip-puzzle">
    <div className="trip-vehicle">
      <div className="trip-seats" aria-label="Sedadla autobusu">
        {seats.map(passenger)}
        {Array.from({ length: 5 - seats.length }, (_, i) => <span className="trip-seat-empty" key={i} />)}
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
  const counts = round.starting.map((_, place) => locations.filter(location => location === place).length);
  const tilt = Math.max(-12, Math.min(12, (counts[1] - counts[0]) * 5));
  const tiltStyle = { "--tilt": `${tilt}deg`, "--travel": `${tilt * 1.15}px` } as CSSProperties;

  function move(place: number) {
    if (selected === null) return;
    setLocations(locations.map((location, index) => selected === index ? place : location));
    setSelected(null);
  }

  function apples(place: number) {
    return locations.map((location, index) => location === place && (
      <button className="balance-apple" type="button" key={index} aria-label={`Jablko ${index + 1}`}
        aria-pressed={selected === index} disabled={solved} onClick={() => setSelected(selected === index ? null : index)}>
        <PictureCard picture="apple" />
      </button>
    ));
  }

  return <div className="new-puzzle balance-puzzle">
    <div className="balance-machine" style={tiltStyle}>
      <span className="balance-beam" aria-hidden="true" />
      <span className="balance-stand" aria-hidden="true" />
      {[0, 1].map(place => <div className="balance-pan" key={place}>
        <button className="puzzle-drop-target" type="button" aria-label={`${place === 0 ? "Levá" : "Pravá"} miska, jablka: ${counts[place]}`}
          disabled={solved} onClick={() => move(place)} />
        {apples(place)}
      </div>)}
    </div>
    <div className="feed-basket balance-basket">
      <button className="puzzle-drop-target" type="button" aria-label="Dát jablko do košíku" disabled={solved} onClick={() => move(2)} />
      {apples(2)}
    </div>
    {!solved && <Confirm label="Zazvonit a zkontrolovat váhu" bell disabled={false} onClick={() => {
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
        <PictureCard picture="logicBear" />
        <PatternSwatch color={patch.color} pattern={patch.pattern} />
      </button>)}
    </div>
    {!solved && <Confirm label="Zazvonit u dveří" bell disabled={selected === null}
      onClick={() => selected !== null && (matchingBear(round.clue, round.options[selected]) ? onCorrect() : onWrong())} />}
  </div>;
}

function PlaceClue({ house, index, size }: { house: StreetHouse; index: number; size: number }) {
  return <div className="street-clue" aria-label={`${pictureLabel(house)} patří na místo ${index + 1} zleva`}>
    <PictureCard picture={house} />
    <span className="street-mini" aria-hidden="true">
      {Array.from({ length: size }, (_, i) => <i key={i} className={index === i ? "marked" : ""} />)}
    </span>
  </div>;
}

export function StreetPuzzle({ round, solved, onCorrect, onWrong }: Feedback & { round: StreetRound }) {
  const [selected, setSelected] = useState<StreetHouse | null>(null);
  const [slots, setSlots] = useState<(StreetHouse | null)[]>(() => round.houses.map(() => null));
  const tree = <span className="street-tree"><PictureCard picture="streetTree" /></span>;

  function place(index: number) {
    if (selected) {
      const previous = slots.indexOf(selected);
      setSlots(slots.map((house, i) => i === index ? selected : i === previous ? slots[index] : house));
      setSelected(null);
    } else {
      setSelected(slots[index]);
    }
  }

  return <div className="new-puzzle street-puzzle">
    <div className="street-clues" aria-label="Nápovědy">
      <PlaceClue house={round.anchor} index={round.anchorIndex} size={slots.length} />
      <div className="street-clue street-neighbor"
        aria-label={`${pictureLabel(round.neighbor)} patří vedle domečku ${pictureLabel(round.anchor)} směrem ke stromu`}>
        <PictureCard picture={round.treeLeft ? round.neighbor : round.anchor} />
        {round.treeLeft ? <ArrowLeft aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
        <PictureCard picture={round.treeLeft ? round.anchor : round.neighbor} />
      </div>
      {round.farHouse && <PlaceClue house={round.farHouse} index={streetFarIndex(round)} size={slots.length} />}
    </div>
    <div className="street-track" aria-label="Ulice">
      {round.treeLeft && tree}
      {slots.map((house, i) => <button type="button" className="street-slot" key={i}
        aria-label={`Místo ${i + 1}${house ? `, ${pictureLabel(house)}` : ", prázdné"}`} disabled={solved}
        aria-pressed={!!house && selected === house} onClick={() => place(i)}>
        {house && <PictureCard picture={house} />}
      </button>)}
      {!round.treeLeft && tree}
    </div>
    <div className="puzzle-choice-row street-houses" aria-label="Volné domečky">
      {round.houses.map(house => <button type="button" key={house} aria-pressed={selected === house} disabled={solved || slots.includes(house)}
        onClick={() => setSelected(selected === house ? null : house)}><PictureCard picture={house} /></button>)}
    </div>
    {!solved && <Confirm label="Zazvonit a zkontrolovat ulici" bell disabled={slots.includes(null)} onClick={() => {
      setSelected(null);
      if (slots[round.anchorIndex] === round.anchor && slots[streetNeighborIndex(round)] === round.neighbor &&
          (!round.farHouse || slots[streetFarIndex(round)] === round.farHouse)) onCorrect();
      else onWrong();
    }} />}
  </div>;
}
