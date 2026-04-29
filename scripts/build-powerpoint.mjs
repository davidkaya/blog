#!/usr/bin/env node

/**
 * Builds PowerPoint decks from reveal-md presentation markdown in talks/.
 *
 * This is a pragmatic Markdown-to-PPTX export. It preserves slide structure,
 * speaker notes, headings, lists, tables, and code blocks, but it is not intended
 * to be pixel-identical to the reveal.js HTML output.
 */

import pptxgen from "pptxgenjs";
import puppeteer from "puppeteer";
import { createRequire } from "module";
import { mkdirSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { discoverTalks, TALKS_DIR } from "./talk-utils.mjs";

const require = createRequire(import.meta.url);
const MERMAID_SCRIPT = require.resolve("mermaid/dist/mermaid.min.js");
const OUT_DIR = join("public", "powerpoint");
const SLIDE_W = 13.333;
const SLIDE_H = 7.5;
const BODY_X = 0.65;
const BODY_W = 12.05;
const BODY_TOP = 1.16;
const BODY_BOTTOM = 6.84;

const COLORS = {
  bg: "0A0E14",
  surface: "0D1117",
  surfaceAlt: "131720",
  border: "1C2333",
  text: "B3B1AD",
  bright: "E6E1CF",
  muted: "626A7A",
  cyan: "39BAE6",
  gold: "E6B450",
  green: "23D18B",
};

const TEXT_BASE = {
  breakLine: false,
  fit: "none",
  margin: 0,
  paraSpaceAfter: 0,
  paraSpaceBefore: 0,
  valign: "top",
};

class MermaidRenderer {
  browser = null;
  page = null;
  renderCount = 0;

  async init() {
    if (this.page) return;

    this.browser = await puppeteer.launch({ headless: "new" });
    this.page = await this.browser.newPage();
    await this.page.setViewport({
      width: 1600,
      height: 1000,
      deviceScaleFactor: 2,
    });
    await this.page.setContent(`
      <!doctype html>
      <html>
        <body>
          <div id="mermaid-target"></div>
        </body>
      </html>
    `);
    await this.page.addStyleTag({
      content: `
        html, body {
          background: transparent;
          margin: 0;
          padding: 0;
        }

        #mermaid-target {
          display: inline-block;
          background: transparent;
        }

        #mermaid-target svg {
          background: transparent !important;
          display: block;
        }
      `,
    });
    await this.page.addScriptTag({ path: MERMAID_SCRIPT });
    await this.page.evaluate((themeVariables) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        theme: "dark",
        themeVariables,
      });
    }, {
      background: "transparent",
      mainBkg: `#${COLORS.surface}`,
      primaryColor: `#${COLORS.surface}`,
      primaryTextColor: `#${COLORS.bright}`,
      primaryBorderColor: `#${COLORS.cyan}`,
      lineColor: `#${COLORS.cyan}`,
      secondaryColor: `#${COLORS.surfaceAlt}`,
      tertiaryColor: `#${COLORS.bg}`,
      edgeLabelBackground: `#${COLORS.bg}`,
      clusterBkg: `#${COLORS.bg}`,
      clusterBorder: `#${COLORS.border}`,
      fontFamily: "JetBrains Mono, Cascadia Code, monospace",
    });
  }

  async render(source) {
    await this.init();

    const id = `mermaid-${++this.renderCount}`;
    await this.page.evaluate(async ({ id, source }) => {
      const target = document.getElementById("mermaid-target");
      target.innerHTML = "";

      const result = await mermaid.render(id, source);
      target.innerHTML = result.svg;

      const svg = target.querySelector("svg");
      svg.removeAttribute("height");
      svg.style.background = "transparent";
    }, { id, source });

    const element = await this.page.$("#mermaid-target svg");
    if (!element) {
      throw new Error("Mermaid rendered no SVG output.");
    }

    const box = await element.boundingBox();
    const image = await element.screenshot({
      encoding: "base64",
      omitBackground: true,
    });

    return {
      data: `image/png;base64,${image}`,
      width: Math.max(1, box?.width || 1),
      height: Math.max(1, box?.height || 1),
    };
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

function stripFrontmatter(markdown) {
  return markdown.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
}

function splitSlides(markdown) {
  return stripFrontmatter(markdown)
    .split(/^---\s*$/m)
    .map((slide) => slide.trim())
    .filter(Boolean)
    .map((slide) => {
      const parts = slide.split(/^Note:\s*$/m);
      return {
        body: parts[0].trim(),
        notes: parts.slice(1).join("\n").trim(),
      };
    });
}

function cleanText(value) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .trim();
}

