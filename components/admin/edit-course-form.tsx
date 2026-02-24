"use client";

import { useState, useEffect } from "react";
import {
  updateCourse,
  getCourseMaterials,
  addCourseMaterial,
  deleteCourseMaterial,
  type CourseMaterialRow,
} from "@/app/admin/courses/actions";
import { MATERIAL_FORMATS, type MaterialFormat } from "@/app/admin/courses/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Trash2 } from "lucide-react";

const difficulties = ["Beginner", "Intermediate", "Advanced"] as const;

const FORMAT_LABELS: Record<MaterialFormat, string> = {
  pdf: "PDF",
  doc: "Word (.doc)",
  docx: "Word (.docx)",
  jpg: "Image (JPG)",
  jpeg: "Image (JPEG)",
  png: "Image (PNG)",
};

type Course = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: string;
  estimated_minutes: number;
};

export function EditCourseForm({
  course,
  onSuccess,
}: {
  course: Course;
  onSuccess?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [materials, setMaterials] = useState<CourseMaterialRow[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialError, setMaterialError] = useState<string | null>(null);
  const [addPending, setAddPending] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newFormat, setNewFormat] = useState<MaterialFormat>("pdf");

  useEffect(() => {
    let cancelled = false;
    setMaterialsLoading(true);
    getCourseMaterials(course.id).then((list) => {
      if (!cancelled) {
        setMaterials(list);
        setMaterialsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [course.id]);

  async function handleAddMaterial(e: React.FormEvent) {
    e.preventDefault();
    setMaterialError(null);
    const title = newTitle.trim();
    const file_url = newUrl.trim();
    if (!title || !file_url) {
      setMaterialError("Title and file URL are required.");
      return;
    }
    setAddPending(true);
    const result = await addCourseMaterial(course.id, {
      title,
      file_url,
      format: newFormat,
    });
    setAddPending(false);
    if (result.error) {
      setMaterialError(result.error);
      return;
    }
    setNewTitle("");
    setNewUrl("");
    setNewFormat("pdf");
    const list = await getCourseMaterials(course.id);
    setMaterials(list);
  }

  async function handleRemoveMaterial(id: string) {
    const result = await deleteCourseMaterial(id);
    if (!result.error) {
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setIsPending(true);
          const formData = new FormData(e.currentTarget);
          const result = await updateCourse(course.id, {}, formData);
          setIsPending(false);
          if (result.error) {
            setError(result.error);
            return;
          }
          onSuccess?.();
        }}
      >
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="edit-title">Title</Label>
          <Input
            id="edit-title"
            name="title"
            required
            defaultValue={course.title}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-slug">Slug</Label>
          <Input
            id="edit-slug"
            name="slug"
            defaultValue={course.slug}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-description">Description</Label>
          <textarea
            id="edit-description"
            name="description"
            rows={3}
            defaultValue={course.description ?? ""}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-difficulty">Difficulty</Label>
            <select
              id="edit-difficulty"
              name="difficulty"
              defaultValue={course.difficulty}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {difficulties.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-estimated_minutes">Estimated minutes</Label>
            <Input
              id="edit-estimated_minutes"
              name="estimated_minutes"
              type="number"
              min={1}
              defaultValue={course.estimated_minutes}
              className="w-full"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>

      <div className="border-t border-slate-200 pt-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <FileText className="h-4 w-4" />
          Downloadable materials
        </h3>
        <p className="mb-3 text-xs text-slate-500">
          Word (.doc/.docx), PDF, or images (JPG/PNG). Add a title and the file URL.
        </p>
        {materialsLoading ? (
          <p className="text-sm text-slate-500">Loading materials…</p>
        ) : (
          <>
            {materials.length > 0 && (
              <ul className="mb-4 space-y-2">
                {materials.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-800">{m.title}</span>
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                      {FORMAT_LABELS[m.format as MaterialFormat] ?? m.format}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMaterial(m.id)}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove material"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={handleAddMaterial} className="flex flex-wrap items-end gap-2">
              <div className="min-w-[140px] flex-1 space-y-1">
                <Label htmlFor="mat-title" className="text-xs">
                  Title
                </Label>
                <Input
                  id="mat-title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Session notes"
                  className="h-9 text-sm"
                />
              </div>
              <div className="min-w-[100px] flex-1 space-y-1">
                <Label htmlFor="mat-format" className="text-xs">
                  Format
                </Label>
                <select
                  id="mat-format"
                  value={newFormat}
                  onChange={(e) => setNewFormat(e.target.value as MaterialFormat)}
                  className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm"
                >
                  {MATERIAL_FORMATS.map((f) => (
                    <option key={f} value={f}>
                      {FORMAT_LABELS[f]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[160px] flex-[2] space-y-1">
                <Label htmlFor="mat-url" className="text-xs">
                  File URL
                </Label>
                <Input
                  id="mat-url"
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-9 text-sm"
                />
              </div>
              <Button type="submit" size="sm" disabled={addPending}>
                {addPending ? "Adding…" : "Add"}
              </Button>
            </form>
            {materialError && (
              <p className="mt-2 text-sm text-red-600">{materialError}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
