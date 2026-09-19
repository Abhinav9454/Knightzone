import { useMemo, useState, type ComponentType } from "react";
import { Award, BarChart3, BookOpen, CheckCircle2, Code2, FileBadge2, Filter, Flame, ListChecks, Trophy } from "lucide-react";
import { toast } from "sonner";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const skillTests = [
  { category: "Programming", stack: "Python, Java, C++, JavaScript", difficulty: "Beginner to Expert", duration: "30-120 min", questions: "20-50" },
  { category: "Web Development", stack: "HTML/CSS, React, Node.js", difficulty: "Beginner to Advanced", duration: "45-90 min", questions: "18-35" },
  { category: "Data Science", stack: "SQL, Python libs, ML", difficulty: "Intermediate to Expert", duration: "60-120 min", questions: "22-45" },
  { category: "Aptitude", stack: "Quant, Logical, Verbal", difficulty: "Entry to Mid", duration: "30-75 min", questions: "25-40" },
];

const challenges = [
  { title: "Binary Search Mastery", difficulty: "Easy", successRate: 72, submissions: 1280, limit: "45 min", points: 120 },
  { title: "Distributed Cache Design", difficulty: "Hard", successRate: 31, submissions: 310, limit: "90 min", points: 420 },
  { title: "React Performance Sprint", difficulty: "Medium", successRate: 54, submissions: 870, limit: "60 min", points: 260 },
];

const problems = [
  { id: "A-101", title: "Two Sum Variant", acceptance: 78, difficulty: "Easy", status: "Solved" },
  { id: "A-220", title: "Rate Limiter", acceptance: 48, difficulty: "Medium", status: "Attempted" },
  { id: "A-401", title: "Realtime Collaboration", acceptance: 24, difficulty: "Hard", status: "Unsolved" },
];

const leaderboard = [
  { rank: 1, name: "Aditi", score: 9240, solved: 284 },
  { rank: 2, name: "Rohan", score: 9015, solved: 271 },
  { rank: 3, name: "Nina", score: 8870, solved: 266 },
];

const certificates = [
  { name: "Frontend Excellence", issued: "Jan 2026", verify: "CERT-FE-2026-1031" },
  { name: "Data Structures Specialist", issued: "Dec 2025", verify: "CERT-DS-2025-7781" },
];

const history = [
  { test: "React Fundamentals", score: "82%", time: "42 min", date: "2026-02-20" },
  { test: "SQL Analytics", score: "77%", time: "38 min", date: "2026-02-10" },
  { test: "System Design Basics", score: "69%", time: "51 min", date: "2026-01-30" },
];

