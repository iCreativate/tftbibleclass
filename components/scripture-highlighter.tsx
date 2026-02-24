import { ReactNode } from "react";

type ScriptureHighlighterProps = {
  reference: string;
  text: string;
  children?: ReactNode;
};

export function ScriptureHighlighter(props: ScriptureHighlighterProps) {
  return (
    <div className="space-y-2 rounded-2xl bg-accent/5 p-4 text-sm text-slate-800">
      <p className="font-heading text-xs font-semibold uppercase tracking-[0.25em] text-accent">
        {props.reference}
      </p>
      <p className="font-scripture text-base italic leading-relaxed text-slate-900">
        “{props.text}”
      </p>
      {props.children && (
        <div className="pt-2 text-xs text-slate-600">{props.children}</div>
      )}
    </div>
  );
}

