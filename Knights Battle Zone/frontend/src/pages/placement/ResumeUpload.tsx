import React, { useState } from "react";
import { placementApi } from "@/lib/api";

export default function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>("Upload your latest resume for placement eligibility checks.");

  const onUpload = async () => {
    if (!file) {
      setMessage("Please select a resume file first.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setBusy(true);
    setMessage("Resume upload started.");

    try {
      await placementApi.uploadResume(formData);
      setMessage("Resume uploaded successfully.");
    } catch {
      setMessage("Resume upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Resume Upload</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        className="block w-full max-w-md rounded-md border p-2 text-sm"
      />
      <button
        type="button"
        className="rounded-md border px-4 py-2 text-sm font-medium"
        onClick={() => void onUpload()}
        disabled={busy}
      >
        {busy ? "Uploading..." : "Upload Resume"}
      </button>
    </div>
  );
}
