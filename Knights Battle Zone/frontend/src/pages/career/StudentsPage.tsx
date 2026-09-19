import { useMemo, type ComponentType } from "react";
import { BadgeCheck, BookOpen, CalendarClock, Medal, Users } from "lucide-react";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const upcomingContests = [
  { name: "US Spring Challenge", date: "2026-03-14T18:00:00Z", duration: "120 min", pool: "$12,000", level: "Medium", participants: 1240, registered: true },
  { name: "Algorithm Marathon", date: "2026-03-21T16:00:00Z", duration: "180 min", pool: "$18,000", level: "Hard", participants: 980, registered: false },
];

const pastResults = [
  { contest: "Winter Code Clash", rank: 82, score: 760, editorial: true, certificate: true },
  { contest: "Data Sprint 2026", rank: 56, score: 820, editorial: true, certificate: false },
  { contest: "Campus Cup", rank: 31, score: 910, editorial: true, certificate: true },
];

const resources = {
  videos: [
    { title: "Graph Theory Foundation", instructor: "Priya M.", duration: "42 min" },
    { title: "DP in Interviews", instructor: "Rahul D.", duration: "58 min" },
  ],
  materials: [
    { title: "DSA Quick Revision Notes", type: "PDF" },
    { title: "System Design Cheat Sheet", type: "Cheat Sheet" },
  ],
  practice: [
    { title: "Arrays Master Pack", level: "Easy to Medium" },
    { title: "Greedy + Graphs Set", level: "Medium to Hard" },
  ],
};

const successStories = [
  { name: "Nikita Sharma", achievement: "Internship at top SaaS company", before: "Rank 540", after: "Rank 62" },
  { name: "Kevin Lee", achievement: "Won regional coding championship", before: "3 contests", after: "24 contests" },
];

const scholarships = [
  { name: "Merit Plus Scholarship", eligibility: "Top 10% assessment score", deadline: "2026-04-10", amount: "$2,000" },
  { name: "Community Impact Grant", eligibility: "Active mentor + contributor", deadline: "2026-05-02", amount: "$1,200" },
];

const clubs = [
  { name: "AI Builders Club", members: 180, activities: "Weekly project labs" },
  { name: "Competitive Coders Circle", members: 240, activities: "Contest prep sessions" },
];

const badges = [
  { label: "Consistency Pro", progress: 82 },
  { label: "Contest Finisher", progress: 95 },
  { label: "Peer Mentor", progress: 61 },
];

