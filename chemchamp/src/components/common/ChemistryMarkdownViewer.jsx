import React, { useMemo } from "react";
import { parseBlocks, renderBlocks } from "./markdownEngine";

/**
 * ChemistryMarkdownViewer
 * পূর্ণাঙ্গ মার্কডাউন + KaTeX রেন্ডারার (হেডিং, টেবিল, লিস্ট, কলআউট, $..$ ও $$..$$ সমীকরণ)।
 */
export default function ChemistryMarkdownViewer({ content = "", className = "" }) {
  const rendered = useMemo(() => renderBlocks(parseBlocks(content), "md"), [content]);

  if (!content) return null;

  return (
    <div
      className={`cc-markdown text-[15px] sm:text-base leading-8 text-slate-300 break-words [&>*:first-child]:mt-0 ${className}`}
    >
      {rendered}
    </div>
  );
}
