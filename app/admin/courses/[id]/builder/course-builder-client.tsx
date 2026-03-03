"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GripVertical,
  BookOpen,
  Trash2,
  ChevronUp,
  ChevronDown,
  FileQuestion,
  Video,
  Upload,
  FileText,
  Link as LinkIcon,
  Settings,
  Eye,
} from "lucide-react";
import type { ModuleWithQuizzes, CourseMaterialRow } from "@/app/admin/courses/actions";
import {
  reorderModules,
  addModuleWithFormData,
  addModuleFromLessonBank,
  deleteModule,
  getLessonBankList,
  addCourseMaterial,
  deleteCourseMaterial,
  uploadAndAddCourseMaterial,
  updateCourseThumbnail,
  getThumbnailFromVideoUrl,
} from "@/app/admin/courses/actions";
import { MATERIAL_FORMATS } from "@/app/admin/courses/constants";

const FORMAT_LABELS: Record<string, string> = {
  pdf: "PDF",
  doc: "Word (.doc)",
  docx: "Word (.docx)",
  jpg: "Image (JPG)",
  jpeg: "Image (JPEG)",
  png: "Image (PNG)",
};

type CourseInfo = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
};

export function CourseBuilderClient({
  courseId,
  course,
  initialModules,
  initialMaterials,
  isNewCourse = false,
}: {
  courseId: string;
  course: CourseInfo;
  initialModules: ModuleWithQuizzes[];
  initialMaterials: CourseMaterialRow[];
  isNewCourse?: boolean;
}) {
  const router = useRouter();
  const [modules, setModules] = useState<ModuleWithQuizzes[]>(initialModules);
  const [materials, setMaterials] = useState<CourseMaterialRow[]>(initialMaterials);
  useEffect(() => { setModules(initialModules); }, [initialModules]);
  useEffect(() => { setMaterials(initialMaterials); }, [initialMaterials]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [addTitle, setAddTitle] = useState("");
  const [addWithVideoOpen, setAddWithVideoOpen] = useState(false);
  const [addVideoUrl, setAddVideoUrl] = useState("");
  const [bankOpen, setBankOpen] = useState(false);
  const [bankList, setBankList] = useState<{ id: string; title: string }[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [matError, setMatError] = useState<string | null>(null);
  const [materialsOpen, setMaterialsOpen] = useState(true);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFormat, setUploadFormat] = useState<"pdf" | "doc" | "docx" | "jpg" | "jpeg" | "png">("pdf");
  const [urlTitle, setUrlTitle] = useState("");
  const [urlFormat, setUrlFormat] = useState<"pdf" | "doc" | "docx" | "jpg" | "jpeg" | "png">("pdf");
  const [urlLink, setUrlLink] = useState("");
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnail_url ?? "");
  const [thumbnailSaving, setThumbnailSaving] = useState(false);
  const [videoUrlForThumbnail, setVideoUrlForThumbnail] = useState("");
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [attachMaterialIds, setAttachMaterialIds] = useState<string[]>([]);
  const [newLessonMaterials, setNewLessonMaterials] = useState<{ title: string; file_url: string; format: string }[]>([]);
  const [newMatTitle, setNewMatTitle] = useState("");
  const [newMatUrl, setNewMatUrl] = useState("");
  const [newMatFormat, setNewMatFormat] = useState<"pdf" | "doc" | "docx" | "jpg" | "jpeg" | "png">("pdf");
  const [uploadedForLesson, setUploadedForLesson] = useState<{ id: string; title: string; format: string }[]>([]);
  const [lessonUploadTitle, setLessonUploadTitle] = useState("");
  const [lessonUploadFormat, setLessonUploadFormat] = useState<"pdf" | "doc" | "docx" | "jpg" | "jpeg" | "png">("pdf");
  const [lessonUploadPending, setLessonUploadPending] = useState(false);
  const [lessonUploadError, setLessonUploadError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; title: string; format: string }[]>([]);
  const lessonFileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setThumbnailUrl(course.thumbnail_url ?? ""); }, [course.thumbnail_url]);

  const saveOrder = useCallback(
    async (ordered: ModuleWithQuizzes[]) => {
      const ids = ordered.map((m) => m.id);
      const res = await reorderModules(courseId, ids);
      if (res.error) {
        setError(res.error);
        setModules(modules);
        return;
      }
      setModules(ordered);
      setError(null);
      router.refresh();
    },
    [courseId, modules, router]
  );

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDragEnd = () => setDraggedIndex(null);
  const handleDrop = (targetIndex: number) => {
    if (draggedIndex == null) return;
    setDraggedIndex(null);
    if (draggedIndex === targetIndex) return;
    const next = [...modules];
    const [removed] = next.splice(draggedIndex, 1);
    next.splice(targetIndex, 0, removed);
    setModules(next);
    saveOrder(next);
  };

  const moveUp = async (index: number) => {
    if (index <= 0) return;
    const next = [...modules];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setModules(next);
    await saveOrder(next);
  };

  const moveDown = async (index: number) => {
    if (index >= modules.length - 1) return;
    const next = [...modules];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setModules(next);
    await saveOrder(next);
  };

  const handleAddLessonWithVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = addTitle.trim() || "New lesson";
    const video_url = addVideoUrl.trim() || null;
    setPending("addVideo");
    setError(null);
    const formData = new FormData();
    formData.set("title", title);
    formData.set("video_url", video_url || "");
    formData.set("attachCourseMaterialIds", JSON.stringify(attachMaterialIds));
    formData.set("newMaterials", JSON.stringify(newLessonMaterials));
    pendingFiles.forEach((p, i) => {
      formData.set(`file_${i}`, p.file);
      formData.set(`title_${i}`, p.title);
      formData.set(`format_${i}`, p.format);
    });
    const res = await addModuleWithFormData(courseId, formData);
    setPending(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    setAddTitle("");
    setAddVideoUrl("");
    setAttachMaterialIds([]);
    setNewLessonMaterials([]);
    setPendingFiles([]);
    setAddWithVideoOpen(false);
    router.refresh();
    if (res.id) {
      setModules((prev) => [...prev, { id: res.id!, course_id: courseId, index_in_course: prev.length, title, description: null, quizzes: [] }]);
    }
  };

  const toggleAttachMaterial = (id: string) => {
    setAttachMaterialIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const addNewLessonMaterialByUrl = () => {
    const title = newMatTitle.trim();
    const file_url = newMatUrl.trim();
    if (!title || !file_url) return;
    setNewLessonMaterials((prev) => [...prev, { title, file_url, format: newMatFormat }]);
    setNewMatTitle("");
    setNewMatUrl("");
    setNewMatFormat("pdf");
  };

  const removeNewLessonMaterial = (index: number) => {
    setNewLessonMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLessonUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const fileInput = lessonFileInputRef.current;
    const file = fileInput?.files?.[0];
    const title = lessonUploadTitle.trim();
    if (!file || file.size === 0) {
      setLessonUploadError("Please select a file.");
      return;
    }
    if (!title) {
      setLessonUploadError("Title is required.");
      return;
    }
    setLessonUploadError(null);
    setLessonUploadPending(true);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("title", title);
    formData.set("format", lessonUploadFormat);
    const res = await uploadAndAddCourseMaterial(courseId, formData);
    setLessonUploadPending(false);
    if (res.error) {
      setLessonUploadError(res.error);
      return;
    }
    if (res.id) {
      setAttachMaterialIds((prev) => [...prev, res.id!]);
      setUploadedForLesson((prev) => [...prev, { id: res.id!, title, format: lessonUploadFormat }]);
      setLessonUploadTitle("");
      setLessonUploadFormat("pdf");
      if (fileInput) fileInput.value = "";
      router.refresh();
    }
  };

  const addPendingFile = () => {
    const file = lessonFileInputRef.current?.files?.[0];
    const title = lessonUploadTitle.trim();
    if (!file || file.size === 0) {
      setLessonUploadError("Please select a file.");
      return;
    }
    if (!title) {
      setLessonUploadError("Title is required.");
      return;
    }
    setLessonUploadError(null);
    setPendingFiles((prev) => [...prev, { file, title, format: lessonUploadFormat }]);
    setLessonUploadTitle("");
    setLessonUploadFormat("pdf");
    if (lessonFileInputRef.current) lessonFileInputRef.current.value = "";
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const openBank = () => {
    setBankOpen(true);
    getLessonBankList().then(setBankList);
  };

  const handleAddFromBank = async (lessonBankId: string) => {
    setPending("bank");
    setError(null);
    const res = await addModuleFromLessonBank(courseId, lessonBankId);
    setPending(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    setBankOpen(false);
    router.refresh();
    window.location.href = `/admin/courses/${courseId}/builder`;
  };

  const handleDelete = async (moduleId: string, title: string) => {
    if (!confirm(`Delete lesson "${title}"? Quizzes in this lesson will also be removed.`)) return;
    setPending(moduleId);
    setError(null);
    const res = await deleteModule(moduleId);
    setPending(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    setModules((prev) => prev.filter((m) => m.id !== moduleId));
    router.refresh();
  };

  const handleUploadMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("title", uploadTitle.trim() || "Material");
    formData.set("format", uploadFormat);
    setMatError(null);
    setPending("upload");
    const res = await uploadAndAddCourseMaterial(courseId, formData);
    setPending(null);
    if (res.error) {
      setMatError(res.error);
      return;
    }
    setUploadTitle("");
    router.refresh();
  };

  const handleAddMaterialByUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = urlTitle.trim();
    const file_url = urlLink.trim();
    if (!title || !file_url) {
      setMatError("Title and URL are required.");
      return;
    }
    setMatError(null);
    setPending("url");
    const res = await addCourseMaterial(courseId, { title, file_url, format: urlFormat });
    setPending(null);
    if (res.error) {
      setMatError(res.error);
      return;
    }
    setUrlTitle("");
    setUrlLink("");
    setShowUrlForm(false);
    router.refresh();
  };

  const handleRemoveMaterial = async (id: string) => {
    const res = await deleteCourseMaterial(id);
    if (!res.error) setMaterials((prev) => prev.filter((m) => m.id !== id));
    router.refresh();
  };

  const handleSaveThumbnail = async (e: React.FormEvent) => {
    e.preventDefault();
    setThumbnailSaving(true);
    setError(null);
    const res = await updateCourseThumbnail(courseId, thumbnailUrl.trim() || null);
    setThumbnailSaving(false);
    if (res.error) setError(res.error);
    else router.refresh();
  };

  const handleGenerateThumbnailFromVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = videoUrlForThumbnail.trim();
    if (!url) return;
    setGeneratingThumbnail(true);
    setError(null);
    const res = await getThumbnailFromVideoUrl(url);
    if (res.error) {
      setError(res.error);
      setGeneratingThumbnail(false);
      return;
    }
    if (res.url) {
      setThumbnailUrl(res.url);
      const updateRes = await updateCourseThumbnail(courseId, res.url);
      if (updateRes.error) setError(updateRes.error);
      else {
        setVideoUrlForThumbnail("");
        router.refresh();
      }
    }
    setGeneratingThumbnail(false);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      )}

      {isNewCourse && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary-800">
          <strong>Course created.</strong> Assign course materials below and add lessons. Students will see materials and curriculum once the course is published.
        </div>
      )}

      {/* Course overview */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="h-28 w-44 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt="Course thumbnail" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400 text-xs">No image</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Course thumbnail</p>
              <form onSubmit={handleSaveThumbnail} className="mt-2 flex flex-wrap items-end gap-2">
                <label htmlFor="course-thumbnail-url" className="flex-1 min-w-[200px]">
                  <span className="sr-only">Thumbnail URL</span>
                  <input
                    id="course-thumbnail-url"
                    name="course_thumbnail_url"
                    type="url"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://... (image URL)"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                </label>
                <button
                  type="submit"
                  disabled={thumbnailSaving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {thumbnailSaving ? "Saving…" : "Save thumbnail"}
                </button>
              </form>
              <p className="mt-1 text-xs text-slate-500">Paste an image URL or use a video link below to auto-generate.</p>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-600 mb-1.5">Or generate from video (YouTube or Vimeo)</p>
                <form onSubmit={handleGenerateThumbnailFromVideo} className="flex flex-wrap items-end gap-2">
                  <label htmlFor="course-video-url-thumbnail" className="flex-1 min-w-[200px]">
                    <span className="sr-only">Video URL</span>
                    <input
                      id="course-video-url-thumbnail"
                      name="course_video_url_thumbnail"
                      type="url"
                      value={videoUrlForThumbnail}
                      onChange={(e) => setVideoUrlForThumbnail(e.target.value)}
                      placeholder="https://youtube.com/... or https://vimeo.com/..."
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={generatingThumbnail}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {generatingThumbnail ? "Generating…" : "Use as thumbnail"}
                  </button>
                </form>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Course overview</p>
            {course.description && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{course.description}</p>}
            <Link
              href="/admin/courses"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-700"
            >
              <Settings className="h-4 w-4" />
              Edit course (title, description)
            </Link>
          </div>
        </div>
      </section>

      {/* Add lessons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setAddWithVideoOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Video className="h-4 w-4" />
          Add lesson with video link
        </button>
        <button
          type="button"
          onClick={openBank}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <BookOpen className="h-4 w-4" />
          Add from lesson bank
        </button>
      </div>

      {addWithVideoOpen && (
        <form onSubmit={handleAddLessonWithVideo} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label htmlFor="add-lesson-title" className="min-w-[200px]">
              <span className="block text-xs font-medium text-slate-500 mb-1">Lesson title</span>
              <input
                id="add-lesson-title"
                name="add_lesson_title"
                type="text"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                placeholder="e.g. Week 1 – Introduction"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label htmlFor="add-lesson-video-url">
              <span className="block text-xs font-medium text-slate-500 mb-1">Video URL</span>
              <input
                id="add-lesson-video-url"
                name="add_lesson_video_url"
                type="url"
                value={addVideoUrl}
                onChange={(e) => setAddVideoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
          </div>

          {/* Materials for this lesson (optional) */}
          <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
            <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Materials for this lesson (optional)
            </p>
            {materials.length > 0 && (
              <div>
                <span className="block text-xs text-slate-500 mb-1.5">Attach existing course materials</span>
                <ul className="space-y-1.5">
                  {materials.map((m) => (
                    <li key={m.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`attach-${m.id}`}
                        checked={attachMaterialIds.includes(m.id)}
                        onChange={() => toggleAttachMaterial(m.id)}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor={`attach-${m.id}`} className="text-sm text-slate-700 cursor-pointer">
                        {m.title}
                        <span className="ml-1.5 text-slate-400 font-normal">({FORMAT_LABELS[m.format] ?? m.format})</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <span className="block text-xs text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                Upload a file (saved when you click &quot;Add lesson with video&quot;)
              </span>
              <div className="flex flex-wrap gap-2 items-end mt-1.5">
                <input
                  ref={lessonFileInputRef}
                  type="file"
                  name="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.pptx"
                  className="block w-full max-w-[200px] text-sm text-slate-500 file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:text-white file:hover:bg-primary-700"
                />
                <input
                  type="text"
                  value={lessonUploadTitle}
                  onChange={(e) => setLessonUploadTitle(e.target.value)}
                  placeholder="Display title"
                  className="rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 w-32"
                />
                <select
                  value={lessonUploadFormat}
                  onChange={(e) => setLessonUploadFormat(e.target.value as typeof lessonUploadFormat)}
                  className="rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900"
                >
                  {MATERIAL_FORMATS.map((f) => (
                    <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addPendingFile}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Add to list
                </button>
              </div>
              {lessonUploadError && <p className="mt-1 text-xs text-red-600">{lessonUploadError}</p>}
              {pendingFiles.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {pendingFiles.map((p, i) => (
                    <li key={i} className="flex items-center justify-between rounded bg-slate-50 px-2 py-1.5 text-sm">
                      <span className="text-slate-700">{p.title}</span>
                      <button type="button" onClick={() => removePendingFile(i)} className="text-slate-400 hover:text-red-600" aria-label="Remove">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <span className="block text-xs text-slate-500 mb-1.5">Add material by URL</span>
              <div className="flex flex-wrap gap-2 items-end">
                <input
                  type="text"
                  value={newMatTitle}
                  onChange={(e) => setNewMatTitle(e.target.value)}
                  placeholder="Title"
                  className="rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 w-32"
                />
                <input
                  type="url"
                  value={newMatUrl}
                  onChange={(e) => setNewMatUrl(e.target.value)}
                  placeholder="https://..."
                  className="rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 flex-1 min-w-[140px]"
                />
                <select
                  value={newMatFormat}
                  onChange={(e) => setNewMatFormat(e.target.value as typeof newMatFormat)}
                  className="rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900"
                >
                  {MATERIAL_FORMATS.map((f) => (
                    <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addNewLessonMaterialByUrl}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Add
                </button>
              </div>
              {newLessonMaterials.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {newLessonMaterials.map((item, i) => (
                    <li key={i} className="flex items-center justify-between rounded bg-slate-50 px-2 py-1.5 text-sm">
                      <span className="text-slate-700">{item.title}</span>
                      <button type="button" onClick={() => removeNewLessonMaterial(i)} className="text-slate-400 hover:text-red-600" aria-label="Remove">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={pending === "addVideo"} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              {pending === "addVideo" ? "Adding…" : "Add lesson with video"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAddWithVideoOpen(false);
                setAddTitle("");
                setAddVideoUrl("");
                setAttachMaterialIds([]);
                setNewLessonMaterials([]);
                setPendingFiles([]);
                setNewMatTitle("");
                setNewMatUrl("");
                setNewMatFormat("pdf");
                setLessonUploadTitle("");
                setLessonUploadFormat("pdf");
                setLessonUploadError(null);
                if (lessonFileInputRef.current) lessonFileInputRef.current.value = "";
              }}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {bankOpen && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-sm font-medium text-slate-700">Choose a lesson from the bank</p>
          {bankList.length === 0 ? (
            <p className="text-sm text-slate-500">No lessons in the bank yet. Save lessons to the bank from the lesson editor.</p>
          ) : (
            <ul className="space-y-2">
              {bankList.map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <span className="text-sm font-medium text-slate-800">{b.title}</span>
                  <button type="button" onClick={() => handleAddFromBank(b.id)} disabled={pending === "bank"} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50">Add to course</button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={() => setBankOpen(false)} className="mt-3 text-sm text-slate-500 hover:text-slate-700">Close</button>
        </div>
      )}

      {/* Course materials: upload + add by URL */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setMaterialsOpen(!materialsOpen)}
          className="flex w-full items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 sm:px-5"
        >
          <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> Course materials (PDF, Word, images)</span>
          <span>{materialsOpen ? "−" : "+"}</span>
        </button>
        {materialsOpen && (
          <div className="p-4 sm:p-5 space-y-4">
            {matError && <p className="text-sm text-red-600">{matError}</p>}
            {materials.length > 0 && (
              <ul className="space-y-2">
                {materials.map((m) => (
                  <li key={m.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 text-sm">
                    <span className="font-medium text-slate-800">{m.title}</span>
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">{FORMAT_LABELS[m.format] ?? m.format}</span>
                    <button type="button" onClick={() => handleRemoveMaterial(m.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-600"><Upload className="h-3.5 w-3.5" /> Upload file</p>
                <form onSubmit={handleUploadMaterial} className="space-y-2">
                  <input id="material-upload-file" type="file" name="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="block w-full text-sm text-slate-500 file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:text-white file:hover:bg-primary-700" required />
                  <input id="material-upload-title" name="material_upload_title" type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Display title" className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900" required />
                  <select id="material-upload-format" name="material_upload_format" value={uploadFormat} onChange={(e) => setUploadFormat(e.target.value as typeof uploadFormat)} className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900">
                    {MATERIAL_FORMATS.map((f) => <option key={f} value={f}>{FORMAT_LABELS[f]}</option>)}
                  </select>
                  <button type="submit" disabled={pending === "upload"} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">Upload & add</button>
                </form>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-600"><LinkIcon className="h-3.5 w-3.5" /> Add by URL</p>
                {!showUrlForm ? (
                  <button type="button" onClick={() => setShowUrlForm(true)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">Add link</button>
                ) : (
                  <form onSubmit={handleAddMaterialByUrl} className="space-y-2">
                    <input id="material-url-title" name="material_url_title" type="text" value={urlTitle} onChange={(e) => setUrlTitle(e.target.value)} placeholder="Title" className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900" required />
                    <input id="material-url-link" name="material_url_link" type="url" value={urlLink} onChange={(e) => setUrlLink(e.target.value)} placeholder="https://..." className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900" required />
                    <select id="material-url-format" name="material_url_format" value={urlFormat} onChange={(e) => setUrlFormat(e.target.value as typeof urlFormat)} className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900">
                      {MATERIAL_FORMATS.map((f) => <option key={f} value={f}>{FORMAT_LABELS[f]}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button type="submit" disabled={pending === "url"} className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">Add</button>
                      <button type="button" onClick={() => { setShowUrlForm(false); setUrlTitle(""); setUrlLink(""); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Curriculum */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 sm:px-5">
          Curriculum — drag to reorder
        </div>
        {modules.length === 0 ? (
          <div className="px-4 py-12 text-center sm:px-5">
            <p className="text-sm text-slate-500">No lessons yet.</p>
            <p className="mt-1 text-xs text-slate-400">Add a lesson with a video link or add from the lesson bank.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {modules.map((mod, index) => (
              <li
                key={mod.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 px-4 py-3 sm:px-5 ${draggedIndex === index ? "opacity-50 bg-slate-100" : "bg-white hover:bg-slate-50/50"}`}
              >
                <span className="cursor-grab text-slate-400 active:cursor-grabbing" title="Drag to reorder"><GripVertical className="h-5 w-5" /></span>
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{mod.title}</span>
                  {mod.quizzes.length > 0 && (
                    <span className="inline-flex flex-wrap items-center gap-1.5">
                      {mod.quizzes.map((quiz) => (
                        <Link
                          key={quiz.id}
                          href={`/admin/quizzes/${quiz.id}/edit`}
                          className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-100 hover:underline"
                          title={`View / edit: ${quiz.title}`}
                        >
                          <FileQuestion className="h-3 w-3" />
                          {quiz.title}
                        </Link>
                      ))}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveUp(index)} disabled={index === 0} className="rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30" aria-label="Move up"><ChevronUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => moveDown(index)} disabled={index === modules.length - 1} className="rounded p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30" aria-label="Move down"><ChevronDown className="h-4 w-4" /></button>
                  <Link
                    href={`/admin/courses/${courseId}/lessons/${mod.id}/preview`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    title="Preview lesson"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </Link>
                  <Link href={`/admin/courses/${courseId}/lessons/${mod.id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Edit</Link>
                  <Link
                    href={`/admin/quizzes/new?courseId=${courseId}&moduleId=${mod.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                    title="Add quiz to this lesson"
                  >
                    <FileQuestion className="h-3.5 w-3.5" />
                    Add quiz
                  </Link>
                  <button type="button" onClick={() => handleDelete(mod.id, mod.title)} disabled={pending === mod.id} className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
