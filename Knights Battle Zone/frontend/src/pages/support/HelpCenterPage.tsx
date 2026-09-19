import { useMemo, useState, type FormEvent } from "react";
import { Bot, CircleHelp, LifeBuoy, MessageCircle, PlayCircle, Search, Send, Video } from "lucide-react";
import { toast } from "sonner";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type HelpCategory = "Getting Started" | "Account Issues" | "Technical Support" | "Billing";

const faqData: Record<HelpCategory, { question: string; answer: string }[]> = {
  "Getting Started": [
    { question: "How do I create an account?", answer: "Open register page, add your details, verify email, and complete profile." },
    { question: "How to join a contest?", answer: "Go to Contests, open a contest card, click register, and start at scheduled time." },
    { question: "What are the eligibility criteria?", answer: "Anyone interested in tech learning can participate unless a contest has private rules." },
  ],
  "Account Issues": [
    { question: "I forgot my password", answer: "Use forgot-password flow on login page and reset through your registered email." },
    { question: "How to update profile?", answer: "Open profile page and update personal details, skills, and links from settings section." },
    { question: "Account verification process", answer: "Verification mail is sent after signup. If not received, request resend after 60 seconds." },
  ],
  "Technical Support": [
    { question: "Platform requirements", answer: "Latest Chrome, Firefox, Safari, or Edge with stable network is recommended." },
    { question: "Code editor not working", answer: "Refresh session, clear browser cache, and disable conflicting browser extensions." },
    { question: "Submission failed error", answer: "Check language selection, compile logs, and retry. Report persistent errors with screenshot." },
  ],
  Billing: [
    { question: "Payment methods accepted", answer: "We support major cards, UPI, and selected regional digital wallets." },
    { question: "Refund policy", answer: "Eligible refund requests are processed within 5-7 business days based on plan policy." },
    { question: "Premium features", answer: "Premium includes advanced analytics, pro assessments, and priority support channels." },
  ],
};

const helpCategories = [
  { title: "Getting Started", count: 14, icon: CircleHelp },
  { title: "Account Issues", count: 11, icon: LifeBuoy },
  { title: "Technical Support", count: 23, icon: Bot },
  { title: "Billing", count: 9, icon: MessageCircle },
  { title: "Assessments", count: 12, icon: Search },
  { title: "Community", count: 8, icon: Video },
];

const popularArticles = [
  { title: "Contest Registration Checklist", description: "Everything to verify before joining a live contest." },
  { title: "Submission Timeout Troubleshooting", description: "Fix common causes of runtime and network timeout failures." },
  { title: "Profile Verification Best Practices", description: "Complete trust indicators and increase collaboration opportunities." },
  { title: "Billing & Invoices Guide", description: "Find invoices, manage subscriptions, and configure tax details." },
];

const videoTutorials = [
  { title: "First Contest Walkthrough", duration: "08:12" },
  { title: "How to Use Assessments", duration: "10:45" },
  { title: "Report a Technical Issue", duration: "06:37" },
];

