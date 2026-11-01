import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

import {
  layoutPaper,
  PAPER,
  subjectName,
  type Worksheet,
  type PaperPage,
} from "./worksheet";

export type FontBytes = { regular: Uint8Array; bold: Uint8Array };
let fontPromise: Promise<FontBytes> | undefined;
export function loadFonts(): Promise<FontBytes> {
  return (fontPromise ??= (async () => {
    try {
      const get = async (name: string) => {
        const r = await fetch(`${import.meta.env.BASE_URL}fonts/${name}.ttf`);
        if (!r.ok) throw new Error("Písmo pro export se nepodařilo načíst.");
        return new Uint8Array(await r.arrayBuffer());
      };
      return {
        regular: await get("NotoSans-Regular"),
        bold: await get("NotoSans-Bold"),
      };
    } catch (e) {
      fontPromise = undefined;
      throw e;
    }
  })());
}
// Use universally supported text for the printable equivalents of UI symbols.
export const printable = (s: string) =>
  s.replaceAll("□", "[    ]").replaceAll("→", "->").replaceAll("−", "-");
export async function prepareLayout(
  w: Worksheet,
  solutions = false,
  bytes?: FontBytes,
) {
  const fonts = bytes || (await loadFonts());
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(fonts.regular, { subset: true }),
    bold = await pdf.embedFont(fonts.bold, { subset: true });
  const pages = layoutPaper(w, solutions, (s, size, isBold) =>
    (isBold ? bold : regular).widthOfTextAtSize(printable(s), size),
  );
  return { pdf, regular, bold, pages };
}
export function paperTitle(w: Worksheet, solutions: boolean) {
  return `${subjectName(w.subject)} - ${solutions ? "řešení pro rodiče" : "cvičná písemka"}`;
}
export async function exportPdf(
  w: Worksheet,
  solutions = false,
  bytes?: FontBytes,
): Promise<Uint8Array> {
  const { pdf, regular, bold, pages } = await prepareLayout(
    w,
    solutions,
    bytes,
  );
  pdf.setTitle(paperTitle(w, solutions));
  pdf.setAuthor("Škola hrou");
  pdf.setSubject(`Varianta ${w.id}`);
  pages.forEach((model, index) => {
    const p = pdf.addPage([PAPER.width, PAPER.height]);
    const text = (
      s: string,
      x: number,
      y: number,
      size: number,
      isBold = false,
    ) =>
      p.drawText(printable(s), {
        x,
        y: PAPER.height - y - size,
        font: isBold ? bold : regular,
        size,
        color: rgb(0, 0, 0),
      });
    text(paperTitle(w, solutions), PAPER.margin, 44, 18, true);
    text(`2. třída   |   Varianta ${w.id}`, PAPER.margin, 76, 10);
    if (solutions)
      text(
        "Řešení patří ke stejnému označení varianty na zadání.",
        PAPER.margin,
        105,
        11,
      );
    else
      text(
        "Jméno: __________________________    Datum: ______________",
        PAPER.margin,
        105,
        12,
      );
    let y = PAPER.bodyTop;
    model.rows.forEach((row) => {
      row.cells.forEach((cell, c) => {
        const x =
          PAPER.margin + (c * (PAPER.width - 2 * PAPER.margin + 26)) / 2;
        if (row.rule)
          p.drawLine({
            start: { x, y: PAPER.height - y - 20 },
            end: {
              x:
                row.cells.length === 1
                  ? PAPER.width - PAPER.margin
                  : x + (PAPER.width - 2 * PAPER.margin - 26) / 2,
              y: PAPER.height - y - 20,
            },
            thickness: 0.5,
            color: rgb(0.5, 0.5, 0.5),
          });
        else text(cell, x, y, row.size, row.bold);
      });
      y += row.height;
    });
    text(`Škola hrou   |   Varianta ${w.id}`, PAPER.margin, 795, 9);
    text(
      `${index + 1} / ${pages.length}`,
      PAPER.width - PAPER.margin - 35,
      795,
      9,
    );
  });
  return pdf.save();
}
export async function exportDocx(
  w: Worksheet,
  solutions = false,
  bytes?: FontBytes,
): Promise<Blob> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    TabStopType,
    Tab,
    LineRuleType,
    HeadingLevel,
    PageNumber,
    Footer,
    AlignmentType,
    SectionType,
  } = await import("docx");
  const { pages } = await prepareLayout(w, solutions, bytes);
  const pt = (n: number) => Math.round(n * 20);
  const para = (text: string, size: number, height: number, bold = false) =>
    new Paragraph({
      spacing: {
        before: 0,
        after: 0,
        line: pt(height),
        lineRule: LineRuleType.EXACT,
      },
      children: [
        new TextRun({
          text: printable(text),
          size: size * 2,
          bold,
          font: "Arial",
        }),
      ],
    });
  const sections = pages.map((page: PaperPage, pageIndex: number) => ({
    properties: {
      type: SectionType.NEXT_PAGE,
      page: {
        size: { width: pt(PAPER.width), height: pt(PAPER.height) },
        margin: {
          top: pt(44),
          bottom: pt(54),
          left: pt(PAPER.margin),
          right: pt(PAPER.margin),
          footer: pt(28),
        },
      },
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `Škola hrou | Varianta ${w.id} | `,
                size: 18,
              }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
            ],
          }),
        ],
      }),
    },
    children: [
      new Paragraph({
        heading: HeadingLevel.TITLE,
        pageBreakBefore: pageIndex > 0,
        spacing: {
          before: 0,
          after: 0,
          line: pt(32),
          lineRule: LineRuleType.EXACT,
        },
        children: [
          new TextRun({
            text: paperTitle(w, solutions),
            bold: true,
            size: 36,
            color: "000000",
            font: "Arial",
          }),
        ],
      }),
      para(`2. třída | Varianta ${w.id}`, 10, 29),
      para(
        solutions
          ? "Řešení patří ke stejnému označení varianty na zadání."
          : "Jméno: __________________________    Datum: ______________",
        12,
        40,
      ),
      ...page.rows.map(
        (row) =>
          new Paragraph({
            tabStops: [
              {
                type: TabStopType.LEFT,
                position: pt((PAPER.width - 2 * PAPER.margin + 26) / 2),
              },
            ],
            spacing: {
              before: 0,
              after: 0,
              line: pt(row.height),
              lineRule: LineRuleType.EXACT,
            },
            children: row.cells.length
              ? row.cells.flatMap((cell, i) => [
                  ...(i ? [new TextRun({ children: [new Tab()] })] : []),
                  new TextRun({
                    text: row.rule
                      ? row.cells.length === 1
                        ? "________________________________________________________"
                        : "________________________"
                      : printable(cell),
                    size: row.size * 2,
                    bold: row.bold,
                    font: "Arial",
                  }),
                ])
              : [new TextRun({ text: "", size: 2 })],
          }),
      ),
    ],
  }));
  return Packer.toBlob(
    new Document({
      creator: "Škola hrou",
      title: paperTitle(w, solutions),
      description: `Varianta ${w.id}`,
      styles: {
        default: {
          document: {
            run: { font: "Arial", size: 28, color: "000000" },
            paragraph: { spacing: { after: 0 } },
          },
        },
        paragraphStyles: [
          {
            id: "Title",
            name: "Title",
            basedOn: "Normal",
            next: "Normal",
            run: { color: "000000", bold: true, size: 36 },
          },
        ],
      },
      sections: [
        { ...sections[0], children: sections.flatMap((s) => s.children) },
      ],
    }),
  );
}
export function saveDownload(
  data: Blob | Uint8Array,
  filename: string,
  mime = "application/pdf",
) {
  const blob =
    data instanceof Blob
      ? data
      : new Blob([new Uint8Array(data).buffer], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
