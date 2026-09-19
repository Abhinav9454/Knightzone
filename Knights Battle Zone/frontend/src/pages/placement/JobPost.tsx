import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { placementApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { PlacementJobPostPayload } from "@/lib/types";
import { toast } from "sonner";

const INITIAL_FORM: PlacementJobPostPayload = {
  title: "",
  companyName: "",
  location: "",
  salaryRange: "",
  description: "",
  eligibilityCriteria: "",
  deadline: "",
  status: "OPEN",
};

export default function JobPost() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [form, setForm] = useState<PlacementJobPostPayload>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const isValid = useMemo(() => {
    return Boolean(
      form.title?.trim()
      && form.companyName?.trim()
      && form.description?.trim(),
    );
  }, [form.companyName, form.description, form.title]);

  const update = (field: keyof PlacementJobPostPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid || saving) return;

    setSaving(true);
    try {
      const payload: PlacementJobPostPayload = {
        ...form,
        companyId: form.companyId ?? user?.id,
        deadline: form.deadline || undefined,
      };
      await placementApi.createJob(payload);
      toast.success("Job posted successfully.");
      navigate("/placement/jobs");
    } catch {
      toast.error("Unable to post job right now.");
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-semibold">Post a Job</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only admin and super admin can create placement jobs.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-3xl space-y-5">
        <header>
          <h1 className="text-2xl font-semibold">Create Placement Job</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add verified job details so students can apply directly from the platform.
          </p>
        </header>

        <form onSubmit={submit} className="space-y-4 rounded-lg border border-border/70 bg-card p-4 md:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              id="job-title"
              label="Job Title"
              required
              value={form.title ?? ""}
              onChange={(value) => update("title", value)}
              placeholder="SDE Intern"
            />
            <Field
              id="company-name"
              label="Company Name"
              required
              value={form.companyName ?? ""}
              onChange={(value) => update("companyName", value)}
              placeholder="Knights Battle Zone Labs"
            />
            <Field
              id="company-id"
              label="Company ID (optional)"
              value={form.companyId ? String(form.companyId) : ""}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  companyId: value.trim() ? Number(value) : undefined,
                }))
              }
              placeholder={`Default: ${user?.id ?? ""}`}
              type="number"
            />
            <Field
              id="location"
              label="Location"
              value={form.location ?? ""}
              onChange={(value) => update("location", value)}
              placeholder="Remote / Bengaluru"
            />
            <Field
              id="salary"
              label="Salary Range"
              value={form.salaryRange ?? ""}
              onChange={(value) => update("salaryRange", value)}
              placeholder="8-14 LPA"
            />
            <Field
              id="deadline"
              label="Application Deadline"
              value={form.deadline ?? ""}
              onChange={(value) => update("deadline", value)}
              type="datetime-local"
            />
          </div>

          <TextArea
            id="description"
            label="Job Description"
            required
            value={form.description ?? ""}
            onChange={(value) => update("description", value)}
            placeholder="Role overview, responsibilities, and expectations."
            rows={5}
          />

          <TextArea
            id="eligibility"
            label="Eligibility Criteria"
            value={form.eligibilityCriteria ?? ""}
            onChange={(value) => update("eligibilityCriteria", value)}
            placeholder="CGPA 7+, final year CSE/IT, strong DSA."
            rows={4}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
              onClick={() => navigate("/placement/jobs")}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isValid || saving}
            >
              {saving ? "Posting..." : "Post Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "number" | "datetime-local";
};

function Field({ id, label, value, onChange, placeholder, required, type = "text" }: FieldProps) {
  return (
    <label htmlFor={id} className="block space-y-1.5">
      <span className="text-sm font-medium">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

type TextAreaProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
};

function TextArea({ id, label, value, onChange, placeholder, required, rows = 4 }: TextAreaProps) {
  return (
    <label htmlFor={id} className="block space-y-1.5">
      <span className="text-sm font-medium">
        {label}
        {required ? " *" : ""}
      </span>
      <textarea
        id={id}
        value={value}
        required={required}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