function isTableRow(line) {
  return /^\s*\|.*\|\s*$/.test(line);
}

function isSpecialLine(line) {
  const trimmed = line.trim();
  return (
    /^#{1,6}\s+/.test(trimmed) ||
    /^```/.test(trimmed) ||
    /^[-*]\s+/.test(trimmed) ||
    /^\d+\.\s+/.test(trimmed) ||
    /^>\s?/.test(trimmed) ||
    isTableRow(trimmed)
  );
}

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cleanText(cell));
}

function isAlignmentRow(cells) {
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function parseBlocks(markdown) {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length,
        text: cleanText(heading[2]),
      });
      i += 1;
      continue;
    }

    const fence = trimmed.match(/^```(\w+)?/);
    if (fence) {
      const language = fence[1] || "text";
      const code = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push({ type: "code", language, text: code.join("\n").trimEnd() });
      continue;
    }

    if (isTableRow(trimmed)) {
      const rows = [];
      while (i < lines.length && isTableRow(lines[i].trim())) {
        const row = parseTableRow(lines[i]);
        if (!isAlignmentRow(row)) rows.push(row);
        i += 1;
      }
      blocks.push({ type: "table", rows });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const ordered = /^\d+\.\s+/.test(trimmed);
      const items = [];
      while (i < lines.length) {
        const current = lines[i].trim();
        const bullet = current.match(/^[-*]\s+(.*)$/);
        const number = current.match(/^\d+\.\s+(.*)$/);
        if (!bullet && !number) break;
        items.push(cleanText((bullet || number)[1]));
        i += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quote.push(lines[i].trim().replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "quote", text: cleanText(quote.join(" ")) });
      continue;
    }

    const paragraph = [];
    while (i < lines.length && lines[i].trim() && !isSpecialLine(lines[i])) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "paragraph", text: cleanText(paragraph.join(" ")) });
  }

  return blocks;
}

