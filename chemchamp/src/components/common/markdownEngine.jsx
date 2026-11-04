import React from "react";
import katex from "katex";

/* =========================================================================
   ChemChamp Markdown + KaTeX Engine
   - Block: headings, $$ / \[ \] math, tables (GFM), ordered/unordered nested
     lists (English + বাংলা numerals), blockquotes & callouts (💡 ⚠️ [!TIP] ...),
     fenced code, horizontal rule, images, paragraphs with line breaks.
   - Inline: $..$, $$..$$, \( \), **bold**, *italic*, ~~strike~~, ==highlight==,
     `code`, [link](url) — math inside bold/italic works correctly.
   ========================================================================= */

const mathCache = new Map();

export function renderTex(tex, displayMode = false) {
  const key = `${displayMode ? "D" : "I"}::${tex}`;
  if (mathCache.has(key)) return mathCache.get(key);
  let html;
  try {
    html = katex.renderToString(String(tex).trim(), {
      displayMode,
      throwOnError: false,
      strict: "ignore",
      trust: false,
    });
  } catch {
    html = String(tex);
  }
  if (mathCache.size > 800) mathCache.clear();
  mathCache.set(key, html);
  return html;
}

/* ----------------------------- INLINE ----------------------------- */

const PH = "\u0001";

export function renderInline(input, keyPrefix = "i") {
  if (input === null || input === undefined || input === "") return null;
  let s = String(input);
  const maths = [];
  const codes = [];
  let k = 0;
  const nextKey = () => `${keyPrefix}-${k++}`;

  // 1. Protect inline code
  s = s.replace(/`([^`\n]+)`/g, (_, c) => {
    codes.push(c);
    return `${PH}C${codes.length - 1}${PH}`;
  });
  // 2. Protect math (display first, then inline)
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
    maths.push({ tex, display: true });
    return `${PH}M${maths.length - 1}${PH}`;
  });
  s = s.replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => {
    maths.push({ tex, display: true });
    return `${PH}M${maths.length - 1}${PH}`;
  });
  s = s.replace(/\\\(([\s\S]+?)\\\)/g, (_, tex) => {
    maths.push({ tex, display: false });
    return `${PH}M${maths.length - 1}${PH}`;
  });
  s = s.replace(/(^|[^\\])\$([^$\n]+?)\$/g, (_, pre, tex) => {
    maths.push({ tex, display: false });
    return `${pre}${PH}M${maths.length - 1}${PH}`;
  });
  s = s.replace(/\\\$/g, "$");

  // 3. Protect HTML line breaks (<br>, <br/>, <br />, </br>)
  s = s.replace(/<br\s*\/?>|<\/br>/gi, () => `${PH}B0${PH}`);

  const restore = (str) => {
    const parts = str.split(new RegExp(`${PH}([MCB])(\\d+)${PH}`, "g"));
    const out = [];
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0) {
        if (parts[i]) out.push(<React.Fragment key={nextKey()}>{parts[i]}</React.Fragment>);
      } else if (i % 3 === 1) {
        const kind = parts[i];
        const idx = Number(parts[i + 1]);
        if (kind === "B") {
          out.push(<br key={nextKey()} />);
        } else if (kind === "M") {
          const m = maths[idx];
          out.push(
            <span
              key={nextKey()}
              className={
                m.display
                  ? "block my-3 overflow-x-auto overflow-y-hidden text-center text-slate-100"
                  : "cc-inline-math text-emerald-300"
              }
              dangerouslySetInnerHTML={{ __html: renderTex(m.tex, m.display) }}
            />
          );
        } else {
          out.push(
            <code
              key={nextKey()}
              className="px-1.5 py-0.5 rounded-md bg-slate-800/80 text-amber-200 font-mono text-[0.85em]"
            >
              {codes[idx]}
            </code>
          );
        }
        i++; // skip index part
      }
    }
    return out;
  };

  const EMPH =
    /(\*\*)([\s\S]+?)\*\*|~~([\s\S]+?)~~|==([\s\S]+?)==|\[([^\]]+)\]\(([^)\s]+)\)|(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\*)/;

  const parse = (str) => {
    const out = [];
    let rest = str;
    while (rest) {
      const m = rest.match(EMPH);
      if (!m) {
        out.push(...restore(rest));
        break;
      }
      let start = m.index;
      let lead = "";
      if (m[8] !== undefined) {
        // italic match includes the leading char in group 7
        lead = m[7] || "";
        start = m.index + lead.length;
      }
      const before = rest.slice(0, m.index) + lead;
      if (before) out.push(...restore(before));

      if (m[2] !== undefined) {
        out.push(
          <strong key={nextKey()} className="font-bold text-white">
            {parse(m[2])}
          </strong>
        );
      } else if (m[3] !== undefined) {
        out.push(
          <del key={nextKey()} className="text-slate-500">
            {parse(m[3])}
          </del>
        );
      } else if (m[4] !== undefined) {
        out.push(
          <mark key={nextKey()} className="bg-amber-400/20 text-amber-100 rounded px-1">
            {parse(m[4])}
          </mark>
        );
      } else if (m[5] !== undefined) {
        out.push(
          <a
            key={nextKey()}
            href={m[6]}
            target="_blank"
            rel="noreferrer"
            className="text-teal-300 underline underline-offset-2 hover:text-teal-200"
          >
            {parse(m[5])}
          </a>
        );
      } else if (m[8] !== undefined) {
        out.push(
          <em key={nextKey()} className="italic text-slate-200">
            {parse(m[8])}
          </em>
        );
      }
      rest = rest.slice(start + (m[0].length - lead.length));
    }
    return out;
  };

  return parse(s);
}

/* ----------------------------- BLOCK ----------------------------- */

const LIST_RE = /^(\s*)([-*+•]|\d+[.)]|[০-৯]+[.)])\s+(.*)$/;
const TABLE_SEP_RE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function splitTableRow(row) {
  let r = row.trim();
  if (r.startsWith("|")) r = r.slice(1);
  if (r.endsWith("|") && !r.endsWith("\\|")) r = r.slice(0, -1);
  const cells = [];
  let buf = "";
  let inMath = false;
  for (let i = 0; i < r.length; i++) {
    const ch = r[i];
    if (ch === "$" && r[i - 1] !== "\\") inMath = !inMath;
    if (ch === "|" && !inMath && r[i - 1] !== "\\") {
      cells.push(buf.trim());
      buf = "";
    } else {
      buf += ch;
    }
  }
  cells.push(buf.trim());
  return cells;
}

function isBlockStart(line, nextLine) {
  const t = line.trim();
  if (!t) return true;
  if (t.startsWith("#")) return /^#{1,6}\s/.test(t);
  if (t.startsWith("$$") || t.startsWith("\\[") || t.startsWith("```") || t.startsWith(">")) return true;
  if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) return true;
  if (LIST_RE.test(line)) return true;
  if (/^!\[.*\]\(.*\)$/.test(t)) return true;
  if (t.includes("|") && nextLine !== undefined && TABLE_SEP_RE.test(nextLine)) return true;
  return false;
}

