import React, { useMemo } from "react";
import { renderInline, renderTex } from "./markdownEngine";

/**
 * KaTeXMath
 * - `$...$` / `$$...$$` মিশ্রিত বাংলা টেক্সট → ইনলাইন মার্কডাউন + সমীকরণ
 * - ডিলিমিটার ছাড়া কাঁচা LaTeX (যেমন `\text{মোট অরবিটাল} = n^2`) → সরাসরি KaTeX
 * `math` বা `text` (alias) prop দুটোই সাপোর্টেড।
 */
export default function KaTeXMath({ math, text, children, block = false, className = "" }) {
  const raw =
    math !== undefined && math !== null
      ? math
      : text !== undefined && text !== null
      ? text
      : typeof children === "string"
      ? children
      : "";

  const content = useMemo(() => {
    if (raw === "" || raw === null || raw === undefined) return null;
    const str = String(raw);

    const hasDelims = /\$|\\\(|\\\[/.test(str);
    if (hasDelims) {
      return renderInline(str, "km");
    }

    const looksLatex = /\\[a-zA-Z]+|[\^_]\{|[\^_][0-9a-zA-Z+\-]|\\\\/.test(str);
    // \text{...} এর বাইরে বাংলা থাকলে সেটা সাধারণ বাক্য
    const banglaOutsideText = /[\u0980-\u09FF]/.test(
      str.replace(/\\(text|mathrm|textbf|mbox)\{[^}]*\}/g, "")
    );

    if (block || (looksLatex && !banglaOutsideText)) {
      return (
        <span
          className={block ? "block overflow-x-auto overflow-y-hidden py-1" : "cc-inline-math"}
          dangerouslySetInnerHTML={{ __html: renderTex(str, block) }}
        />
      );
    }

    return renderInline(str, "km");
  }, [raw, block]);

  if (content === null) return null;

  return <span className={`${block ? "block" : "inline"} leading-relaxed ${className}`}>{content}</span>;
}
