import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { Document, ImageRun, Packer, Paragraph, TextRun } from "docx";
import { loadFonts, saveDownload } from "./export";
import { paperGraphic, renderPreschoolGraphic } from "./preschool-paper-art";
import { picturePath, pictureLabel, preschoolGames, type Picture, type PreschoolGame, type PreschoolRound } from "./preschool";

import type { PreschoolTestItem } from "./preschool-test";

type PaperPage = { game: PreschoolGame; rounds: Cell[][][]; offset: number };
type Graphic = `graphic-${number}`;
type Cell = Picture | "blank" | Graphic;
const isGraphic = (cell: Cell): cell is Graphic => cell.startsWith("graphic-");
const a4 = { width: 595.28, height: 841.89 };
function rows(game: PreschoolGame, round: PreschoolRound, index: number): Cell[][] {
  if (round.kind === "story") return [round.options, round.options.map(() => "blank")];
  if (round.kind !== "choice") return [[`graphic-${index}`]];
  const prompt: Cell[] = [...round.prompt];
  if (game === "pattern") prompt.push("blank");
  return prompt.length ? [prompt, round.options] : [round.options];
}

async function imageBytes(picture: Picture) {
  const response = await fetch(picturePath(picture));
  if (!response.ok) throw new Error("Ilustraci se nepodařilo načíst.");
  return new Uint8Array(await response.arrayBuffer());
}

async function exportPdf(pages: PaperPage[], assets: Map<Picture | Graphic, Uint8Array>) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fonts = await loadFonts();
  const regular = await pdf.embedFont(fonts.regular, { subset: true });
  const bold = await pdf.embedFont(fonts.bold, { subset: true });
  const images = new Map(await Promise.all([...assets].map(async ([id, bytes]) => [id, await pdf.embedPng(bytes)] as const)));
  const ink = rgb(.13, .23, .18);
  pdf.setTitle(pages.length === 1 ? preschoolGames[pages[0].game].title : "Předškolácký test");
  pdf.setAuthor("Škola hrou");
  for (const { game, rounds, offset } of pages) {
    const page = pdf.addPage([a4.width, a4.height]);
    const { title, instruction } = preschoolGames[game];
    page.drawText("Škola hrou  /  Předškolák", { x: 42, y: 799, size: 11, font: regular, color: ink });
    page.drawText(title, { x: 42, y: 765, size: 24, font: bold, color: ink });
    page.drawText(instruction, { x: 42, y: 739, size: 12, font: regular, color: ink });
    rounds.forEach((group, i) => {
      const top = 703 - i * 133;
      page.drawText(`${offset + i + 1}.`, { x: 42, y: top - 21, size: 12, font: bold, color: ink });
      group.forEach((row, rowIndex) => {
        const gap = 4;
        const size = Math.min(45, (a4.width - 118 - (row.length - 1) * gap) / row.length);
        const y = top - size - rowIndex * 57;
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
  }
  return pdf.save();
}

async function exportDocx(pages: PaperPage[], assets: Map<Picture | Graphic, Uint8Array>) {
  const blank = pages.some(page => page.game === "story") ? await storyWritingBox() : undefined;
  const document = new Document({
    creator: "Škola hrou",
    title: pages.length === 1 ? preschoolGames[pages[0].game].title : "Předškolácký test",
    sections: pages.map(({ game, rounds, offset }) => {
      const { title, instruction } = preschoolGames[game];
      return {
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 650, bottom: 650, left: 850, right: 850 } } },
        children: [
          new Paragraph({ children: [new TextRun({ text: "Škola hrou  /  Předškolák", size: 20 })] }),
          new Paragraph({ spacing: { before: 140, after: 100 }, children: [new TextRun({ text: title, size: 38, bold: true })] }),
          new Paragraph({ text: instruction, spacing: { after: 250 } }),
          ...rounds.flatMap((group, index) => group.map((row, rowIndex) => new Paragraph({
            keepNext: rowIndex + 1 < group.length,
            spacing: { before: rowIndex ? 60 : 100, after: rowIndex + 1 === group.length ? 170 : 0 },
            children: [
              new TextRun({ text: rowIndex === 0 ? `${offset + index + 1}.   ` : "      ", bold: true }),
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
        ],
      };
    }),
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

async function printSheet(pages: PaperPage[], graphics: Map<Graphic, Uint8Array>) {
  const root = document.createElement("div");
  root.className = "print-root preschool-paper-root";
  const images: HTMLImageElement[] = [];
  const urls: string[] = [];
  const cleanup = () => {
    root.remove();
    urls.forEach(url => URL.revokeObjectURL(url));
  };
  for (const { game, rounds, offset } of pages) {
    const page = document.createElement("article");
    page.className = "preschool-paper-page";
    const title = document.createElement("h1");
    title.textContent = preschoolGames[game].title;
    const instruction = document.createElement("p");
    instruction.textContent = preschoolGames[game].instruction;
    const header = document.createElement("small");
    header.textContent = "Škola hrou / Předškolák";
    page.append(header, title, instruction);
    rounds.forEach((group, index) => {
      const rowGroup = document.createElement("section");
      rowGroup.className = `preschool-paper-round ${game}`;
      const number = document.createElement("b");
      number.textContent = `${offset + index + 1}.`;
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
    root.append(page);
  }
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
  return downloadPreschoolItems(rounds.map(round => ({ game, round })), format, game);
}

export async function downloadPreschoolItems(items: PreschoolTestItem[], format: "pdf" | "docx" | "print", name = "test") {
  const pages: PaperPage[] = [];
  const graphics = new Map<Graphic, Uint8Array>();
  const used = new Set<Picture>();
  await Promise.all(items.map(async ({ game, round }, index) => {
    let page = pages.at(-1);
    if (!page || page.game !== game || page.rounds.length === 5) {
      page = { game, rounds: [], offset: index };
      pages.push(page);
    }
    const group = rows(game, round, index);
    page.rounds.push(group);
    for (const cell of group.flat()) if (cell !== "blank" && !isGraphic(cell)) used.add(cell);
    if (round.kind !== "choice" && round.kind !== "story") {
      graphics.set(`graphic-${index}`, await renderPreschoolGraphic(round));
    }
  }));
  if (format === "print") return printSheet(pages, graphics);
  const assets = new Map<Picture | Graphic, Uint8Array>([
    ...graphics,
    ...await Promise.all([...used].map(async id => [id, await imageBytes(id)] as const)),
  ]);
  const filename = `skola-hrou-predskolak-${name}.${format}`;
  if (format === "docx") {
    saveDownload(await exportDocx(pages, assets), filename);
  } else {
    const bytes = await exportPdf(pages, assets);
    saveDownload(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), filename);
  }
}
