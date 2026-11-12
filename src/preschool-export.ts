import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { Document, ImageRun, Packer, Paragraph, TextRun } from "docx";
import { loadFonts, saveDownload } from "./export";
import { paperGraphic, renderPreschoolGraphic } from "./preschool-paper-art";
import { picturePath, pictureLabel, preschoolGames, type Picture, type PreschoolGame, type PreschoolRound } from "./preschool";

type Graphic = `graphic-${number}`;
type Cell = Picture | "blank" | Graphic;
const isGraphic = (cell: Cell): cell is Graphic => cell.startsWith("graphic-");
const a4 = { width: 595.28, height: 841.89 };
function rows(game: PreschoolGame, round: PreschoolRound, index: number): Cell[][] {
  if (round.kind === "build" || round.kind === "maze" || round.kind === "more") return [[`graphic-${index}`]];
  if (round.kind === "story") return [round.options, round.options.map(() => "blank")];
  if (round.kind === "feed") return [
    Array.from({ length: round.count }, () => "rabbit"),
    Array.from({ length: round.count }, () => "carrot"),
  ];
  const prompt: Cell[] = [...round.prompt];
  if (game === "pattern") prompt.push("blank");
  return prompt.length ? [prompt, round.options] : [round.options];
}

async function imageBytes(picture: Picture) {
  const response = await fetch(picturePath(picture));
  if (!response.ok) throw new Error("Ilustraci se nepodařilo načíst.");
  return new Uint8Array(await response.arrayBuffer());
}

async function exportPdf(game: PreschoolGame, rounds: Cell[][][], assets: Map<Picture | Graphic, Uint8Array>) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fonts = await loadFonts();
  const regular = await pdf.embedFont(fonts.regular, { subset: true });
  const bold = await pdf.embedFont(fonts.bold, { subset: true });
  const images = new Map(await Promise.all([...assets].map(async ([id, bytes]) => [id, await pdf.embedPng(bytes)] as const)));
  const page = pdf.addPage([a4.width, a4.height]);
  const ink = rgb(.13, .23, .18);
  const { title, instruction } = preschoolGames[game];
  pdf.setTitle(title);
  pdf.setAuthor("Škola hrou");
  page.drawText("Škola hrou  /  Předškolák", { x: 42, y: 799, size: 11, font: regular, color: ink });
  page.drawText(title, { x: 42, y: 765, size: 24, font: bold, color: ink });
  page.drawText(instruction, { x: 42, y: 739, size: 12, font: regular, color: ink });
  const storyCredit = game === "story" && assetsHaveStoryCards(rounds);
  if (storyCredit) page.drawText(storyAttribution, { x: 42, y: 21, size: 8, font: regular, color: ink });
  rounds.forEach((group, i) => {
    const top = 703 - i * 133;
    page.drawText(`${i + 1}.`, { x: 42, y: top - 21, size: 12, font: bold, color: ink });
    group.forEach((row, rowIndex) => {
      const gap = game === "feed" ? 12 : 4;
      const size = Math.min(45, (a4.width - 118 - (row.length - 1) * gap) / row.length);
      const y = top - size - rowIndex * (game === "feed" ? 75 : 57);
      row.forEach((cell, index) => {
        const x = 70 + index * (size + gap);
        if (isGraphic(cell)) {
          page.drawImage(images.get(cell)!, { x, y: top - 108, width: 410, height: 410 * paperGraphic.height / paperGraphic.width });
        } else if (cell === "blank") {
          page.drawRectangle({ x, y, width: size, height: size, borderWidth: 1, borderColor: ink });
        } else {
          page.drawImage(images.get(cell)!, { x, y, width: size, height: size });
        }
      });
    });
    if (i < rounds.length - 1) page.drawLine({
      start: { x: 42, y: top - 126 }, end: { x: 553, y: top - 126 }, color: rgb(.83, .86, .84),
    });
  });
  return pdf.save();
}

const storyAttribution = "Složené ilustrace: Twemoji © Twitter, Inc. a přispěvatelé · CC BY 4.0 · github.com/jdecked/twemoji";
function assetsHaveStoryCards(rounds: Cell[][][]) {
  return rounds.some(group => group.some(row => row.some(cell => cell.startsWith("story-"))));
}