function estimateLines(text, width, fontSize) {
  const averageMonoCharWidth = fontSize * 0.62;
  const charsPerLine = Math.max(20, Math.floor((width * 72) / averageMonoCharWidth));
  return text
    .split("\n")
    .reduce((count, line) => count + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
}

async function renderMermaidBlocks(blocks, renderer) {
  for (const block of blocks) {
    if (block.type === "code" && block.language === "mermaid") {
      block.image = await renderer.render(block.text);
    }
  }
}

function addSlideChrome(pptx, slide, talk, slideNumber, slideCount) {
  slide.background = { color: COLORS.bg };
  slide.addShape(pptx.ShapeType.line, {
    x: BODY_X,
    y: 6.98,
    w: BODY_W,
    h: 0,
    line: { color: COLORS.border, transparency: 15, width: 0.7 },
  });
  slide.addText(talk.title, {
    x: BODY_X,
    y: 7.05,
    w: 7,
    h: 0.18,
    fontFace: "JetBrains Mono",
    fontSize: 7,
    color: COLORS.muted,
    ...TEXT_BASE,
  });
  slide.addText(`${slideNumber}/${slideCount}`, {
    x: 11.85,
    y: 7.05,
    w: 0.85,
    h: 0.18,
    fontFace: "JetBrains Mono",
    fontSize: 7,
    color: COLORS.muted,
    align: "right",
    ...TEXT_BASE,
  });
}

function renderTitleSlide(slide, blocks) {
  const title = blocks.find((block) => block.type === "heading" && block.level === 1)?.text || "";
  const subtitle = blocks.find((block) => block.type === "heading" && block.level === 3)?.text || "";
  const byline = blocks.find((block) => block.type === "paragraph")?.text || "";

  slide.addText(title, {
    x: 0.7,
    y: 2.05,
    w: SLIDE_W - 1.4,
    h: 0.65,
    fontFace: "JetBrains Mono",
    fontSize: 34,
    bold: true,
    color: COLORS.cyan,
    align: "center",
    fit: "shrink",
    margin: 0,
  });
  slide.addText(subtitle, {
    x: 0.9,
    y: 2.92,
    w: SLIDE_W - 1.8,
    h: 0.35,
    fontFace: "JetBrains Mono",
    fontSize: 16,
    color: COLORS.gold,
    align: "center",
    fit: "shrink",
    margin: 0,
  });
  slide.addText(byline, {
    x: 1.2,
    y: 3.48,
    w: SLIDE_W - 2.4,
    h: 0.28,
    fontFace: "JetBrains Mono",
    fontSize: 12,
    color: COLORS.bright,
    align: "center",
    fit: "shrink",
    margin: 0,
  });
}

function renderHeading(slide, block, y) {
  const isMain = block.level <= 2;
  const fontSize = isMain ? 27 : 17;
  const color = isMain ? COLORS.cyan : COLORS.gold;
  const height = isMain ? 0.55 : 0.35;

  slide.addText(block.text, {
    x: BODY_X,
    y,
    w: BODY_W,
    h: height,
    fontFace: "JetBrains Mono",
    fontSize,
    bold: true,
    color,
    ...TEXT_BASE,
  });

  return y + height + (isMain ? 0.22 : 0.1);
}

function renderParagraph(slide, block, y, options = {}) {
  const fontSize = options.fontSize || 14;
  const lines = estimateLines(block.text, BODY_W, fontSize);
  const height = Math.max(0.34, lines * fontSize * 0.018);

  slide.addText(block.text, {
    x: BODY_X,
    y,
    w: BODY_W,
    h: Math.min(height, BODY_BOTTOM - y),
    fontFace: "JetBrains Mono",
    fontSize,
    color: options.color || COLORS.text,
    bold: options.bold || false,
    italic: options.italic || false,
    lineSpacing: Math.round(fontSize * 1.1),
    ...TEXT_BASE,
  });

  return y + Math.min(height, BODY_BOTTOM - y) + 0.14;
}

function renderList(slide, block, y) {
  const text = block.items
    .map((item, index) => `${block.ordered ? `${index + 1}.` : "-"} ${item}`)
    .join("\n");
  const fontSize = 13;
  const lines = estimateLines(text, BODY_W - 0.2, fontSize);
  const height = Math.max(0.45, lines * fontSize * 0.02);

  slide.addText(text, {
    x: BODY_X + 0.15,
    y,
    w: BODY_W - 0.2,
    h: Math.min(height, BODY_BOTTOM - y),
    fontFace: "JetBrains Mono",
    fontSize,
    color: COLORS.text,
    lineSpacing: Math.round(fontSize * 1.12),
    ...TEXT_BASE,
  });

  return y + Math.min(height, BODY_BOTTOM - y) + 0.14;
}

function renderCode(slide, pptx, block, y) {
  if (block.language === "mermaid" && block.image) {
    return renderMermaidImage(slide, pptx, block, y);
  }

  const text = block.text;
  const fontSize = 9.5;
  const lines = estimateLines(text, BODY_W - 0.25, fontSize);
  const height = Math.min(Math.max(0.65, lines * fontSize * 0.017 + 0.24), BODY_BOTTOM - y);

  slide.addShape(pptx.ShapeType.rect, {
    x: BODY_X,
    y,
    w: BODY_W,
    h: height,
    fill: { color: COLORS.surface },
    line: { color: COLORS.border, width: 0.8 },
  });
  slide.addText(text, {
    x: BODY_X + 0.12,
    y: y + 0.1,
    w: BODY_W - 0.24,
    h: Math.max(0.2, height - 0.18),
    fontFace: "Cascadia Code",
    fontSize,
    color: COLORS.bright,
    lineSpacing: Math.round(fontSize * 1.1),
    ...TEXT_BASE,
  });

  return y + height + 0.18;
}

function renderMermaidImage(slide, pptx, block, y) {
  const availableHeight = Math.max(0.5, BODY_BOTTOM - y);
  const maxHeight = Math.min(availableHeight, 4.9);
  const aspect = block.image.width / block.image.height;
  let w = Math.min(BODY_W, maxHeight * aspect);
  let h = w / aspect;

  if (h > maxHeight) {
    h = maxHeight;
    w = h * aspect;
  }

  slide.addShape(pptx.ShapeType.rect, {
    x: BODY_X,
    y,
    w: BODY_W,
    h: h + 0.2,
    fill: { color: COLORS.surface },
    line: { color: COLORS.border, width: 0.8 },
  });
  slide.addImage({
    data: block.image.data,
    x: BODY_X + (BODY_W - w) / 2,
    y: y + 0.1,
    w,
    h,
  });

  return y + h + 0.38;
}

function renderTable(slide, pptx, block, y) {
  const rows = block.rows;
  const colCount = rows.reduce((max, row) => Math.max(max, row.length), 0);
  if (rows.length === 0 || colCount === 0) return y;

  const maxHeight = Math.max(0.4, BODY_BOTTOM - y);
  const rowH = Math.min(0.48, Math.max(0.28, maxHeight / rows.length));
  const tableH = Math.min(maxHeight, rowH * rows.length);
  const cellW = BODY_W / colCount;
  const fontSize = rows.length > 10 || colCount > 3 ? 7.5 : 9;

  rows.forEach((row, rowIndex) => {
    const rowY = y + rowIndex * rowH;
    row.forEach((cell, colIndex) => {
      const x = BODY_X + colIndex * cellW;
      const isHeader = rowIndex === 0;

      slide.addShape(pptx.ShapeType.rect, {
        x,
        y: rowY,
        w: cellW,
        h: rowH,
        fill: { color: isHeader ? COLORS.surfaceAlt : COLORS.surface },
        line: { color: COLORS.border, width: 0.4 },
      });
      slide.addText(cell, {
        x: x + 0.04,
        y: rowY + 0.04,
        w: cellW - 0.08,
        h: rowH - 0.08,
        fontFace: "JetBrains Mono",
        fontSize,
        bold: isHeader,
        color: isHeader ? COLORS.cyan : COLORS.text,
        lineSpacing: Math.round(fontSize * 1.05),
        ...TEXT_BASE,
      });
    });
  });

  return y + tableH + 0.18;
}

function renderBlocks(slide, pptx, blocks, startIndex) {
  let y = BODY_TOP;

  for (const block of blocks.slice(startIndex)) {
    if (y >= BODY_BOTTOM) break;

    switch (block.type) {
      case "heading":
        y = renderHeading(slide, block, y);
        break;
      case "paragraph":
        y = renderParagraph(slide, block, y);
        break;
      case "quote":
        y = renderParagraph(slide, block, y, {
          color: COLORS.muted,
          italic: true,
          fontSize: 13,
        });
        break;
      case "list":
        y = renderList(slide, block, y);
        break;
      case "code":
        y = renderCode(slide, pptx, block, y);
        break;
      case "table":
        y = renderTable(slide, pptx, block, y);
        break;
      default:
        break;
    }
  }
}

function renderContentSlide(slide, pptx, blocks) {
  const startsWithTitle = blocks[0]?.type === "heading";
  const startIndex = startsWithTitle ? 1 : 0;

  if (startsWithTitle) {
    renderHeading(slide, blocks[0], 0.42);
  }

  renderBlocks(slide, pptx, blocks, startIndex);
}

async function buildTalk(talk) {
  const markdown = readFileSync(talk.src, "utf-8");
  const slides = splitSlides(markdown);
  const pptx = new pptxgen();
  const mermaidRenderer = new MermaidRenderer();

  pptx.defineLayout({ name: "BLOG_WIDE", width: SLIDE_W, height: SLIDE_H });
  pptx.layout = "BLOG_WIDE";
  pptx.author = "David Kaya";
  pptx.company = "Microsoft";
  pptx.subject = `${talk.title} PowerPoint export`;
  pptx.title = talk.title;
  pptx.lang = "en-US";
  pptx.theme = {
    headFontFace: "JetBrains Mono",
    bodyFontFace: "JetBrains Mono",
    lang: "en-US",
  };

  try {
    for (const [index, deckSlide] of slides.entries()) {
      const slide = pptx.addSlide();
      const blocks = parseBlocks(deckSlide.body);
      await renderMermaidBlocks(blocks, mermaidRenderer);
      addSlideChrome(pptx, slide, talk, index + 1, slides.length);

      if (index === 0) {
        renderTitleSlide(slide, blocks);
      } else {
        renderContentSlide(slide, pptx, blocks);
      }

      if (deckSlide.notes) {
        slide.addNotes(deckSlide.notes);
      }
    }
  } finally {
    await mermaidRenderer.close();
  }

  const outFile = join(OUT_DIR, `${talk.slug}.pptx`);
  try {
    await pptx.writeFile({ fileName: outFile });
  } catch (error) {
    if (error?.code === "EPERM") {
      throw new Error(`${outFile} is locked. Close it in PowerPoint or Explorer preview and try again.`);
    }
    throw error;
  }
  console.log(`✓ ${outFile}`);
}

const talks = discoverTalks(TALKS_DIR);
console.log(`Found ${talks.length} talk(s): ${talks.map((t) => t.slug).join(", ")}`);

mkdirSync(OUT_DIR, { recursive: true });

for (const talk of talks) {
  const outFile = join(OUT_DIR, `${talk.slug}.pptx`);
  try {
    rmSync(outFile, { force: true, maxRetries: 5, retryDelay: 200 });
  } catch (error) {
    if (error?.code === "EPERM") {
      console.warn(`! ${outFile} is locked; attempting to overwrite it.`);
    } else {
      throw error;
    }
  }
}

for (const talk of talks) {
  await buildTalk(talk);
}

console.log(`✓ PowerPoint decks built in ${OUT_DIR}`);
