"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCourse } from "@/app/admin/courses/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const difficulties = ["Beginner", "Intermediate", "Advanced"] as const;

export function NewCourseForm({
  onSuccess,
}: {
  onSuccess?: () => void;
} = {}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setIsPending(true);
        const formData = new FormData(e.currentTarget);
        const result = await createCourse({}, formData);
        setIsPending(false);
        if (result.error) {
          setError(result.error);
          return;
        }
        if (onSuccess) {
          onSuccess();
        } else if (result.id) {
          router.push(`/admin/courses/${result.id}/builder?new=1`);
          router.refresh();
        } else {
          router.push("/admin/courses");
          router.refresh();
        }
      }}
    >
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="e.g. Walking With Jesus: The Gospel of John"
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug (URL-friendly, optional)</Label>
        <Input
          id="slug"
          name="slug"
          placeholder="Auto-generated from title if left blank"
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Brief description for the catalog."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <select
            id="difficulty"
            name="difficulty"
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
          <Label htmlFor="estimated_minutes">Estimated minutes</Label>
          <Input
            id="estimated_minutes"
            name="estimated_minutes"
            type="number"
            min={1}
            defaultValue={60}
            className="w-full"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="publish_now"
          name="publish_now"
          value="true"
          className="rounded border-slate-300"
        />
        <Label htmlFor="publish_now" className="font-normal">
          Publish immediately (visible to all students)
        </Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create course"}
        </Button>
      </div>
    </form>
  );
}