function buildListTree(items) {
  const root = { children: [] };
  const stack = [{ indent: -1, node: root }];
  items.forEach((it) => {
    while (stack.length > 1 && it.indent <= stack[stack.length - 1].indent) stack.pop();
    const li = { ...it, children: [] };
    stack[stack.length - 1].node.children.push(li);
    stack.push({ indent: it.indent, node: li });
  });
  return root.children;
}

function detectCallout(firstLine) {
  const t = firstLine.trim();
  const rules = [
    { re: /^\[!(TIP)\]\s*/i, variant: "tip" },
    { re: /^\[!(NOTE|INFO)\]\s*/i, variant: "note" },
    { re: /^\[!(IMPORTANT)\]\s*/i, variant: "important" },
    { re: /^\[!(WARNING|CAUTION)\]\s*/i, variant: "warning" },
    { re: /^!TRICK\s*/i, variant: "tip" },
    { re: /^!ALERT\s*/i, variant: "warning" },
    { re: /^💡\s*/, variant: "tip" },
    { re: /^⚠️\s*/, variant: "warning" },
    { re: /^📌\s*/, variant: "important" },
    { re: /^📝\s*/, variant: "note" },
  ];
  for (const r of rules) {
    if (r.re.test(t)) return { variant: r.variant, stripped: t.replace(r.re, "") };
  }
  return { variant: "quote", stripped: firstLine };
}

