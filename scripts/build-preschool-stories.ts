import { access, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { longStories, shortStories, storyFrameId } from "../src/banks/preschool-stories";

const sharp = createRequire(new URL("../backend/package.json", import.meta.url))("sharp");
const source = process.argv[2];
if (!source) throw new Error("Pass the directory containing the Twemoji SVG assets.");
const target = "public/preschool/stories";
const backgrounds = ["#fff0d8", "#eaf3e1", "#e8f1fc", "#f9e8f0", "#f0ebfc"];
const placements = [
  [[25, 25, 142]],
  [[9, 49, 91], [92, 49, 91]],
  [[55, 8, 82], [10, 93, 83], [99, 93, 83]],
  [[16, 13, 76], [100, 13, 76], [16, 100, 76], [100, 100, 76]],
];

function iconName(icon: string) {
  const symbol = icon.includes("\u200d") ? icon : icon.replaceAll("\ufe0f", "");
  return [...symbol].map(character => character.codePointAt(0)!.toString(16)).join("-");
}

await mkdir(target, { recursive: true });
for (const [storyIndex, [id, frames]] of [...shortStories, ...longStories].entries()) {
  for (const [index, [art]] of frames.entries()) {
    const icons = art.split(" ");
    const placement = placements[icons.length - 1];
    if (!placement) throw new Error(`Unsupported icon count for ${id} scene ${index + 1}.`);
    const layers = await Promise.all(icons.map(async (icon, slot) => {
      const path = join(source, `${iconName(icon)}.svg`);
      await access(path).catch(() => { throw new Error(`Missing Twemoji graphic ${icon} (${path}).`); });
      const [left, top, size] = placement[slot];
      const input = await sharp(path, { density: 360 }).resize(size, size, { fit: "contain", background: "#00000000" }).png().toBuffer();
      return { input, left, top };
    }));
    await sharp({ create: { width: 192, height: 192, channels: 4, background: backgrounds[storyIndex % backgrounds.length] } })
      .composite(layers).png({ compressionLevel: 9 }).toFile(join(target, `${storyFrameId(id, index)}.png`));
  }
}
