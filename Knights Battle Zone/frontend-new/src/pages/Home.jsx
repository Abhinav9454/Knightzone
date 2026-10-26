import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, BarChart3, BookOpen, Check, ChevronRight,
  CirclePlay, GitBranch, Search, ShieldCheck, Sparkles, Swords, Target,
  TerminalSquare, Trophy, Zap
} from "lucide-react";
import { BattleArenaIllustration } from "../components/svg";

const problems = [
  { id: "001", title: "Two Sum", description: "Find two numbers that add up to a target.", topics: ["Array", "Hash Table"], level: "Easy", levelClass: "bg-emerald-50 text-emerald-700", acceptance: "52.4%" },
  { id: "002", title: "Longest Substring Without Repeating Characters", description: "Find the longest substring with unique characters.", topics: ["String", "Sliding Window"], level: "Medium", levelClass: "bg-amber-50 text-amber-700", acceptance: "34.8%" },
  { id: "003", title: "Merge K Sorted Lists", description: "Merge multiple sorted linked lists efficiently.", topics: ["Linked List", "Heap"], level: "Hard", levelClass: "bg-rose-50 text-rose-700", acceptance: "48.1%" },
];

const pathways = [
  { number: "01", title: "Data Structures", detail: "Arrays, linked lists, trees, graphs and more.", icon: GitBranch, count: "12 topics" },
  { number: "02", title: "Algorithms", detail: "Searching, sorting, recursion and dynamic programming.", icon: Zap, count: "16 topics" },
  { number: "03", title: "Interview Prep", detail: "Build confidence with curated interview patterns.", icon: Target, count: "8 study plans" },
];

const contests = [
  { type: "WEEKLY CONTEST", title: "KBZ Weekly Challenge", date: "Oct 25, 2026", time: "90 min", tag: "All levels" },
  { type: "BEGINNER SPRINT", title: "First Steps Sprint", date: "Oct 28, 2026", time: "45 min", tag: "Beginner" },
];

