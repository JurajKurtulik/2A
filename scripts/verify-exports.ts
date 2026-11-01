import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createWorksheet } from "../src/worksheet";
import { exportPdf, exportDocx, prepareLayout } from "../src/export";
import { topics, type Subject } from "../src/content";
await mkdir("preview/exports", { recursive: true });
const fonts = {
  regular: await readFile("public/fonts/NotoSans-Regular.ttf"),
  bold: await readFile("public/fonts/NotoSans-Bold.ttf"),
};
for (const subject of ["math", "czech"] as Subject[]) {
  const w = createWorksheet(
    subject,
    topics
      .filter((t) => t.subject === subject)
      .map((t) => ({ topic: t.id, count: subject === "math" ? 4 : 2 })),
  );
  await writeFile(
    `preview/exports/${subject}.json`,
    JSON.stringify(w, null, 2),
  );
  for (const solutions of [false, true]) {
    const name = `${subject}${solutions ? "-solutions" : ""}`;
    await writeFile(
      `preview/exports/${name}.pdf`,
      await exportPdf(w, solutions, fonts),
    );
    await writeFile(
      `preview/exports/${name}.docx`,
      new Uint8Array(
        await (await exportDocx(w, solutions, fonts)).arrayBuffer(),
      ),
    );
    console.log(
      `${name}: ${(await prepareLayout(w, solutions, fonts)).pages.length} pages`,
    );
  }
}
