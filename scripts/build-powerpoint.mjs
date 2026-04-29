#!/usr/bin/env node

/**
 * Builds PowerPoint decks from reveal-md presentation markdown in talks/.
 *
 * This is a pragmatic Markdown-to-PPTX export. It preserves slide structure,
 * speaker notes, headings, lists, tables, and code blocks, but it is not intended
 * to be pixel-identical to the reveal.js HTML output.
 */

import pptxgen from "pptxgenjs";
import { existsSync, mkdirSync, readFileSync, rmSync } from "fs";
import { join } from "path";
import { discoverTalks, TALKS_DIR } from "./talk-utils.mjs";

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
  const charsPerLine = Math.max(20, Math.floor((width * 17) / Math.max(fontSize, 8)));
  return text
    .split("\n")
    .reduce((count, line) => count + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
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
    fit: "shrink",
  });

  return y + height + (isMain ? 0.22 : 0.1);
}

function renderParagraph(slide, block, y, options = {}) {
  const fontSize = options.fontSize || 14;
  const lines = estimateLines(block.text, BODY_W, fontSize);
  const height = Math.max(0.34, lines * 0.25);

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
    fit: "shrink",
    breakLine: false,
    valign: "top",
  });

  return y + Math.min(height, BODY_BOTTOM - y) + 0.14;
}

function renderList(slide, block, y) {
  const text = block.items
    .map((item, index) => `${block.ordered ? `${index + 1}.` : "-"} ${item}`)
    .join("\n");
  const lines = estimateLines(text, BODY_W, 13);
  const height = Math.max(0.45, lines * 0.27);

  slide.addText(text, {
    x: BODY_X + 0.15,
    y,
    w: BODY_W - 0.2,
    h: Math.min(height, BODY_BOTTOM - y),
    fontFace: "JetBrains Mono",
    fontSize: 13,
    color: COLORS.text,
    fit: "shrink",
    breakLine: false,
    valign: "top",
  });

  return y + Math.min(height, BODY_BOTTOM - y) + 0.14;
}

function renderCode(slide, pptx, block, y) {
  const label = block.language === "mermaid" ? "mermaid diagram source" : block.language;
  const text = block.language === "mermaid" ? `${label}\n\n${block.text}` : block.text;
  const fontSize = block.language === "mermaid" ? 8.5 : 9.5;
  const lines = estimateLines(text, BODY_W - 0.25, fontSize);
  const height = Math.min(Math.max(0.65, lines * 0.18 + 0.2), BODY_BOTTOM - y);

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
    fit: "shrink",
    breakLine: false,
    valign: "top",
  });

  return y + height + 0.18;
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
        fit: "shrink",
        valign: "top",
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

  slides.forEach((deckSlide, index) => {
    const slide = pptx.addSlide();
    const blocks = parseBlocks(deckSlide.body);
    addSlideChrome(pptx, slide, talk, index + 1, slides.length);

    if (index === 0) {
      renderTitleSlide(slide, blocks);
    } else {
      renderContentSlide(slide, pptx, blocks);
    }

    if (deckSlide.notes) {
      slide.addNotes(deckSlide.notes);
    }
  });

  const outFile = join(OUT_DIR, `${talk.slug}.pptx`);
  await pptx.writeFile({ fileName: outFile });
  console.log(`✓ ${outFile}`);
}

const talks = discoverTalks(TALKS_DIR);
console.log(`Found ${talks.length} talk(s): ${talks.map((t) => t.slug).join(", ")}`);

if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

for (const talk of talks) {
  await buildTalk(talk);
}

console.log(`✓ PowerPoint decks built in ${OUT_DIR}`);