function Eyebrow({ children }) {
  return <p className="mb-3 text-xs font-bold uppercase tracking-[0.17em] text-orange-600">{children}</p>;
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function DifficultyBadge({ level, className }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{level}</span>;
}

export default function Home() {
  const [heroView, setHeroView] = useState("arena");

  return (
    <main className="min-h-screen bg-[#F7F8FA] text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="pointer-events-none absolute -right-28 -top-28 h-[30rem] w-[30rem] rounded-full bg-orange-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-[28%] h-80 w-80 rounded-full bg-amber-50 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-bold text-orange-700">
              <Sparkles size={14} /> A BETTER WAY TO PRACTICE DSA
            </div>
            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Become the kind of <span className="block text-orange-600">developer who solves.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Practice with purpose, understand patterns, and challenge yourself. KBZ brings problem-solving practice and competitive coding into one focused workspace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/problems" className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200">
                Explore problems <ArrowRight size={17} />
              </Link>
              <Link to="/contests" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50">
                <Trophy size={16} /> Browse contests
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2"><Check size={16} className="text-emerald-600" /> Practice by topic</span>
              <span className="inline-flex items-center gap-2"><Check size={16} className="text-emerald-600" /> Learn from every attempt</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-xl">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_80px_-40px_rgba(15,23,42,0.3)]">
              {/* Header with Switcher Tabs */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHeroView("arena")}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      heroView === "arena"
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Swords size={13} />
                    Battle Arena
                  </button>
                  <button
                    onClick={() => setHeroView("editor")}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                      heroView === "editor"
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <TerminalSquare size={13} />
                    Workspace
                  </button>
                </div>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase">
                  {heroView === "arena" ? "Live Arena" : "JavaScript"}
                </span>
              </div>

              {heroView === "arena" ? (
                <div className="p-5 bg-gradient-to-b from-white to-slate-50/50 flex flex-col items-center">
                  <BattleArenaIllustration className="w-full h-auto max-h-[290px]" />
                  <div className="flex items-center justify-between w-full border-t border-slate-100 pt-3 mt-1">
                    <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      500+ Algorithmic Challenges Ready
                    </span>
                    <Link
                      to="/arena"
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                    >
                      Enter Arena <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-[0.88fr_1.12fr]">
                  <div className="border-b border-slate-200 p-4 md:border-b-0 md:border-r">
                    <div className="flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Problem 001</span><DifficultyBadge level="Easy" className="bg-emerald-50 text-emerald-700" /></div>
                    <h3 className="mt-3 text-base font-bold text-slate-900">Two Sum</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-600">Given an array of integers, return the indices of two numbers that add up to the target.</p>
                    <div className="mt-4 rounded-lg bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Example</p><p className="mt-1 font-mono text-xs text-slate-700">nums = [2, 7, 11, 15]</p><p className="font-mono text-xs text-slate-700">target = 9</p><p className="mt-1 font-mono text-xs font-semibold text-emerald-700">Output: [0, 1]</p></div>
                  </div>
                  <div className="bg-[#FCFCFD] p-4">
                    <div className="mb-4 flex items-center justify-between"><span className="text-xs font-semibold text-slate-700">Solution.js</span><span className="text-[10px] text-slate-400">Editor preview</span></div>
                    <div className="space-y-2 font-mono text-[11px] leading-5">
                      <div><span className="mr-3 text-slate-300">1</span><span className="text-violet-600">function</span> <span className="text-blue-700">twoSum</span>(nums, target) {"{"}</div>
                      <div><span className="mr-3 text-slate-300">2</span><span className="pl-3 text-violet-600">const</span> seen = <span className="text-violet-600">new</span> Map();</div>
                      <div><span className="mr-3 text-slate-300">3</span><span className="pl-3 text-violet-600">for</span> (<span className="text-violet-600">let</span> i = 0; i &lt; nums.length; i++) {"{"}</div>
                      <div><span className="mr-3 text-slate-300">4</span><span className="pl-6 text-violet-600">const</span> need = target - nums[i];</div>
                      <div><span className="mr-3 text-slate-300">5</span><span className="pl-6 text-violet-600">if</span> (seen.has(need)) <span className="text-slate-400">...</span></div>
                      <div><span className="mr-3 text-slate-300">6</span><span className="pl-3 text-slate-500">{"}"}</span></div>
                      <div><span className="mr-3 text-slate-300">7</span><span className="text-slate-500">{"}"}</span></div>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-3"><span className="text-[10px] text-slate-400">Example interface only</span><span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white"><CirclePlay size={13} /> Run</span></div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center"><BookOpen className="mx-auto text-orange-600" size={18} /><p className="mt-2 text-xs font-bold text-slate-900">Practice</p><p className="mt-1 text-[10px] text-slate-500">Build foundations</p></div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center"><BarChart3 className="mx-auto text-orange-600" size={18} /><p className="mt-2 text-xs font-bold text-slate-900">Progress</p><p className="mt-1 text-[10px] text-slate-500">See improvement</p></div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center"><Swords className="mx-auto text-orange-600" size={18} /><p className="mt-2 text-xs font-bold text-slate-900">Compete</p><p className="mt-1 text-[10px] text-slate-500">Test your skills</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-8 sm:px-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div><p className="text-sm font-bold text-slate-900">What do you want to practice today?</p><p className="mt-1 text-xs text-slate-500">Start with a topic or jump into a problem.</p></div>
          <Link to="/problems" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-700"><Search size={16} /> Find a problem <ArrowRight size={15} /></Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <SectionHeading eyebrow="The practice room" title="Problems that make you better" description="Work through popular patterns, from your first array problem to advanced data structures." action={<Link to="/problems" className="inline-flex items-center gap-1 text-sm font-bold text-orange-600 hover:text-orange-700">Browse problem set <ChevronRight size={17} /></Link>} />
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="hidden grid-cols-[64px_minmax(0,1fr)_minmax(150px,0.7fr)_90px_80px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 md:grid"><span>#</span><span>Title</span><span>Topics</span><span>Level</span><span className="text-right">Acceptance</span></div>
          {problems.map((problem, index) => (
            <Link to="/problems" key={problem.id} className={`grid gap-2 px-5 py-4 transition hover:bg-orange-50/40 md:grid-cols-[64px_minmax(0,1fr)_minmax(150px,0.7fr)_90px_80px] md:items-center md:gap-4 ${index !== problems.length - 1 ? "border-b border-slate-100" : ""}`}>
              <span className="text-xs font-medium text-slate-400">{problem.id}</span>
              <div><p className="text-sm font-semibold text-slate-900">{problem.title}</p><p className="mt-1 text-xs text-slate-500">{problem.description}</p></div>
              <div className="flex flex-wrap gap-1.5">{problem.topics.map((topic) => <span key={topic} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">{topic}</span>)}</div>
              <span><DifficultyBadge level={problem.level} className={problem.levelClass} /></span>
              <span className="text-left text-xs text-slate-500 md:text-right">{problem.acceptance}</span>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">Sample problem data for the frontend preview. Connect your problem API for live content.</p>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <SectionHeading eyebrow="Learn with direction" title="Choose your path" description="Structured pathways help turn random practice into steady progress." />
          <div className="grid gap-4 md:grid-cols-3">
            {pathways.map(({ number, title, detail, icon: Icon, count }) => (
              <Link to="/problems" key={title} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-slate-200/50 sm:p-6">
                <div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Icon size={21} /></div><span className="font-mono text-xs text-slate-300">{number}</span></div>
                <h3 className="mt-5 text-base font-bold text-slate-900">{title}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{detail}</p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-xs font-medium text-slate-500">{count}</span><ArrowUpRight size={17} className="text-slate-400 transition group-hover:text-orange-600" /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <SectionHeading eyebrow="Competitive coding" title="Practice solo. Prove it in a contest." description="Timed challenges give you a way to apply your skills, manage time, and learn under pressure." action={<Link to="/contests" className="inline-flex items-center gap-1 text-sm font-bold text-orange-600 hover:text-orange-700">View all contests <ChevronRight size={17} /></Link>} />
        <div className="grid gap-4 md:grid-cols-2">
          {contests.map((contest) => (
            <div key={contest.title} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-orange-200 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-bold tracking-[0.12em] text-orange-700">{contest.type}</span><span className="text-xs text-slate-500">{contest.tag}</span></div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{contest.title}</h3><div className="mt-2 flex gap-3 text-sm text-slate-500"><span>{contest.date}</span><span>·</span><span>{contest.time}</span></div>
              <Link to="/contests" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-orange-600">Contest details <ArrowRight size={16} /></Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-8 sm:pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-10 sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
            <div className="max-w-2xl"><div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-orange-300"><ShieldCheck size={15} /> Consistency beats cramming</div><h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Your next breakthrough starts with one problem.</h2><p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">Create your KBZ account and make focused practice part of your routine.</p></div>
            <Link to="/register" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-orange-600">Get started for free <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p><span className="font-bold text-slate-900">Knight Battle Zone</span><span className="mx-2 text-slate-300">|</span>Practice with purpose.</p>
          <div className="flex flex-wrap items-center gap-4"><Link to="/problems" className="hover:text-orange-600">Problems</Link><Link to="/contests" className="hover:text-orange-600">Contests</Link><Link to="/leaderboard" className="hover:text-orange-600">Leaderboard</Link></div>
        </div>
      </footer>
    </main>
  );
}