export default function AssessmentPage() {
  const [difficulty, setDifficulty] = useState("All");
  const [problemStatus, setProblemStatus] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");

  const filteredChallenges = useMemo(() => {
    return challenges.filter((item) => difficulty === "All" || item.difficulty === difficulty);
  }, [difficulty]);

  const filteredProblems = useMemo(() => {
    return problems.filter((item) => {
      const difficultyMatch = difficulty === "All" || item.difficulty === difficulty;
      const statusMatch = problemStatus === "All" || item.status === problemStatus;
      const topicMatch = topicFilter === "All" || item.title.toLowerCase().includes(topicFilter.toLowerCase());
      return difficultyMatch && statusMatch && topicMatch;
    });
  }, [difficulty, problemStatus, topicFilter]);

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Assessment Platform",
    description: "Skill tests, coding challenges, progress tracking, and certificates.",
  };

  return (
    <article className="space-y-6">
      <SeoJsonLd data={schema} />
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Assessment Platform</h1>
        <p className="text-muted-foreground">Track skill growth with tests, challenges, progress analytics, and certifications.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-4"><p className="text-xs text-muted-foreground">Assessments completed</p><p className="text-2xl font-bold">37</p></div>
        <div className="glass-card p-4"><p className="text-xs text-muted-foreground">Average score</p><p className="text-2xl font-bold">81%</p></div>
        <div className="glass-card p-4"><p className="text-xs text-muted-foreground">Rank among peers</p><p className="text-2xl font-bold">#14</p></div>
        <div className="glass-card p-4"><p className="text-xs text-muted-foreground">Current streak</p><p className="text-2xl font-bold">18 days</p></div>
      </section>

      <section className="glass-card p-5">
        <h2 className="mb-3 text-xl font-semibold">Skill Test Categories</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {skillTests.map((test) => (
            <article key={test.category} className="rounded-xl border border-border/70 bg-muted/25 p-4">
              <h3 className="font-semibold">{test.category}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{test.stack}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{test.difficulty}</span><span>|</span><span>{test.duration}</span><span>|</span><span>{test.questions} questions</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="glass-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Coding Challenges</h2>
          <div className="flex gap-2">
            {["All", "Easy", "Medium", "Hard"].map((level) => (
              <Button key={level} size="sm" variant={difficulty === level ? "default" : "outline"} onClick={() => setDifficulty(level)}>
                {level}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {filteredChallenges.map((item) => (
            <article key={item.title} className="rounded-xl border border-border/70 bg-muted/25 p-4">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{item.difficulty} | {item.limit} | {item.points} points</p>
              <Progress value={item.successRate} className="mt-3 h-2" />
              <p className="mt-2 text-xs text-muted-foreground">Success rate: {item.successRate}% | Submissions: {item.submissions}</p>
              <Button className="mt-3 w-full" size="sm">Start Challenge</Button>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Filter size={16} className="text-primary" />
            <h2 className="text-xl font-semibold">Practice Problems</h2>
          </div>
          <div className="mb-3 grid gap-2 sm:grid-cols-3">
            <select value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option>All</option><option>sum</option><option>cache</option><option>collaboration</option>
            </select>
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option>All</option><option>Easy</option><option>Medium</option><option>Hard</option>
            </select>
            <select value={problemStatus} onChange={(event) => setProblemStatus(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option>All</option><option>Solved</option><option>Attempted</option><option>Unsolved</option>
            </select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Acceptance</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProblems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{item.acceptance}%</TableCell>
                  <TableCell>{item.difficulty}</TableCell>
                  <TableCell className="font-medium">{item.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="glass-card p-5">
          <h2 className="text-xl font-semibold">Progress Tracker</h2>
          <div className="mt-3 space-y-3">
            <ProgressBar label="Programming" value={84} />
            <ProgressBar label="Web Development" value={72} />
            <ProgressBar label="Data Science" value={63} />
            <ProgressBar label="Aptitude" value={79} />
          </div>
          <div className="mt-4 rounded-xl border border-border/70 bg-muted/25 p-3 text-sm text-muted-foreground">
            Weak area: advanced system design. Recommended next test: "Distributed Systems Intermediate".
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm">Learning Path</Button>
            <Button variant="outline" size="sm">Recommended Tests</Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="mb-3 text-xl font-semibold">Leaderboard</h2>
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div key={entry.rank} className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/25 p-3">
                <p className="font-medium">#{entry.rank} {entry.name}</p>
                <p className="text-sm text-muted-foreground">{entry.score} pts | {entry.solved} solved</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outline">This week</Button>
            <Button size="sm" variant="outline">This month</Button>
            <Button size="sm">All time</Button>
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="mb-3 text-xl font-semibold">Certificates</h2>
          <div className="space-y-2">
            {certificates.map((item) => (
              <div key={item.verify} className="rounded-xl border border-border/70 bg-muted/25 p-3">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">Issued: {item.issued}</p>
                <p className="text-xs text-muted-foreground">Verification: {item.verify}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline">Download PDF</Button>
                  <Button size="sm" onClick={() => toast.success("LinkedIn share draft prepared.")}>Share</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="mb-3 text-xl font-semibold">Test History</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assessment</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.test}>
                  <TableCell>{item.test}</TableCell>
                  <TableCell>{item.score}</TableCell>
                  <TableCell>{item.time}</TableCell>
                  <TableCell>{item.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline">Review answers</Button>
            <Button size="sm">Retake</Button>
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="mb-3 text-xl font-semibold">Challenge Arena</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <ArenaItem icon={Code2} label="Live coding environment" />
            <ArenaItem icon={ListChecks} label="Test cases runner" />
            <ArenaItem icon={BookOpen} label="Hint system" />
            <ArenaItem icon={BarChart3} label="Output console" />
            <ArenaItem icon={Trophy} label="Leaderboard tie-ins" />
            <ArenaItem icon={FileBadge2} label="Discussion per problem" />
          </div>
          <div className="mt-4 rounded-xl border border-border/70 bg-muted/25 p-3 text-sm text-muted-foreground">
            Multi-language support enabled with sandbox execution and plagiarism-aware checks.
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={CheckCircle2} label="Completed" value="37 tests" />
        <SummaryCard icon={Flame} label="Streak" value="18 days" />
        <SummaryCard icon={Award} label="Badges earned" value="12 badges" />
      </section>
    </article>
  );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span>{label}</span>
        <span className="text-muted-foreground">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

function ArenaItem({ icon: Icon, label }: { icon: ComponentType<{ size?: number; className?: string }>; label: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/25 p-3 text-sm">
      <Icon size={15} className="mb-1 text-primary" />
      {label}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
  return (
    <div className="glass-card p-4">
      <Icon size={16} className="mb-1 text-primary" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