export default function StudentsPage() {
  const contestsWithCountdown = useMemo(
    () => {
      const now = new Date();
      return upcomingContests.map((contest) => {
        const start = new Date(contest.date);
        const diffMs = Math.max(start.getTime() - now.getTime(), 0);
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        return { ...contest, countdown: `${hours}h to start` };
      });
    },
    [],
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Students Hub",
    description: "Contests, resources, scholarships, and student communities.",
  };

  return (
    <article className="space-y-6">
      <SeoJsonLd data={schema} />
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Students Hub</h1>
        <p className="text-muted-foreground">Dedicated space for learners to compete, practice, and grow with the community.</p>
      </header>

      <section className="glass-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Student Dashboard</h2>
          <Button size="sm">Complete Profile</Button>
        </div>
        <Progress value={78} className="h-2" />
        <p className="mt-1 text-xs text-muted-foreground">Profile completion: 78%</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Contests Participated" value="29" icon={CalendarClock} />
          <Stat label="Problems Solved" value="412" icon={BookOpen} />
          <Stat label="Best Rank" value="#31" icon={Medal} />
          <Stat label="Badges Earned" value="18" icon={BadgeCheck} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="mb-3 text-xl font-semibold">Upcoming Contests</h2>
          <div className="space-y-3">
            {contestsWithCountdown.map((contest) => (
              <article key={contest.name} className="rounded-xl border border-border/70 bg-muted/25 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{contest.name}</h3>
                    <p className="text-xs text-muted-foreground">{new Date(contest.date).toLocaleString()} • {contest.duration}</p>
                  </div>
                  <span className="rounded-full bg-primary/15 px-2 py-1 text-xs text-primary">{contest.level}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Prize Pool: {contest.pool} • {contest.participants} registered • {contest.countdown}</p>
                <Button className="mt-3" size="sm" variant={contest.registered ? "outline" : "default"}>
                  {contest.registered ? "Registered" : "Register now"}
                </Button>
              </article>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="mb-3 text-xl font-semibold">Past Contest Results</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contest</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Editorial</TableHead>
                <TableHead>Certificate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pastResults.map((row) => (
                <TableRow key={row.contest}>
                  <TableCell>{row.contest}</TableCell>
                  <TableCell>#{row.rank}</TableCell>
                  <TableCell>{row.score}</TableCell>
                  <TableCell>{row.editorial ? "Available" : "Soon"}</TableCell>
                  <TableCell>{row.certificate ? "Download" : "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="glass-card p-5">
        <h2 className="text-xl font-semibold">Learning Resources</h2>
        <Tabs defaultValue="videos" className="mt-3">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="videos">Video Lectures</TabsTrigger>
            <TabsTrigger value="materials">Study Material</TabsTrigger>
            <TabsTrigger value="practice">Practice Sets</TabsTrigger>
          </TabsList>
          <TabsContent value="videos" className="mt-3 grid gap-2 sm:grid-cols-2">
            {resources.videos.map((item) => (
              <div key={item.title} className="rounded-xl border border-border/70 bg-muted/25 p-3">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.instructor} • {item.duration}</p>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="materials" className="mt-3 grid gap-2 sm:grid-cols-2">
            {resources.materials.map((item) => (
              <div key={item.title} className="rounded-xl border border-border/70 bg-muted/25 p-3">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.type}</p>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="practice" className="mt-3 grid gap-2 sm:grid-cols-2">
            {resources.practice.map((item) => (
              <div key={item.title} className="rounded-xl border border-border/70 bg-muted/25 p-3">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.level}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="mb-3 text-xl font-semibold">Student Success Stories</h2>
          <div className="space-y-3">
            {successStories.map((story) => (
              <article key={story.name} className="rounded-xl border border-border/70 bg-muted/25 p-3">
                <h3 className="font-semibold">{story.name}</h3>
                <p className="text-sm text-muted-foreground">{story.achievement}</p>
                <p className="mt-1 text-xs text-muted-foreground">Before: {story.before} | After: {story.after}</p>
                <Button size="sm" className="mt-2" variant="outline">Read more</Button>
              </article>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="mb-3 text-xl font-semibold">Scholarships</h2>
          <div className="space-y-3">
            {scholarships.map((item) => (
              <article key={item.name} className="rounded-xl border border-border/70 bg-muted/25 p-3">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-xs text-muted-foreground">Eligibility: {item.eligibility}</p>
                <p className="text-xs text-muted-foreground">Deadline: {item.deadline} | Amount: {item.amount}</p>
                <Button size="sm" className="mt-2">Apply now</Button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="mb-3 text-xl font-semibold">Student Clubs</h2>
          <div className="space-y-2">
            {clubs.map((club) => (
              <div key={club.name} className="rounded-xl border border-border/70 bg-muted/25 p-3">
                <p className="font-medium">{club.name}</p>
                <p className="text-xs text-muted-foreground">{club.members} members • {club.activities}</p>
                <Button size="sm" variant="outline" className="mt-2">Join request</Button>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="mb-3 text-xl font-semibold">Community</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <CommunityCard title="Discussion Forums" />
            <CommunityCard title="Study Groups" />
            <CommunityCard title="Peer Mentoring" />
            <CommunityCard title="Share Resources" />
          </div>
          <div className="mt-4 rounded-xl border border-border/70 bg-muted/25 p-3">
            <h3 className="font-medium">Achievements & Badges</h3>
            <div className="mt-2 space-y-2">
              {badges.map((badge) => (
                <div key={badge.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span>{badge.label}</span>
                    <span className="text-muted-foreground">{badge.progress}%</span>
                  </div>
                  <Progress value={badge.progress} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: ComponentType<{ size?: number; className?: string }> }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/25 p-3">
      <Icon size={16} className="mb-1 text-primary" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function CommunityCard({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
      <p className="text-sm font-medium">{title}</p>
      <Button size="sm" variant="outline" className="mt-2 gap-1">
        <Users size={12} />
        Join
      </Button>
    </div>
  );
}