export function parseBlocks(content) {
  let text = String(content || "");
  // Firestore/JSON content sometimes stores literal "\n"
  if (!text.includes("\n") && text.includes("\\n")) text = text.replace(/\\n/g, "\n");
  text = text.replace(/\r\n?/g, "\n");

  const lines = text.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    if (!t) {
      i++;
      continue;
    }

    // Fenced code
    if (t.startsWith("```")) {
      const lang = t.slice(3).trim();
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) buf.push(lines[i++]);
      i++;
      blocks.push({ type: "code", lang, text: buf.join("\n") });
      continue;
    }

    // Display math $$ ... $$ (single or multi-line)
    if (t.startsWith("$$") || t.startsWith("\\[")) {
      const open = t.startsWith("$$") ? "$$" : "\\[";
      const close = open === "$$" ? "$$" : "\\]";
      const rest = t.slice(2);
      if (rest.trim().endsWith(close) && rest.trim().length >= 2) {
        blocks.push({ type: "math", tex: rest.trim().slice(0, -2) });
        i++;
        continue;
      }
      const buf = [rest];
      i++;
      while (i < lines.length) {
        const l = lines[i].trim();
        if (l.endsWith(close)) {
          buf.push(l.slice(0, -2));
          i++;
          break;
        }
        buf.push(lines[i]);
        i++;
      }
      blocks.push({ type: "math", tex: buf.join("\n") });
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Headings
    const hm = t.match(/^(#{1,6})\s+(.*)$/);
    if (hm) {
      blocks.push({ type: "heading", level: hm[1].length, text: hm[2].replace(/\s#+$/, "") });
      i++;
      continue;
    }

    // Image line
    const im = t.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (im) {
      blocks.push({ type: "image", alt: im[1], src: im[2] });
      i++;
      continue;
    }

    // Table
    if (t.includes("|") && i + 1 < lines.length && TABLE_SEP_RE.test(lines[i + 1])) {
      const header = splitTableRow(t);
      const aligns = splitTableRow(lines[i + 1]).map((c) => {
        const l = c.startsWith(":");
        const r = c.endsWith(":");
        return l && r ? "center" : r ? "right" : "left";
      });
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes("|")) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", header, aligns, rows });
      continue;
    }

    // Blockquote / Callout
    if (t.startsWith(">")) {
      const buf = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        buf.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      const { variant, stripped } = detectCallout(buf[0] || "");
      buf[0] = stripped;
      blocks.push({ type: "quote", variant, children: parseBlocks(buf.join("\n")) });
      continue;
    }

    // Lists
    if (LIST_RE.test(line)) {
      const items = [];
      while (i < lines.length) {
        const l = lines[i];
        const lm = l.match(LIST_RE);
        if (lm) {
          const indent = lm[1].replace(/\t/g, "  ").length;
          const marker = lm[2];
          items.push({
            indent,
            ordered: !/^[-*+•]$/.test(marker),
            marker,
            text: lm[3],
          });
          i++;
        } else if (l.trim() && /^\s{2,}/.test(l) && items.length) {
          // continuation line of previous item
          items[items.length - 1].text += "\n" + l.trim();
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: "list", tree: buildListTree(items) });
      continue;
    }

    // Paragraph (merge until next block start)
    const para = [line.trim()];
    i++;
    while (i < lines.length && !isBlockStart(lines[i], lines[i + 1])) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: "p", lines: para });
  }

  return blocks;
}

/* ----------------------------- RENDER ----------------------------- */

const CALLOUT_STYLES = {
  tip: { wrap: "border-emerald-400 bg-emerald-500/[0.07]", title: "text-emerald-300", label: "💡 পরীক্ষার ট্রিক" },
  note: { wrap: "border-sky-400 bg-sky-500/[0.07]", title: "text-sky-300", label: "📝 নোট" },
  important: { wrap: "border-violet-400 bg-violet-500/[0.07]", title: "text-violet-300", label: "📌 গুরুত্বপূর্ণ" },
  warning: { wrap: "border-amber-400 bg-amber-500/[0.07]", title: "text-amber-300", label: "⚠️ সতর্কতা ও ব্যতিক্রম" },
  quote: { wrap: "border-slate-600 bg-slate-800/20", title: "", label: "" },
};

function renderLines(lines, keyPrefix) {
  return lines.map((ln, idx) => (
    <React.Fragment key={`${keyPrefix}-l${idx}`}>
      {idx > 0 && <br />}
      {renderInline(ln, `${keyPrefix}-l${idx}`)}
    </React.Fragment>
  ));
}

function renderList(nodes, keyPrefix, depth = 0) {
  if (!nodes.length) return null;
  const ordered = nodes[0].ordered;
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={`space-y-1.5 ${depth > 0 ? "mt-1.5 ml-1" : "my-3"}`}>
      {nodes.map((n, idx) => (
        <li key={`${keyPrefix}-${idx}`} className="flex items-start gap-2.5">
          {ordered ? (
            <span className="min-w-[1.5rem] text-right font-bold text-teal-300 shrink-0 tabular-nums">
              {n.marker.replace(")", ".")}
            </span>
          ) : (
            <span
              className={`mt-[0.7em] w-1.5 h-1.5 rounded-full shrink-0 ${
                depth === 0 ? "bg-teal-400" : "bg-slate-500"
              }`}
            />
          )}
          <div className="flex-1 min-w-0">
            {renderLines(n.text.split("\n"), `${keyPrefix}-${idx}`)}
            {n.children.length > 0 && renderList(n.children, `${keyPrefix}-${idx}-c`, depth + 1)}
          </div>
        </li>
      ))}
    </Tag>
  );
}