export default function HelpCenterPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<HelpCategory | "All">("All");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    priority: "Medium",
  });
  const [submitting, setSubmitting] = useState(false);

  const filteredFaq = useMemo(() => {
    const rows = Object.entries(faqData).flatMap(([category, faqs]) =>
      faqs.map((faq, index) => ({ id: `${category}-${index}`, category: category as HelpCategory, ...faq })),
    );
    return rows.filter((row) => {
      const categoryMatch = activeCategory === "All" || row.category === activeCategory;
      const text = `${row.question} ${row.answer} ${row.category}`.toLowerCase();
      const queryMatch = !search.trim() || text.includes(search.toLowerCase());
      return categoryMatch && queryMatch;
    });
  }, [activeCategory, search]);

  const submitContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
      toast.error("Please complete all contact form fields.");
      return;
    }
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setSubmitting(false);
    toast.success("Support ticket submitted. Typical response time is under 5 minutes.");
    setContactForm({ name: "", email: "", subject: "", message: "", priority: "Medium" });
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: filteredFaq.slice(0, 6).map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <article className="space-y-6">
      <SeoJsonLd data={schema} />
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">How can we help you?</h1>
        <p className="text-muted-foreground">Find answers quickly, contact support, or start live assistance.</p>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
              placeholder="Search for answers..."
              aria-label="Search help topics"
            />
          </div>
          <Button onClick={() => toast.info("Live support agent available in under 5 minutes.")} className="gap-2">
            <MessageCircle size={16} />
            Live chat
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["All", "Getting Started", "Account Issues", "Technical Support", "Billing"] as const).map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {helpCategories.map((item) => (
          <div key={item.title} className="glass-card p-4 transition hover:-translate-y-0.5">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <item.icon size={18} />
            </div>
            <h2 className="font-semibold">{item.title}</h2>
            <p className="text-sm text-muted-foreground">{item.count} articles</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="mb-3 text-xl font-semibold">FAQ</h2>
          <Accordion type="single" collapsible>
            {filteredFaq.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2 text-sm text-muted-foreground">{item.answer}</p>
                  <span className="inline-block rounded-full bg-primary/15 px-2 py-1 text-xs text-primary">{item.category}</span>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {filteredFaq.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No FAQs match your search.</p>}
        </div>

        <aside className="glass-card p-5">
          <h2 className="mb-3 text-xl font-semibold">Contact Support</h2>
          <form onSubmit={submitContact} className="space-y-3">
            <Input
              placeholder="Name"
              value={contactForm.name}
              onChange={(event) => setContactForm((prev) => ({ ...prev, name: event.target.value }))}
              aria-label="Support name"
            />
            <Input
              type="email"
              placeholder="Email"
              value={contactForm.email}
              onChange={(event) => setContactForm((prev) => ({ ...prev, email: event.target.value }))}
              aria-label="Support email"
            />
            <Input
              placeholder="Subject"
              value={contactForm.subject}
              onChange={(event) => setContactForm((prev) => ({ ...prev, subject: event.target.value }))}
              aria-label="Support subject"
            />
            <Textarea
              placeholder="Message"
              value={contactForm.message}
              onChange={(event) => setContactForm((prev) => ({ ...prev, message: event.target.value }))}
              aria-label="Support message"
            />
            <label className="block text-xs text-muted-foreground" htmlFor="prioritySelect">Priority</label>
            <select
              id="prioritySelect"
              value={contactForm.priority}
              onChange={(event) => setContactForm((prev) => ({ ...prev, priority: event.target.value }))}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
            <Input type="file" aria-label="Attach screenshot" />
            <Button type="submit" disabled={submitting} className="w-full gap-2">
              <Send size={14} />
              {submitting ? "Submitting..." : "Submit request"}
            </Button>
            <p className="text-xs text-muted-foreground">Support hours: 24/7 | Typical response time: under 5 minutes.</p>
          </form>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="mb-3 text-xl font-semibold">Popular Articles</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {popularArticles.map((item) => (
              <article key={item.title} className="rounded-xl border border-border/70 bg-muted/25 p-3">
                <h3 className="font-medium">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                <button className="mt-2 text-xs font-medium text-primary transition hover:underline">Read more</button>
              </article>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="mb-3 text-xl font-semibold">Video Tutorials</h2>
          <div className="space-y-3">
            {videoTutorials.map((item) => (
              <article key={item.title} className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/25 p-3">
                <div>
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.duration}</p>
                </div>
                <Button size="sm" variant="outline" className="gap-1">
                  <PlayCircle size={14} />
                  Play
                </Button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-card p-5">
        <h2 className="text-xl font-semibold">Still need help?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Contact us by email, live chat, or phone. We guarantee first response in under 5 minutes.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline">support@knightsbattlezone.com</Button>
          <Button variant="outline">+1 (800) 555-0199</Button>
          <Button onClick={() => toast.info("Live chat launched with agent Priya.")}>Chat with agent</Button>
        </div>
      </section>
    </article>
  );
}
