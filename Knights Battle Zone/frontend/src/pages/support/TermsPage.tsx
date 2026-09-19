import { useState } from "react";
import { FileText, Globe2, Printer } from "lucide-react";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { Button } from "@/components/ui/button";

const sections = [
  { id: "acceptance", title: "1. Acceptance of Terms", points: ["These terms form a binding legal agreement upon electronic acceptance.", "Users must be 18+ or have verified parental/guardian consent."] },
  { id: "registration", title: "2. Account Registration", points: ["Account information must remain accurate and up to date.", "You are responsible for account security and must not share credentials."] },
  { id: "conduct", title: "3. User Conduct", points: ["Harassment, abuse, unlawful behavior, and malicious actions are prohibited.", "Users must respect intellectual property and applicable laws."] },
  { id: "payments", title: "4. Payment Terms", points: ["Plans, fees, and billing cycles are shown at purchase checkout.", "Refunds follow the published cancellation and billing policy."] },
  { id: "ownership", title: "5. Content Ownership", points: ["Users retain ownership of submitted content.", "You grant platform a license to host/process content for service operation."] },
  { id: "submissions", title: "6. Code Submissions", points: ["Submitted code may be scanned for plagiarism and quality checks.", "Platform may run code in sandbox for evaluation and security."] },
  { id: "privacy", title: "7. Privacy & Data", points: ["Privacy practices are detailed in Privacy Policy.", "Cookies and analytics support product performance and personalization."] },
  { id: "third-party", title: "8. Third-Party Links", points: ["External links are provided for convenience without endorsement.", "Third-party usage is subject to their own policies and terms."] },
  { id: "termination", title: "9. Termination", points: ["Accounts may be suspended for policy violations or legal requirements.", "Users can request account deletion subject to retention obligations."] },
  { id: "disclaimer", title: "10. Disclaimers", points: ["Service is provided on an 'as is' and 'as available' basis.", "No uninterrupted availability guarantee is provided."] },
  { id: "liability", title: "11. Limitation of Liability", points: ["Liability is limited to the maximum extent permitted by law.", "Indirect and consequential damages are excluded where lawful."] },
  { id: "indemnification", title: "12. Indemnification", points: ["Users agree to indemnify the platform against claims from misuse.", "Reasonable cooperation is required during legal defense."] },
  { id: "dispute", title: "13. Dispute Resolution", points: ["Disputes are resolved by arbitration unless prohibited by law.", "Class action waiver applies where enforceable."] },
  { id: "changes", title: "14. Changes to Terms", points: ["Terms may be updated with notice through product channels.", "Continued use after changes implies acceptance."] },
  { id: "contact", title: "15. Contact Information", points: ["Legal team: legal@knightsbattlezone.com", "Address: 500 Market Street, San Francisco, CA 94105, USA"] },
];

export default function TermsPage() {
  const [language, setLanguage] = useState("English");
  const lastUpdated = "March 1, 2026";

  const downloadSummary = () => {
    const content = `Knights Battle Zone Terms Summary\nLast Updated: ${lastUpdated}\n\n${sections.map((section) => `${section.title}\n- ${section.points.join("\n- ")}`).join("\n\n")}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "terms-summary.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Terms of Service",
    dateModified: "2026-03-01",
  };

  return (
    <article className="space-y-6">
      <SeoJsonLd data={schema} />
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Legal</p>
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
      </header>

      <section className="glass-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer size={14} />
            Print
          </Button>
          <Button variant="outline" className="gap-2" onClick={downloadSummary}>
            <FileText size={14} />
            Download summary
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Globe2 size={14} className="text-muted-foreground" />
            <select value={language} onChange={(event) => setLanguage(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option>English</option>
              <option>Hindi</option>
              <option>Spanish</option>
            </select>
          </div>
        </div>
      </section>

      <section className="glass-card p-5">
        <h2 className="text-xl font-semibold">Table of Contents</h2>
        <nav aria-label="Terms table of contents" className="mt-3 grid gap-2 sm:grid-cols-2">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-sm transition hover:border-primary/50 hover:text-primary">
              {section.title}
            </a>
          ))}
        </nav>
      </section>

      <section className="space-y-4">
        {sections.map((section) => (
          <section id={section.id} key={section.id} className="glass-card p-5 scroll-mt-20">
            <h3 className="text-lg font-semibold">{section.title}</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {section.points.map((point) => (
                <li key={point}>â€¢ {point}</li>
              ))}
            </ul>
          </section>
        ))}
      </section>
    </article>
  );
}

