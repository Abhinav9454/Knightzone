import { useState, type FormEvent } from "react";
import { AlertTriangle, Award, Bug, Clock3, ShieldCheck, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const rewards = [
  { severity: "Critical", range: "$1000 - $5000", examples: "RCE, SQL injection with data access, auth bypass" },
  { severity: "High", range: "$500 - $1000", examples: "Stored XSS, CSRF on critical actions, sensitive disclosure" },
  { severity: "Medium", range: "$200 - $500", examples: "Subdomain takeover, limited data exposure, rate-limit bypass" },
  { severity: "Low", range: "$50 - $200", examples: "Minor information leaks, best practice violations, UI security issues" },
];

const topResearchers = [
  { name: "A. Kumar", bugs: 17, rewards: "$8,400", achievement: "Top critical reports" },
  { name: "S. Johnson", bugs: 12, rewards: "$5,200", achievement: "Fastest validated submission" },
  { name: "M. Lee", bugs: 9, rewards: "$3,100", achievement: "Best technical report quality" },
];

const statuses = [
  { label: "Pending", eta: "within 24h" },
  { label: "Under Review", eta: "24-48h" },
  { label: "Validated", eta: "3-5 days" },
  { label: "Rewarded", eta: "within 10 business days" },
];

export default function BugBountyPage() {
  const [form, setForm] = useState({
    title: "",
    type: "XSS",
    severity: "Medium",
    description: "",
    steps: "",
    impact: "",
    affected: "",
  });

  const submitReport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title || !form.description || !form.steps) {
      toast.error("Please complete mandatory report fields.");
      return;
    }
    toast.success("Bug report submitted successfully. You will receive update within 24-48 hours.");
    setForm({ title: "", type: "XSS", severity: "Medium", description: "", steps: "", impact: "", affected: "" });
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Bug Bounty Program",
    description: "Responsible disclosure program with reward structure and submission process.",
  };

  return (
    <article className="space-y-6">
      <SeoJsonLd data={schema} />
      <header className="grid gap-4 rounded-2xl border border-border/80 bg-gradient-to-r from-destructive/10 via-card to-primary/10 p-6 md:grid-cols-2">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Security Program</p>
          <h1 className="mt-1 text-3xl font-bold">Help Us Make Platform More Secure</h1>
          <p className="mt-2 text-sm text-muted-foreground">Total rewards distributed: $50,000+ | Response time: 24-48 hours</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border/70 bg-muted/25 p-3 text-center">
            <p className="text-xl font-bold text-primary">132</p>
            <p className="text-xs text-muted-foreground">Valid reports</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/25 p-3 text-center">
            <p className="text-xl font-bold text-primary">58</p>
            <p className="text-xs text-muted-foreground">Researchers</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-muted/25 p-3 text-center">
            <p className="text-xl font-bold text-primary">36h</p>
            <p className="text-xs text-muted-foreground">Avg response</p>
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="text-xl font-semibold">Rules & Guidelines</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Eligible: auth bypass, injection flaws, privilege escalation, sensitive data exposure.</li>
            <li>Out of scope: social engineering, DOS attacks, physical attacks, spam findings.</li>
            <li>Do not access or modify user data beyond proof-of-concept necessity.</li>
            <li>Submit detailed reproducible steps and maintain confidentiality until resolution.</li>
            <li>Testing must avoid service disruption and comply with applicable laws.</li>
          </ul>
          <div className="mt-4 rounded-xl border border-border/70 bg-muted/25 p-3 text-sm text-muted-foreground">
            Responsible disclosure: Report privately through this page and allow remediation window before public disclosure.
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="text-xl font-semibold">Response Time Guidelines</h2>
          <div className="mt-3 space-y-2">
            {statuses.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/25 px-3 py-2">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.eta}</p>
              </div>
            ))}
          </div>
          <Button className="mt-4 w-full">Track your submissions</Button>
        </div>
      </section>

      <section className="glass-card p-5">
        <h2 className="mb-3 text-xl font-semibold">Reward Structure</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Severity</TableHead>
              <TableHead>Reward</TableHead>
              <TableHead>Examples</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rewards.map((row) => (
              <TableRow key={row.severity}>
                <TableCell className="font-medium">{row.severity}</TableCell>
                <TableCell>{row.range}</TableCell>
                <TableCell>{row.examples}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="text-xl font-semibold">Submit Vulnerability</h2>
          <form onSubmit={submitReport} className="mt-3 space-y-3">
            <Input placeholder="Bug title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option>XSS</option><option>SQL Injection</option><option>Auth Bypass</option><option>CSRF</option><option>Other</option>
              </select>
              <select value={form.severity} onChange={(event) => setForm((prev) => ({ ...prev, severity: event.target.value }))} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>
            <Textarea placeholder="Bug description" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
            <Textarea placeholder="Steps to reproduce (numbered)" value={form.steps} onChange={(event) => setForm((prev) => ({ ...prev, steps: event.target.value }))} />
            <Input placeholder="Affected URLs or versions" value={form.affected} onChange={(event) => setForm((prev) => ({ ...prev, affected: event.target.value }))} />
            <Textarea placeholder="Impact description" value={form.impact} onChange={(event) => setForm((prev) => ({ ...prev, impact: event.target.value }))} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Input type="file" />
              <Input type="file" />
            </div>
            <Button type="submit" className="w-full gap-2">
              <UploadCloud size={14} />
              Submit report
            </Button>
          </form>
        </div>

        <div className="glass-card p-5">
          <h2 className="text-xl font-semibold">Top Security Researchers</h2>
          <Tabs defaultValue="monthly" className="mt-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="alltime">All time</TabsTrigger>
            </TabsList>
            <TabsContent value="monthly" className="space-y-2">
              {topResearchers.map((person) => (
                <div key={person.name} className="rounded-xl border border-border/70 bg-muted/25 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{person.name}</p>
                    <p className="text-sm text-primary">{person.rewards}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{person.bugs} valid bugs | {person.achievement}</p>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="alltime" className="space-y-2">
              {topResearchers.map((person) => (
                <div key={`${person.name}-all`} className="rounded-xl border border-border/70 bg-muted/25 p-3">
                  <p className="font-medium">{person.name}</p>
                  <p className="text-xs text-muted-foreground">Top contributor across yearly security cycles.</p>
                </div>
              ))}
            </TabsContent>
          </Tabs>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg border border-border/70 bg-muted/25 p-2">
              <Bug size={14} className="mx-auto mb-1 text-primary" />
              Pending
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/25 p-2">
              <Clock3 size={14} className="mx-auto mb-1 text-warning" />
              Under Review
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/25 p-2">
              <Award size={14} className="mx-auto mb-1 text-success" />
              Rewarded
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card p-5">
        <h2 className="text-xl font-semibold">FAQ</h2>
        <Accordion type="single" collapsible className="mt-3">
          <AccordionItem value="start">
            <AccordionTrigger>How to start?</AccordionTrigger>
            <AccordionContent>Read scope, reproduce safely, collect proof, and submit with clear impact analysis.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="post-submit">
            <AccordionTrigger>What happens after submission?</AccordionTrigger>
            <AccordionContent>Security triage validates report, requests clarification if needed, and shares status updates.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="payment">
            <AccordionTrigger>When do I get paid?</AccordionTrigger>
            <AccordionContent>Validated reports are rewarded within 10 business days through supported payout channels.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="publicize">
            <AccordionTrigger>Can I publicize findings?</AccordionTrigger>
            <AccordionContent>Public disclosure is allowed only after coordinated disclosure confirmation.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="multiple">
            <AccordionTrigger>Multiple submissions policy</AccordionTrigger>
            <AccordionContent>First valid report for unique issue is eligible; duplicates may not receive rewards.</AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="mt-4 rounded-xl border border-border/70 bg-muted/25 p-3 text-sm text-muted-foreground">
          <p className="flex items-center gap-2"><ShieldCheck size={14} className="text-success" />Responsible disclosure keeps users protected.</p>
          <p className="mt-1 flex items-center gap-2"><AlertTriangle size={14} className="text-warning" />Avoid data exfiltration and service disruption while testing.</p>
        </div>
      </section>
    </article>
  );
}