async function exportDocx(game: PreschoolGame, rounds: Cell[][][], assets: Map<Picture | Graphic, Uint8Array>) {
  const { title, instruction } = preschoolGames[game];
  const blank = game === "story" ? await storyWritingBox() : undefined;
  const document = new Document({
    creator: "Škola hrou",
    title,
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 650, bottom: 650, left: 850, right: 850 } } },
      children: [
        new Paragraph({ children: [new TextRun({ text: "Škola hrou  /  Předškolák", size: 20 })] }),
        new Paragraph({ spacing: { before: 140, after: 100 }, children: [new TextRun({ text: title, size: 38, bold: true })] }),
        new Paragraph({ text: instruction, spacing: { after: 250 } }),
        ...rounds.flatMap((group, index) => group.map((row, rowIndex) => new Paragraph({
          keepNext: rowIndex + 1 < group.length,
          spacing: { before: rowIndex ? (game === "feed" ? 320 : 60) : 100, after: rowIndex + 1 === group.length ? 170 : 0 },
          children: [
            new TextRun({ text: rowIndex === 0 ? `${index + 1}.   ` : "      ", bold: true }),
            ...row.flatMap(cell => [
              cell === "blank" ? (blank
                ? new ImageRun({ type: "png", data: blank, transformation: { width: 48, height: 48 },
                    altText: { name: "blank", title: "Políčko pro číslo", description: "Prázdné políčko pro pořadí obrázku." } })
                : new TextRun({ text: "□", size: 60 })) : new ImageRun({
                type: "png", data: assets.get(cell)!,
                transformation: isGraphic(cell) ? { width: 345, height: 91 } : { width: 48, height: 48 },
                altText: { name: cell, title: isGraphic(cell) ? title : pictureLabel(cell), description: isGraphic(cell) ? instruction : pictureLabel(cell) },
              }),
              new TextRun({ text: " " }),
            ]),
          ],
        }))),
        ...(game === "story" && assetsHaveStoryCards(rounds)
          ? [new Paragraph({ children: [new TextRun({ text: storyAttribution, size: 15 })] })] : []),
      ],
    }],
  });
  return Packer.toBlob(document);
}

async function storyWritingBox() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Pracovní list se nepodařilo připravit.");
  ctx.strokeStyle = "#40604c";
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, 88, 88);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(result => result ? resolve(result) : reject(new Error("Políčko nelze uložit.")), "image/png"),
  );
  return new Uint8Array(await blob.arrayBuffer());
}

async function printSheet(game: PreschoolGame, rounds: Cell[][][], graphics: Map<Graphic, Uint8Array>) {
  const root = document.createElement("div");
  root.className = "print-root preschool-paper-root";
  const page = document.createElement("article");
  page.className = "preschool-paper-page";
  const title = document.createElement("h1");
  title.textContent = preschoolGames[game].title;
  const instruction = document.createElement("p");
  instruction.textContent = preschoolGames[game].instruction;
  const header = document.createElement("small");
  header.textContent = "Škola hrou / Předškolák";
  page.append(header, title, instruction);
  const images: HTMLImageElement[] = [];
  const urls: string[] = [];
  const cleanup = () => {
    root.remove();
    urls.forEach(url => URL.revokeObjectURL(url));
  };
  rounds.forEach((group, index) => {
    const rowGroup = document.createElement("section");
    rowGroup.className = `preschool-paper-round ${game}`;
    const number = document.createElement("b");
    number.textContent = `${index + 1}.`;
    rowGroup.append(number);
    group.forEach(row => {
      const line = document.createElement("div");
      for (const cell of row) {
        if (cell === "blank") line.append(document.createElement("span"));
        else {
          const image = new Image();
          if (isGraphic(cell)) {
            const url = URL.createObjectURL(new Blob([new Uint8Array(graphics.get(cell)!)], { type: "image/png" }));
            urls.push(url);
            image.src = url;
            image.alt = preschoolGames[game].instruction;
            image.className = "preschool-paper-graphic";
          } else {
            image.src = picturePath(cell);
            image.alt = pictureLabel(cell);
          }
          images.push(image);
          line.append(image);
        }
      }
      rowGroup.append(line);
    });
    page.append(rowGroup);
  });
  if (game === "story" && assetsHaveStoryCards(rounds)) {
    const credit = document.createElement("small");
    credit.textContent = storyAttribution;
    page.append(credit);
  }
  root.append(page);
  document.body.append(root);
  try {
    await Promise.all(images.map(image => image.decode()));
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
  } catch (error) {
    window.removeEventListener("afterprint", cleanup);
    cleanup();
    throw error;
  }
}

export async function downloadPreschoolSheet(game: PreschoolGame, rounds: PreschoolRound[], format: "pdf" | "docx" | "print") {
  const groups = rounds.map((round, index) => rows(game, round, index));
  const graphics = new Map<Graphic, Uint8Array>();
  await Promise.all(rounds.map(async (round, index) => {
    if (round.kind === "build" || round.kind === "maze" || round.kind === "more") {
      graphics.set(`graphic-${index}`, await renderPreschoolGraphic(round));
    }
  }));
  if (format === "print") return printSheet(game, groups, graphics);
  const used = new Set(groups.flat(2).filter((cell): cell is Picture => cell !== "blank" && !isGraphic(cell)));
  const assets = new Map<Picture | Graphic, Uint8Array>([
    ...graphics,
    ...await Promise.all([...used].map(async id => [id, await imageBytes(id)] as const)),
  ]);
  const filename = `skola-hrou-predskolak-${game}.${format}`;
  if (format === "docx") {
    saveDownload(await exportDocx(game, groups, assets), filename);
  } else {
    const bytes = await exportPdf(game, groups, assets);
    saveDownload(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), filename);
  }
}
