import { useMemo, useState, type FormEvent } from "react";
import { Briefcase, Building2, Clock3, Filter, Globe, HeartPulse, Home, Laptop2, MapPin, Search, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type JobType = "Full-time" | "Part-time" | "Internship" | "Contract";
type Experience = "Entry" | "Mid" | "Senior" | "Lead";

interface JobOpening {
  id: number;
  title: string;
  department: string;
  location: string;
  type: JobType;
  experience: Experience;
  remote: "Remote" | "Onsite" | "Hybrid";
  salary: string;
  posted: string;
}

const openings: JobOpening[] = [
  { id: 1, title: "Senior Full Stack Developer", department: "Engineering", location: "United States", type: "Full-time", experience: "Senior", remote: "Hybrid", salary: "$120k - $155k", posted: "Posted 2 days ago" },
  { id: 2, title: "Product Designer", department: "Design", location: "Remote", type: "Full-time", experience: "Mid", remote: "Remote", salary: "$90k - $120k", posted: "Posted 4 days ago" },
  { id: 3, title: "Campus Success Manager", department: "Operations", location: "United States", type: "Full-time", experience: "Mid", remote: "Onsite", salary: "$35k - $52k", posted: "Posted 1 week ago" },
  { id: 4, title: "DevRel Internship", department: "Community", location: "United States", type: "Internship", experience: "Entry", remote: "Remote", salary: "$2k / month", posted: "Posted 1 day ago" },
  { id: 5, title: "Marketing Analyst", department: "Marketing", location: "United Kingdom", type: "Contract", experience: "Entry", remote: "Hybrid", salary: "$40/hr", posted: "Posted 5 days ago" },
];

const benefits = [
  { title: "Health Insurance", icon: HeartPulse },
  { title: "Flexible Hours", icon: Clock3 },
  { title: "Remote Work", icon: Home },
  { title: "Learning Budget", icon: Sparkles },
  { title: "Gym Membership", icon: ShieldCheck },
  { title: "Stock Options", icon: Briefcase },
];

const testimonials = [
  { name: "Ananya", role: "Frontend Engineer", quote: "Ownership here is real. You ship meaningful features every sprint." },
  { name: "Michael", role: "Product Manager", quote: "The team moves fast without compromising quality and empathy." },
  { name: "Riya", role: "Designer", quote: "Design decisions are data-driven and truly collaborative." },
];

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All");
  const [jobType, setJobType] = useState("All");
  const [experience, setExperience] = useState("All");
  const [remoteMode, setRemoteMode] = useState<"All" | "Remote" | "Onsite">("All");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    currentLocation: "",
    coverLetter: "",
    portfolio: "",
    linkedin: "",
  });

  const filteredOpenings = useMemo(() => {
    return openings.filter((job) => {
      const textMatch = !search.trim() || `${job.title} ${job.department}`.toLowerCase().includes(search.toLowerCase());
      const locationMatch = location === "All" || job.location === location;
      const typeMatch = jobType === "All" || job.type === jobType;
      const experienceMatch = experience === "All" || job.experience === experience;
      const remoteMatch = remoteMode === "All" || job.remote === remoteMode;
      return textMatch && locationMatch && typeMatch && experienceMatch && remoteMatch;
    });
  }, [search, location, jobType, experience, remoteMode]);

  const handleApply = (title: string) => {
    toast.success(`Application flow opened for ${title}.`);
  };

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step < 5) {
      setStep((prev) => prev + 1);
      return;
    }
    toast.success("Application submitted successfully.");
    setStep(1);
    setForm({ name: "", email: "", phone: "", currentLocation: "", coverLetter: "", portfolio: "", linkedin: "" });
  };

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Careers at Knights Battle Zone",
    description: "Current openings, internships, benefits, and application flow.",
  };

  return (
    <article className="space-y-6">
      <SeoJsonLd data={schema} />
      <header className="overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-primary/20 via-card to-accent/15 p-6">
        <p className="text-sm uppercase tracking-wider text-muted-foreground">Careers</p>
        <h1 className="mt-1 text-3xl font-bold">Join Our Team</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Shape the future of education technology with a global, mission-driven team.</p>
        <Button className="mt-4">View Open Positions</Button>
      </header>

      <section className="glass-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Filter size={16} className="text-primary" />
          <h2 className="text-xl font-semibold">Job Search Filters</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search by keyword..." />
          </div>
          <select value={location} onChange={(event) => setLocation(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option>All</option><option>Remote</option><option>United States</option><option>United Kingdom</option>
          </select>
          <select value={jobType} onChange={(event) => setJobType(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option>All</option><option>Full-time</option><option>Part-time</option><option>Internship</option><option>Contract</option>
          </select>
          <select value={experience} onChange={(event) => setExperience(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option>All</option><option>Entry</option><option>Mid</option><option>Senior</option><option>Lead</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["All", "Remote", "Onsite"] as const).map((mode) => (
            <Button key={mode} size="sm" variant={remoteMode === mode ? "default" : "outline"} onClick={() => setRemoteMode(mode)}>
              {mode}
            </Button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {filteredOpenings.map((job) => (
          <article key={job.id} className="glass-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{job.title}</h3>
                <p className="text-sm text-muted-foreground">{job.department}</p>
                <p className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin size={12} />{job.location}</span>
                  <span className="flex items-center gap-1"><Laptop2 size={12} />{job.remote}</span>
                  <span className="flex items-center gap-1"><Building2 size={12} />{job.type}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-primary">{job.salary}</p>
                <p className="text-xs text-muted-foreground">{job.posted}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={() => handleApply(job.title)}>Apply now</Button>
              <Button size="sm" variant="outline">View details</Button>
            </div>
          </article>
        ))}
        {filteredOpenings.length === 0 && <p className="text-sm text-muted-foreground">No openings match current filters.</p>}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="text-xl font-semibold">Company Culture</h2>
          <p className="mt-2 text-sm text-muted-foreground">Innovation, diversity, learning, and fun are part of our day-to-day culture.</p>
          <Tabs defaultValue="innovation" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="innovation">Innovation</TabsTrigger>
              <TabsTrigger value="diversity">Diversity</TabsTrigger>
              <TabsTrigger value="learning">Learning</TabsTrigger>
            </TabsList>
            <TabsContent value="innovation" className="text-sm text-muted-foreground">Rapid experiments and customer-led decisions drive our roadmap.</TabsContent>
            <TabsContent value="diversity" className="text-sm text-muted-foreground">Distributed team across 10+ countries with inclusive hiring practices.</TabsContent>
            <TabsContent value="learning" className="text-sm text-muted-foreground">Internal guilds, mentorship, and a dedicated annual learning budget.</TabsContent>
          </Tabs>
          <div className="mt-4 space-y-2">
            {testimonials.map((item) => (
              <blockquote key={item.name} className="rounded-lg border border-border/70 bg-muted/30 p-3">
                <p className="text-sm">"{item.quote}"</p>
                <footer className="mt-1 text-xs text-muted-foreground">{item.name}, {item.role}</footer>
              </blockquote>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="text-xl font-semibold">Internship Opportunities</h2>
          <p className="mt-2 text-sm text-muted-foreground">3-6 month structured internship with mentorship, stipend, and conversion pathway.</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Duration: 3-6 months</li>
            <li>Stipend: competitive monthly payout</li>
            <li>Tracks: engineering, design, data, developer relations</li>
            <li>Mentor-led capstone with leadership review</li>
          </ul>
          <Button className="mt-4">Apply for internships</Button>
        </div>
      </section>

      <section className="glass-card p-5">
        <h2 className="mb-3 text-xl font-semibold">Benefits & Perks</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="rounded-xl border border-border/70 bg-muted/25 p-3">
              <benefit.icon size={16} className="mb-2 text-primary" />
              <p className="font-medium">{benefit.title}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="text-xl font-semibold">Application Form</h2>
          <p className="mt-1 text-sm text-muted-foreground">Step {step} of 5</p>
          <form onSubmit={submitForm} className="mt-4 space-y-3">
            {step === 1 && (
              <>
                <Input placeholder="Full name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
                <Input type="email" placeholder="Email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
                <Input placeholder="Phone" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
                <Input placeholder="Location" value={form.currentLocation} onChange={(event) => setForm((prev) => ({ ...prev, currentLocation: event.target.value }))} />
              </>
            )}
            {step === 2 && <Input type="file" accept=".pdf,.doc,.docx" />}
            {step === 3 && <Textarea placeholder="Cover letter" value={form.coverLetter} onChange={(event) => setForm((prev) => ({ ...prev, coverLetter: event.target.value }))} />}
            {step === 4 && (
              <>
                <Input placeholder="Portfolio URL" value={form.portfolio} onChange={(event) => setForm((prev) => ({ ...prev, portfolio: event.target.value }))} />
                <Input placeholder="LinkedIn URL" value={form.linkedin} onChange={(event) => setForm((prev) => ({ ...prev, linkedin: event.target.value }))} />
              </>
            )}
            {step === 5 && (
              <div className="rounded-xl border border-border/70 bg-muted/25 p-3 text-sm text-muted-foreground">
                Review your details and submit your final application.
              </div>
            )}
            <div className="flex gap-2">
              {step > 1 && <Button type="button" variant="outline" onClick={() => setStep((prev) => prev - 1)}>Back</Button>}
              <Button type="submit">{step === 5 ? "Review & Submit" : "Continue"}</Button>
            </div>
          </form>
        </div>

        <div className="glass-card p-5">
          <h2 className="text-xl font-semibold">Why Join Us?</h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border/70 bg-muted/25 p-3 text-center">
              <p className="text-2xl font-bold text-primary">50+</p>
              <p className="text-xs text-muted-foreground">Employees</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/25 p-3 text-center">
              <p className="text-2xl font-bold text-primary">10+</p>
              <p className="text-xs text-muted-foreground">Countries</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/25 p-3 text-center">
              <p className="text-2xl font-bold text-primary">5+</p>
              <p className="text-xs text-muted-foreground">Awards</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Career growth paths, learning cohorts, and regular team events help you move fast and stay supported.</p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="gap-2"><Globe size={14} />Global teams</Button>
            <Button variant="outline">Growth programs</Button>
          </div>
        </div>
      </section>
    </article>
  );
}