export function renderBlocks(blocks, keyPrefix = "b") {
  return blocks.map((b, idx) => {
    const key = `${keyPrefix}-${idx}`;
    switch (b.type) {
      case "heading": {
        if (b.level === 1)
          return (
            <h1 key={key} className="text-2xl sm:text-3xl font-black text-white mt-8 mb-3 first:mt-0 leading-tight">
              {renderInline(b.text, key)}
            </h1>
          );
        if (b.level === 2)
          return (
            <h2
              key={key}
              className="text-xl sm:text-2xl font-extrabold text-white mt-8 mb-3 first:mt-0 pb-2 border-b border-slate-800/80 leading-snug"
            >
              {renderInline(b.text, key)}
            </h2>
          );
        if (b.level === 3)
          return (
            <h3 key={key} className="text-lg sm:text-xl font-bold text-teal-300 mt-6 mb-2 leading-snug">
              {renderInline(b.text, key)}
            </h3>
          );
        return (
          <h4 key={key} className="text-base font-bold text-amber-300 mt-5 mb-1.5">
            {renderInline(b.text, key)}
          </h4>
        );
      }
      case "math":
        return (
          <div
            key={key}
            className="my-5 py-2 px-3 overflow-x-auto overflow-y-hidden text-center text-slate-100 text-[1.05em]"
            dangerouslySetInnerHTML={{ __html: renderTex(b.tex, true) }}
          />
        );
      case "code":
        return (
          <pre
            key={key}
            className="my-4 p-4 rounded-xl bg-slate-900/80 overflow-x-auto text-xs sm:text-sm font-mono text-slate-200 leading-relaxed"
          >
            <code>{b.text}</code>
          </pre>
        );
      case "hr":
        return <hr key={key} className="my-8 border-slate-800" />;
      case "image":
        return (
          <figure key={key} className="my-6 text-center">
            <img
              src={b.src}
              alt={b.alt}
              loading="lazy"
              className="max-h-96 max-w-full rounded-xl object-contain mx-auto"
            />
            {b.alt && <figcaption className="text-xs text-slate-500 mt-2 italic">চিত্র: {b.alt}</figcaption>}
          </figure>
        );
      case "table":
        return (
          <div key={key} className="my-5 overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-900/80">
                <tr>
                  {b.header.map((h, hi) => (
                    <th
                      key={hi}
                      style={{ textAlign: b.aligns[hi] || "left" }}
                      className="px-4 py-2.5 font-bold text-teal-300 whitespace-nowrap border-b border-slate-800"
                    >
                      {renderInline(h, `${key}-h${hi}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((row, ri) => (
                  <tr key={ri} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-900/40">
                    {b.header.map((_, ci) => (
                      <td
                        key={ci}
                        style={{ textAlign: b.aligns[ci] || "left" }}
                        className="px-4 py-2.5 text-slate-300 align-top"
                      >
                        {renderInline(row[ci] || "", `${key}-r${ri}c${ci}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "quote": {
        const st = CALLOUT_STYLES[b.variant] || CALLOUT_STYLES.quote;
        return (
          <div key={key} className={`my-5 border-l-[3px] rounded-r-xl pl-4 pr-4 sm:pr-5 py-3.5 ${st.wrap}`}>
            {st.label && <div className={`text-xs font-extrabold mb-1.5 ${st.title}`}>{st.label}</div>}
            <div className="text-slate-200 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              {renderBlocks(b.children, key)}
            </div>
          </div>
        );
      }
      case "list":
        return <React.Fragment key={key}>{renderList(b.tree, key)}</React.Fragment>;
      case "p":
      default:
        return (
          <p key={key} className="my-3 text-slate-300">
            {renderLines(b.lines || [], key)}
          </p>
        );
    }
  });
}
