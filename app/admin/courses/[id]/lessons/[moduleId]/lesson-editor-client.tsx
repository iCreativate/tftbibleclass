"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  updateModule,
  getModuleMaterials,
  addModuleMaterial,
  deleteModuleMaterial,
  uploadAndAddModuleMaterial,
  saveModuleToLessonBank,
  type ModuleRow,
  type ModuleMaterialRow,
} from "@/app/admin/courses/actions";
import { MODULE_MATERIAL_FORMATS, type ModuleMaterialFormat } from "@/app/admin/courses/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LessonVideoPlayer } from "@/components/lesson-video-player";
import { FileText, Trash2, BookOpen, Upload } from "lucide-react";

const FORMAT_LABELS: Record<ModuleMaterialFormat, string> = {
  pdf: "PDF",
  doc: "Word (.doc)",
  docx: "Word (.docx)",
  jpg: "Image (JPG)",
  jpeg: "Image (JPEG)",
  png: "Image (PNG)",
  pptx: "Slides (PPTX)",
};

export function LessonEditorClient({
  courseId,
  module: initialModule,
  initialMaterials,
}: {
  courseId: string;
  module: ModuleRow;
  initialMaterials: ModuleMaterialRow[];
}) {
  const router = useRouter();
  const [module, setModule] = useState(initialModule);
  const [materials, setMaterials] = useState<ModuleMaterialRow[]>(initialMaterials);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matError, setMatError] = useState<string | null>(null);
  const [addPending, setAddPending] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newFormat, setNewFormat] = useState<ModuleMaterialFormat>("pdf");
  const [saveBankPending, setSaveBankPending] = useState(false);
  const [videoUrl, setVideoUrl] = useState(initialModule.video_url ?? "");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFormat, setUploadFormat] = useState<ModuleMaterialFormat>("pdf");
  const [uploadPending, setUploadPending] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadFileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setVideoUrl(module.video_url ?? ""); }, [module.video_url]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const availableFromRaw = (formData.get("available_from") as string)?.trim() ?? "";
    const availableUntilRaw = (formData.get("available_until") as string)?.trim() ?? "";
    const result = await updateModule(module.id, {
      title: (formData.get("title") as string)?.trim() || module.title,
      description: (formData.get("description") as string)?.trim() || null,
      video_url: (formData.get("video_url") as string)?.trim() || null,
      audio_url: (formData.get("audio_url") as string)?.trim() || null,
      pdf_url: (formData.get("pdf_url") as string)?.trim() || null,
      scripture_reference: (formData.get("scripture_reference") as string)?.trim() || null,
      rich_text: (formData.get("rich_text") as string)?.trim() ? { content: formData.get("rich_text") } : null,
      available_from: availableFromRaw ? new Date(availableFromRaw).toISOString() : null,
      available_until: availableUntilRaw ? new Date(availableUntilRaw).toISOString() : null,
    });
    setSaving(false);
    if (result.error) setError(result.error);
    else {
      setModule((prev) => ({
        ...prev,
        title: (formData.get("title") as string)?.trim() || prev.title,
        description: (formData.get("description") as string)?.trim() || null,
        video_url: (formData.get("video_url") as string)?.trim() || null,
        audio_url: (formData.get("audio_url") as string)?.trim() || null,
        pdf_url: (formData.get("pdf_url") as string)?.trim() || null,
        scripture_reference: (formData.get("scripture_reference") as string)?.trim() || null,
        available_from: availableFromRaw ? new Date(availableFromRaw).toISOString() : null,
        available_until: availableUntilRaw ? new Date(availableUntilRaw).toISOString() : null,
      }));
      router.refresh();
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setMatError(null);
    const title = newTitle.trim();
    const file_url = newUrl.trim();
    if (!title || !file_url) {
      setMatError("Title and file URL are required.");
      return;
    }
    setAddPending(true);
    const result = await addModuleMaterial(module.id, { title, file_url, format: newFormat });
    setAddPending(false);
    if (result.error) setMatError(result.error);
    else {
      setNewTitle("");
      setNewUrl("");
      setNewFormat("pdf");
      const list = await getModuleMaterials(module.id);
      setMaterials(list);
      router.refresh();
    }
  };

  const handleRemoveMaterial = async (id: string) => {
    const result = await deleteModuleMaterial(id);
    if (!result.error) setMaterials((prev) => prev.filter((m) => m.id !== id));
    router.refresh();
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = uploadFileRef.current?.files?.[0];
    const title = uploadTitle.trim();
    if (!file || file.size === 0) {
      setUploadError("Please select a file.");
      return;
    }
    if (!title) {
      setUploadError("Title is required.");
      return;
    }
    setUploadError(null);
    setUploadPending(true);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("title", title);
    formData.set("format", uploadFormat);
    const result = await uploadAndAddModuleMaterial(courseId, module.id, formData);
    setUploadPending(false);
    if (result.error) setUploadError(result.error);
    else {
      setUploadTitle("");
      setUploadFormat("pdf");
      if (uploadFileRef.current) uploadFileRef.current.value = "";
      const list = await getModuleMaterials(module.id);
      setMaterials(list);
      router.refresh();
    }
  };

  const handleSaveToBank = async () => {
    setSaveBankPending(true);
    setError(null);
    const result = await saveModuleToLessonBank(module.id);
    setSaveBankPending(false);
    if (result.error) setError(result.error);
    else alert("Lesson saved to lesson bank. You can add it to other courses from the course builder.");
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Lesson title</Label>
            <Input id="title" name="title" required defaultValue={module.title} className="w-full" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={module.description ?? ""}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="video_url">Video URL</Label>
            <Input
              id="video_url"
              name="video_url"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/... or https://vimeo.com/..."
            />
            <p className="mt-1 text-xs text-slate-500">YouTube or Vimeo links are embedded. Direct video file URLs also work.</p>
            {videoUrl.trim() && (
              <div className="mt-3">
                <p className="mb-2 text-xs font-medium text-slate-600">Preview</p>
                <LessonVideoPlayer videoUrl={videoUrl.trim()} />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="audio_url">Audio URL</Label>
            <Input id="audio_url" name="audio_url" type="url" defaultValue={module.audio_url ?? ""} placeholder="https://..." />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pdf_url">PDF / document URL</Label>
            <Input id="pdf_url" name="pdf_url" type="url" defaultValue={module.pdf_url ?? ""} placeholder="https://..." />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="scripture_reference">Scripture reference</Label>
            <Input id="scripture_reference" name="scripture_reference" defaultValue={module.scripture_reference ?? ""} placeholder="e.g. John 3:16" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="rich_text">Text content</Label>
            <textarea
              id="rich_text"
              name="rich_text"
              rows={6}
              defaultValue={typeof module.rich_text === "object" && module.rich_text && "content" in module.rich_text ? String((module.rich_text as { content?: string }).content ?? "") : ""}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              placeholder="Lesson text, notes, or instructions…"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <p className="text-xs font-medium text-slate-600">Schedule (optional)</p>
            <p className="text-[11px] text-slate-500">When this topic is visible to students. Leave blank for no restriction.</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="lesson-available_from">Available from</Label>
                <Input
                  id="lesson-available_from"
                  name="available_from"
                  type="datetime-local"
                  defaultValue={module.available_from ? new Date(module.available_from).toISOString().slice(0, 16) : ""}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lesson-available_until">Available until</Label>
                <Input
                  id="lesson-available_until"
                  name="available_until"
                  type="datetime-local"
                  defaultValue={module.available_until ? new Date(module.available_until).toISOString().slice(0, 16) : ""}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save lesson"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveToBank}
            disabled={saveBankPending}
            className="inline-flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            {saveBankPending ? "Saving…" : "Save to lesson bank"}
          </Button>
        </div>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 flex items-center gap-2 font-heading text-lg font-semibold text-slate-900">
          <FileText className="h-5 w-5 text-primary" />
          Attach resources (PDFs, worksheets, slides, images)
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Attach files to this lesson. Allowed: PDF, Word, images, PowerPoint.
        </p>
        {materials.length > 0 && (
          <ul className="mb-4 space-y-2">
            {materials.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-800">{m.title}</span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                  {FORMAT_LABELS[m.format as ModuleMaterialFormat] ?? m.format}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveMaterial(m.id)}
                  className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="space-y-4">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-600">
              <Upload className="h-3.5 w-3.5" />
              Upload a file
            </p>
            <form onSubmit={handleUploadMaterial} className="flex flex-wrap items-end gap-2">
              <input
                ref={uploadFileRef}
                type="file"
                name="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.pptx"
                className="block max-w-[200px] text-sm text-slate-500 file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:text-white file:hover:bg-primary-700"
              />
              <div className="min-w-[140px] space-y-1">
                <Label htmlFor="upload-title" className="text-xs">Title</Label>
                <Input id="upload-title" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="e.g. Worksheet" className="h-9 text-sm" />
              </div>
              <div className="min-w-[100px] space-y-1">
                <Label htmlFor="upload-format" className="text-xs">Format</Label>
                <select
                  id="upload-format"
                  value={uploadFormat}
                  onChange={(e) => setUploadFormat(e.target.value as ModuleMaterialFormat)}
                  className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm"
                >
                  {MODULE_MATERIAL_FORMATS.map((f) => (
                    <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" size="sm" disabled={uploadPending}>
                {uploadPending ? "Uploading…" : "Upload & add"}
              </Button>
            </form>
            {uploadError && <p className="mt-1 text-sm text-red-600">{uploadError}</p>}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-slate-600">Or add by URL</p>
            <form onSubmit={handleAddMaterial} className="flex flex-wrap items-end gap-2">
              <div className="min-w-[140px] flex-1 space-y-1">
                <Label htmlFor="mat-title" className="text-xs">Title</Label>
                <Input id="mat-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Worksheet" className="h-9 text-sm" />
              </div>
              <div className="min-w-[100px] flex-1 space-y-1">
                <Label htmlFor="mat-format" className="text-xs">Format</Label>
                <select
                  id="mat-format"
                  value={newFormat}
                  onChange={(e) => setNewFormat(e.target.value as ModuleMaterialFormat)}
                  className="h-9 w-full rounded-lg border border-slate-200 px-2 text-sm"
                >
                  {MODULE_MATERIAL_FORMATS.map((f) => (
                    <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[160px] flex-[2] space-y-1">
                <Label htmlFor="mat-url" className="text-xs">File URL</Label>
                <Input id="mat-url" type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." className="h-9 text-sm" />
              </div>
              <Button type="submit" size="sm" disabled={addPending}>
                {addPending ? "Adding…" : "Add"}
              </Button>
            </form>
          </div>
        </div>
        {matError && <p className="mt-2 text-sm text-red-600">{matError}</p>}
      </div>
    </div>
  );
}
