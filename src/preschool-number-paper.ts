import {
  bearColors, dotLayouts,
  type BalanceRound, type BearPatch, type DoorRound, type Picture, type StreetHouse, type StreetRound, type TripRound,
} from "./preschool";

type NumberRound = TripRound | BalanceRound | DoorRound | StreetRound;
type LoadPicture = (id: Picture) => Promise<HTMLImageElement>;
const ink = "#40604c";

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill?: string) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.stroke();
}

function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  ctx.moveTo(-8, 0); ctx.lineTo(8, 0);
  ctx.moveTo(3, -4); ctx.lineTo(8, 0); ctx.lineTo(3, 4);
  ctx.stroke();
  ctx.restore();
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
}

async function drawTrip(ctx: CanvasRenderingContext2D, round: TripRound, load: LoadPicture) {
  const [bus, ...riders] = await Promise.all([load("tripBus"), ...[...round.stay, ...round.exit, ...round.waiting].map(load)]);
  const inside = round.stay.length + round.exit.length;
  ctx.drawImage(bus, 2, 23, 94, 38);
  box(ctx, 99, 10, 229, 60, "#fff6da");
  box(ctx, 337, 10, 91, 60, "#f1f7ed");
  riders.forEach((rider, i) => {
    const x = i < inside ? 103 + i * 37 : 342 + (i - inside) * 40;
    ctx.drawImage(rider, x, 12, 35, 35);
    if (i >= round.stay.length) arrow(ctx, x + 17, 56, i < inside ? Math.PI / 2 : -Math.PI / 2);
  });
  round.options.forEach((count, i) => {
    const x = 153 + i * 65;
    box(ctx, x, 82, 46, 42);
    ctx.fillStyle = ink;
    for (const position of dotLayouts[count]) {
      dot(ctx, x + 11 + ((position - 1) % 3) * 12, 92 + Math.floor((position - 1) / 3) * 11, 3.2);
    }
  });
}

async function drawBalance(ctx: CanvasRenderingContext2D, round: BalanceRound, load: LoadPicture) {
  const [apple, scale] = await Promise.all([load("apple"), load("balanceScale")]);
  ctx.drawImage(scale, 165, -17, 150, 150);
  round.starting.forEach((count, i) => {
    const center = [191, 289, 240][i];
    const y = i === 2 ? 99 : 48;
    if (i === 2 && count) box(ctx, center - 76, y, 152, 28, "#fcf1db");
    for (let j = 0; j < count; j++) {
      const size = i === 2 ? 22 : 15;
      const columns = i === 2 ? count : Math.min(count, 3);
      ctx.drawImage(apple, center + (j % columns - columns / 2) * size, y + 2 - Math.floor(j / columns) * 13, size, size);
    }
  });
}

function patch(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, clue: Partial<BearPatch>) {
  const color = clue.color ? bearColors[clue.color].color : ink;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, 5);
  ctx.clip();
  ctx.fillStyle = clue.pattern ? "#fff7df" : color;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = color;
  if (clue.pattern === "dots") {
    for (let i = 0; i < 9; i++) dot(ctx, x + ((i % 3) + .5) * size / 3, y + (Math.floor(i / 3) + .5) * size / 3, size / 11);
  } else if (clue.pattern === "stripes") {
    ctx.translate(x + size / 2, y + size / 2);
    ctx.rotate(Math.PI / 4);
    for (let i = -4; i <= 4; i++) ctx.fillRect(i * size / 5, -size, size / 10, size * 2);
  } else if (clue.pattern === "checker") {
    for (let i = 0; i < 16; i++) {
      if ((i + Math.floor(i / 4)) % 2 === 0) ctx.fillRect(x + (i % 4) * size / 4, y + Math.floor(i / 4) * size / 4, size / 4, size / 4);
    }
  }
  ctx.restore();
  box(ctx, x, y, size, size);
}

async function drawDoor(ctx: CanvasRenderingContext2D, round: DoorRound, load: LoadPicture) {
  const [bear, house] = await Promise.all([load("logicBear"), load("house")]);
  ctx.drawImage(house, 139, 2, 43, 43);
  patch(ctx, 196, 5, 34, { color: round.clue.color });
  ctx.fillStyle = ink;
  ctx.font = "20px sans-serif";
  ctx.fillText("+", 239, 29);
  patch(ctx, 261, 5, 34, { pattern: round.clue.pattern });
  round.options.forEach((option, i) => {
    const center = 240 + (i - (round.options.length - 1) / 2) * 84;
    ctx.drawImage(bear, center - 36, 49, 72, 72);
    patch(ctx, center - 13, 82, 26, option);
  });
}

async function drawStreet(ctx: CanvasRenderingContext2D, round: StreetRound, load: LoadPicture) {
  const images = await Promise.all(round.houses.map(load));
  const house = (id: StreetHouse, x: number, y: number) => ctx.drawImage(images[round.houses.indexOf(id)], x, y, 39, 39);
  const size = round.houses.length;
  const first = 240 - size * 31;
  round.model.forEach((id, i) => {
    const x = first + i * 62;
    box(ctx, x, 2, 55, 43, "#fff6df");
    house(id, x + 8, 4);
    box(ctx, x, 49, 55, 33);
    house(round.houses[i], x + 8, 87);
  });
}

export function drawNumberRound(ctx: CanvasRenderingContext2D, round: NumberRound, load: LoadPicture) {
  switch (round.kind) {
    case "trip": return drawTrip(ctx, round, load);
    case "balance": return drawBalance(ctx, round, load);
    case "door": return drawDoor(ctx, round, load);
    case "street": return drawStreet(ctx, round, load);
  }
}
