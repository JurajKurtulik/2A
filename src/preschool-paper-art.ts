import { picturePath, shapes, type BuildRound, type FeedRound, type MazeRound, type MoreRound, type Picture, type Shape } from "./preschool";

export const paperGraphic = { width: 480, height: 126 };
const ink = "#40604c";

async function loadPicture(id: Picture) {
  const image = new Image();
  image.src = picturePath(id);
  await image.decode();
  return image;
}

function drawShape(ctx: CanvasRenderingContext2D, shape: Shape, x: number, y: number, size: number) {
  ctx.fillStyle = shapes[shape].color;
  ctx.beginPath();
  if (shape === "circle") ctx.arc(x + size / 2, y + size / 2, size / 2, 0, 2 * Math.PI);
  else if (shape === "square") ctx.rect(x, y, size, size);
  else {
    ctx.moveTo(x + size / 2, y);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x, y + size);
    ctx.closePath();
  }
  ctx.fill();
}

export async function renderPreschoolGraphic(round: BuildRound | FeedRound | MazeRound | MoreRound): Promise<Uint8Array> {
  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = paperGraphic.width * scale;
  canvas.height = paperGraphic.height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Pracovní list se nepodařilo připravit.");
  ctx.scale(scale, scale);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.25;

  if (round.kind === "feed") {
    const [rabbit, carrot] = await Promise.all([loadPicture("rabbit"), loadPicture("carrot")]);
    const total = round.portions.reduce((sum, portion) => sum + portion, 0);
    round.portions.forEach((portion, i) => {
      const center = 240 + (i - (round.portions.length - 1) / 2) * 190;
      ctx.drawImage(rabbit, center - 23, 1, 46, 46);
      ctx.beginPath();
      const serving = round.startingPortions?.[i] ?? 0;
      ctx.roundRect(center - 66, 46, 132, serving ? 65 : 25, [3, 3, 12, 12]);
      ctx.stroke();
      ctx.fillStyle = ink;
      for (let dot = 0; dot < portion; dot++) {
        ctx.beginPath();
        ctx.arc(center + (dot - (portion - 1) / 2) * 13, 57, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
      for (let index = 0; index < serving; index++) {
        ctx.drawImage(carrot, center + (index - serving / 2) * 30, 72, 30, 30);
      }
    });
    if (!round.startingPortions) {
      for (let i = 0; i < total; i++) ctx.drawImage(carrot, 240 + (i - total / 2) * 52 + 7, 91, 38, 35);
    }
  }

  if (round.kind === "build") {
    const size = 50;
    for (const offset of [4, 235]) {
      round.cells.forEach((shape, index) => {
        const x = offset + (index % round.columns) * size;
        const y = 10 + Math.floor(index / round.columns) * size;
        ctx.strokeRect(x, y, size, size);
        if (offset === 4 && shape) drawShape(ctx, shape, x + 9, y + 9, size - 18);
      });
    }
    ctx.beginPath();
    ctx.moveTo(183, 60); ctx.lineTo(213, 60);
    ctx.lineTo(205, 52); ctx.moveTo(213, 60); ctx.lineTo(205, 68);
    ctx.stroke();
  }

  if (round.kind === "maze") {
    const [cat, house] = await Promise.all([loadPicture("cat"), loadPicture("house")]);
    const size = 28;
    round.map.forEach((row, y) => [...row].forEach((tile, x) => {
      const left = 4 + x * size, top = 5 + y * size;
      if (tile === "#") {
        ctx.fillStyle = "#9caf9e";
        ctx.fillRect(left, top, size, size);
      }
      ctx.strokeRect(left, top, size, size);
      if (tile === "S" || tile === "G") ctx.drawImage(tile === "S" ? cat : house, left + 2, top + 2, size - 4, size - 4);
    }));
  }

  if (round.kind === "more") {
    const image = await loadPicture(round.picture);
    round.counts.forEach((count, group) => {
      const left = 5 + group * 235;
      ctx.beginPath();
      ctx.roundRect(left, 6, 210, 111, 14);
      ctx.stroke();
      for (let index = 0; index < count; index++) {
        ctx.drawImage(image, left + 19 + (index % 3) * 60, 13 + Math.floor(index / 3) * 49, 44, 44);
      }
    });
  }

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(result => result ? resolve(result) : reject(new Error("Obrázek nelze uložit.")), "image/png"),
  );
  return new Uint8Array(await blob.arrayBuffer());
}
