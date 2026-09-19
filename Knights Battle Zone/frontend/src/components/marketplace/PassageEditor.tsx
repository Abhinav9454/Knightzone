import { useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";

interface PassageEditorProps {
  saving?: boolean;
  onSubmit: (payload: { title: string; content: string; tags: string[]; syntaxMode: string }) => Promise<void>;
}

export function PassageEditor({ saving = false, onSubmit }: PassageEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [syntaxMode, setSyntaxMode] = useState("PLAIN");
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const tags = useMemo(
    () => tagsInput.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean).slice(0, 20),
    [tagsInput],
  );

  const isCodeMode = ["CODE", "TYPESCRIPT", "JAVA", "PYTHON", "CPP"].includes(syntaxMode);

  const monacoLanguage = useMemo(() => {
    switch (syntaxMode) {
      case "TYPESCRIPT":
        return "typescript";
      case "JAVA":
        return "java";
      case "PYTHON":
        return "python";
      case "CPP":
        return "cpp";
      case "CODE":
        return "plaintext";
      default:
        return "plaintext";
    }
  }, [syntaxMode]);

  const submit = async () => {
    if (!title.trim() || !content.trim()) return;
    await onSubmit({
      title: title.trim(),
      content: content.trim(),
      tags,
      syntaxMode,
    });
    setTitle("");
    setContent("");
    setTagsInput("");
    setSyntaxMode("PLAIN");
  };

  return (
    <section className="rounded-xl border border-border/70 bg-card/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Share Custom Passage</h2>
        <Button type="button" variant="outline" size="sm" onClick={() => setPreviewEnabled((value) => !value)}>
          {previewEnabled ? "Hide Preview" : "Show Preview"}
        </Button>
      </div>

      <div className="mt-3 grid gap-3">
        <input
          className="w-full rounded-md border bg-background px-3 py-2"
          placeholder="Passage title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <div className="rounded-md border bg-background overflow-hidden">
            {isCodeMode ? (
              <Editor
                height="240px"
                defaultLanguage={monacoLanguage}
                language={monacoLanguage}
                value={content}
                onChange={(value) => setContent(value ?? "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  wordWrap: "on",
                  fontSize: 13,
                  lineNumbers: "on",
                  tabSize: 2,
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                }}
              />
            ) : (
              <textarea
                className="min-h-[240px] w-full resize-y bg-background px-3 py-2"
                placeholder="Paste text passage..."
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Syntax-Friendly Mode</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={syntaxMode}
              onChange={(event) => setSyntaxMode(event.target.value)}
            >
              <option value="PLAIN">Plain</option>
              <option value="MARKDOWN">Markdown</option>
              <option value="CODE">Code</option>
              <option value="TYPESCRIPT">TypeScript</option>
              <option value="JAVA">Java</option>
              <option value="PYTHON">Python</option>
              <option value="CPP">C++</option>
            </select>
            <label className="text-sm font-medium">Tags (comma-separated)</label>
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="algorithms, interview, javascript"
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
            />
            <Button type="button" className="w-full" disabled={saving} onClick={() => void submit()}>
              {saving ? "Publishing..." : "Publish Passage"}
            </Button>
          </div>
        </div>

        {previewEnabled && (
          <div className="rounded-md border bg-background/50 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Preview</p>
            <pre className={`mt-2 whitespace-pre-wrap text-sm ${isCodeMode ? "font-mono" : ""}`}>
              {content || "Your passage preview appears here..."}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
