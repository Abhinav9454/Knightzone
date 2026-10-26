
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Swords,
  Zap,
  Clock3,
  ArrowUpRight,
  ArrowRight,
  Shield,
  Target,
  Users,
  ChevronRight,
  Terminal,
} from "lucide-react";
import { VersusClash, KnightCrest } from "../components/svg";

const matches = [
  {
    id: 1,
    title: "The Quick Draw",
    category: "Speed duel",
    difficulty: "Intermediate",
    duration: "15 min",
    rounds: "3 problems",
    reward: "100 XP",
    description:
      "Solve three short challenges before the clock runs out.",
    color: "lime",
  },
  {
    id: 2,
    title: "Algorithm Showdown",
    category: "Logic battle",
    difficulty: "Advanced",
    duration: "25 min",
    rounds: "2 problems",
    reward: "200 XP",
    description:
      "Put your data structures and algorithm knowledge to the test.",
    color: "blue",
  },
  {
    id: 3,
    title: "First Blood",
    category: "Practice duel",
    difficulty: "Beginner",
    duration: "10 min",
    rounds: "1 problem",
    reward: "50 XP",
    description:
      "A short practice round to warm up before a bigger challenge.",
    color: "orange",
  },
];

const Arena = () => {
  const [selectedMatch, setSelectedMatch] = useState(null);

  const colors = {
    lime: {
      tag: "border-[#c5ff55]/25 bg-[#c5ff55]/10 text-[#c5ff55]",
      number: "text-[#c5ff55]",
    },
    blue: {
      tag: "border-sky-400/20 bg-sky-400/10 text-sky-300",
      number: "text-sky-300",
    },
    orange: {
      tag: "border-orange-400/20 bg-orange-400/10 text-orange-300",
      number: "text-orange-300",
    },
  };

  return (
    <main className="min-h-screen bg-[#10120f] px-4 pb-12 pt-8 text-[#f1f2ec] sm:px-7 lg:px-10 lg:pt-10">
      <div className="mx-auto max-w-[1400px]">
        {/* Arena heading */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#181c16] p-6 sm:p-9 lg:p-12"
        >
          {/* Creative Knight Crest watermark */}
          <div className="pointer-events-none absolute -right-16 -top-16 select-none opacity-15">
            <KnightCrest className="w-96 h-96" glow={false} />
          </div>

          <div className="relative z-10 grid gap-9 lg:grid-cols-[1fr_320px] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c5ff55]/20 bg-[#c5ff55]/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#c5ff55]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c5ff55]" />
                Competitive zone
              </div>

              <h1 className="mt-6 max-w-2xl text-4xl font-black uppercase leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                Enter the
                <br />
                <span className="text-[#c5ff55]">arena.</span>
              </h1>

              <p className="mt-5 max-w-lg text-sm leading-7 text-[#a4a99e] sm:text-base">
                Sharpen your instincts. Beat the clock. Build the confidence
                to take on tougher coding challenges.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#match-types"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#c5ff55] px-5 py-3 text-sm font-bold text-[#14170f] transition hover:bg-[#d5ff83]"
                >
                  Explore matches <ArrowRight size={16} />
                </a>

                <Link
                  to="/problems"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
                >
                  <Terminal size={16} />
                  Practice first
                </Link>
              </div>
            </div>

            <div className="relative border-t border-white/10 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8c9385]">
                  Arena protocol
                </span>
                <Swords size={19} className="text-[#c5ff55]" />
              </div>

              {/* Creative Versus Clash SVG */}
              <div className="flex justify-center my-2">
                <VersusClash className="w-48 h-24" />
              </div>

              <div className="mt-6 space-y-4">
                {[
                  { icon: Target, label: "Choose a challenge" },
                  { icon: Clock3, label: "Solve before time" },
                  { icon: Shield, label: "Review your approach" },
                ].map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-[#c5ff55]">
                        <Icon size={17} />
                      </span>
                      <span className="text-sm text-[#d7dbd1]">
                        <span className="mr-3 font-mono text-xs text-[#737c6c]">
                          0{index + 1}
                        </span>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.header>

        {/* Stats strip */}
        <section className="my-6 grid grid-cols-2 border-y border-white/10 sm:grid-cols-4">
          {[
            { label: "Match formats", value: "03", icon: Swords },
            { label: "Practice duration", value: "10–25m", icon: Clock3 },
            { label: "Skill focus", value: "Logic", icon: Zap },
            { label: "Opponents", value: "Coming soon", icon: Users },
          ].map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className={`px-3 py-5 sm:px-5 ${
                  index % 2 === 0 ? "border-r border-white/10 sm:border-r-0" : ""
                } ${
                  index < 2 ? "border-b border-white/10 sm:border-b-0" : ""
                } sm:border-r sm:last:border-r-0`}
              >
                <div className="flex items-center gap-2 text-[#899181]">
                  <Icon size={15} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] sm:text-xs">
                    {item.label}
                  </span>
                </div>
                <p className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
                  {item.value}
                </p>
              </div>
            );
          })}
        </section>

        {/* Match selection */}
        <section id="match-types" className="scroll-mt-24">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c5ff55]">
                Select your mission
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Choose your match
              </h2>
              <p className="mt-2 text-sm text-[#899181]">
                Find a format that matches your current skill level.
              </p>
            </div>

            <span className="w-fit rounded-md border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#899181]">
              Training mode / Demo
            </span>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {matches.map((match, index) => {
              const style = colors[match.color];
              const isSelected = selectedMatch === match.id;

              return (
                <motion.article
                  key={match.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className={`relative flex flex-col overflow-hidden rounded-xl border bg-[#181c16] transition ${
                    isSelected
                      ? "border-[#c5ff55]/60"
                      : "border-white/10 hover:border-white/25"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#7e8775]">
                      MATCH / 0{match.id}
                    </span>
                    <span
                      className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${style.tag}`}
                    >
                      {match.category}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="max-w-[230px] text-xl font-bold tracking-tight">
                        {match.title}
                      </h3>
                      <span
                        className={`font-mono text-2xl font-bold ${style.number}`}
                      >
                        0{match.id}
                      </span>
                    </div>

                    <p className="mt-3 min-h-[48px] text-sm leading-6 text-[#9da496]">
                      {match.description}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3 border-y border-white/[0.08] py-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#788071]">
                          Duration
                        </p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold">
                          <Clock3 size={14} className="text-[#c5ff55]" />
                          {match.duration}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#788071]">
                          Challenge
                        </p>
                        <p className="mt-1.5 text-sm font-semibold">
                          {match.rounds}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#788071]">
                          Difficulty
                        </p>
                        <p className="mt-1.5 text-sm font-semibold">
                          {match.difficulty}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#788071]">
                          Demo reward
                        </p>
                        <p className={`mt-1.5 text-sm font-bold ${style.number}`}>
                          {match.reward}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedMatch(isSelected ? null : match.id)
                      }
                      className={`mt-5 flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-bold transition ${
                        isSelected
                          ? "bg-[#c5ff55] text-[#14170f]"
                          : "border border-white/10 bg-white/[0.03] text-white hover:border-[#c5ff55]/40 hover:bg-white/[0.06]"
                      }`}
                    >
                      {isSelected ? "Selected for practice" : "Select format"}
                      <ChevronRight
                        size={17}
                        className={isSelected ? "rotate-90" : ""}
                      />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>

          {selectedMatch && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex flex-col justify-between gap-4 rounded-xl border border-[#c5ff55]/25 bg-[#c5ff55]/[0.06] p-5 sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-semibold text-[#c5ff55]">
                  {matches.find((match) => match.id === selectedMatch)?.title}
                </p>
                <p className="mt-1 text-sm text-[#aab1a1]">
                  Format selected. Match execution will be available after the
                  challenge engine is connected.
                </p>
              </div>

              <button
                onClick={() => setSelectedMatch(null)}
                className="w-fit rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5"
              >
                Clear selection
              </button>
            </motion.div>
          )}
        </section>

        {/* Bottom banner */}
        <section className="mt-8 flex flex-col justify-between gap-5 rounded-xl border border-white/10 bg-[#181c16] p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c5ff55]">
              Before the battle
            </p>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">
              Build your fundamentals first.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#9da496]">
              Practise algorithms in the problem library while the live duel
              engine is being developed.
            </p>
          </div>

          <Link
            to="/problems"
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg bg-[#c5ff55] px-5 py-3 text-sm font-bold text-[#14170f] transition hover:bg-[#d5ff83]"
          >
            Open practice <ArrowUpRight size={16} />
          </Link>
        </section>

        <footer className="mt-6 flex flex-col justify-between gap-2 font-mono text-[10px] uppercase tracking-wider text-[#727a69] sm:flex-row">
          <span>KNIGHTZONE / ARENA</span>
          <span>Training interface · Match engine not connected</span>
        </footer>
      </div>
    </main>
  );
};

export default Arena;
