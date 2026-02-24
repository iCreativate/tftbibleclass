"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ApiVerse = {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
};

type ApiResponse = {
  reference: string;
  verses: ApiVerse[];
  text: string;
  translation_name: string;
};

export function BibleReader() {
  const [reference, setReference] = useState("John 3");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passage, setPassage] = useState<ApiResponse | null>(null);
  const [fontScale, setFontScale] = useState(1);

  function handleReferenceChange(event: ChangeEvent<HTMLInputElement>) {
    setReference(event.target.value);
  }

  async function loadPassage(value: string) {
    const cleaned = value.trim();
    if (!cleaned) return;
    setLoading(true);
    setError(null);

    try {
      const url = `https://bible-api.com/${encodeURIComponent(
        cleaned
      )}?translation=web`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Unable to load passage. Check the reference.");
      }
      const data = (await response.json()) as ApiResponse;
      setPassage(data);
    } catch (err) {
      setPassage(null);
      setError("Could not load that reference. Try another verse or chapter.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await loadPassage(reference);
  }

  async function handleNextChapter() {
    if (!passage || passage.verses.length === 0) return;
    const first = passage.verses[0];
    const nextReference = `${first.book_name} ${first.chapter + 1}`;
    setReference(nextReference);
    await loadPassage(nextReference);
  }

  function handleZoom(delta: number) {
    setFontScale(current => {
      const next = current + delta;
      if (next < 0.8) return 0.8;
      if (next > 1.6) return 1.6;
      return next;
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/90 p-4 text-slate-700 shadow-[0_16px_32px_rgba(15,23,42,0.06)] backdrop-blur-lg">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-100">
            Bible reader
          </p>
          <p className="text-xs text-slate-500">
            Stay close to the passage as you learn. Type a reference like John
            3, Romans 8, or Psalm 1.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 px-2 py-1 text-[10px] text-slate-600">
          <button
            type="button"
            className="rounded px-1 hover:bg-slate-100"
            onClick={() => handleZoom(-0.1)}
          >
            A-
          </button>
          <span className="tabular-nums">
            {Math.round(fontScale * 100)}%
          </span>
          <button
            type="button"
            className="rounded px-1 hover:bg-slate-100"
            onClick={() => handleZoom(0.1)}
          >
            A+
          </button>
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex gap-2"
      >
        <Input
          placeholder="e.g. John 3, Romans 8, Psalm 1"
          value={reference}
          onChange={handleReferenceChange}
        />
        <Button
          type="submit"
          size="sm"
          disabled={loading}
        >
          {loading ? "Loading..." : "Read"}
        </Button>
      </form>
      {error && (
        <p className="text-xs text-red-600">
          {error}
        </p>
      )}
      <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200/80 bg-white/90 p-3 text-xs text-slate-800">
        {passage ? (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-semibold text-slate-900">
                {passage.reference}
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                {passage.translation_name}
              </p>
            </div>
            <div className="space-y-1">
              {passage.verses.map(verse => (
                <p
                  key={`${verse.book_name}-${verse.chapter}-${verse.verse}`}
                  className="leading-relaxed text-slate-800"
                  style={{ fontSize: `${11 * fontScale}px` }}
                >
                  <span
                    className="mr-1 align-top font-semibold text-slate-500"
                    style={{ fontSize: `${9 * fontScale}px` }}
                  >
                    {verse.verse}
                  </span>
                  {verse.text.trim()}
                </p>
              ))}
            </div>
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                size="sm"
                className="h-7 px-3 text-[11px]"
                disabled={loading}
                onClick={handleNextChapter}
              >
                Next chapter
              </Button>
            </div>
          </>
        ) : (
          <p className="text-slate-500">
            Enter a passage above to keep Scripture open beside your notes,
            questions, and quizzes.
          </p>
        )}
      </div>
    </div>
  );
}
