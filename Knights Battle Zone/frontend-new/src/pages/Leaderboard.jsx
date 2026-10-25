
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Trophy,
  Medal,
  Crown,
  Search,
  ArrowUpRight,
  TrendingUp,
  Minus,
  ChevronDown,
  Users,
} from "lucide-react";

const players = [
  {
    id: 1,
    name: "ShadowKnight",
    handle: "@shadowknight",
    rating: 2348,
    solved: 342,
    wins: 28,
    change: 3,
  },
  {
    id: 2,
    name: "CodePhantom",
    handle: "@codephantom",
    rating: 2196,
    solved: 298,
    wins: 24,
    change: 1,
  },
  {
    id: 3,
    name: "ByteWarrior",
    handle: "@bytewarrior",
    rating: 2084,
    solved: 267,
    wins: 21,
    change: -1,
  },
  {
    id: 4,
    name: "Anamika",
    handle: "@anamika",
    rating: 1482,
    solved: 127,
    wins: 12,
    change: 2,
  },
  {
    id: 5,
    name: "LogicRider",
    handle: "@logicrider",
    rating: 1420,
    solved: 118,
    wins: 10,
    change: 0,
  },
  {
    id: 6,
    name: "PixelCoder",
    handle: "@pixelcoder",
    rating: 1368,
    solved: 105,
    wins: 8,
    change: -2,
  },
  {
    id: 7,
    name: "StackMaster",
    handle: "@stackmaster",
    rating: 1295,
    solved: 96,
    wins: 7,
    change: 1,
  },
  {
    id: 8,
    name: "LoopLegend",
    handle: "@looplegend",
    rating: 1210,
    solved: 84,
    wins: 5,
    change: 0,
  },
];

const podiumStyles = {
  1: {
    panel: "border-[#d7b45f]/40 bg-[#d7b45f]/[0.09]",
    medal: "bg-[#d7b45f] text-[#292416]",
    label: "CHAMPION",
  },
  2: {
    panel: "border-[#b8c0c7]/25 bg-white/[0.035]",
    medal: "bg-[#c4cbd1] text-[#22272c]",
    label: "RUNNER-UP",
  },
  3: {
    panel: "border-[#b77c53]/25 bg-[#b77c53]/[0.06]",
    medal: "bg-[#b77c53] text-[#21160f]",
    label: "THIRD PLACE",
  },
};

const Leaderboard = () => {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("All time");
  const [sortBy, setSortBy] = useState("Rating");

  const sortedPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...players]
      .filter(
        (player) =>
          player.name.toLowerCase().includes(query) ||
          player.handle.toLowerCase().includes(query)
      )
      .sort((a, b) => {
        if (sortBy === "Problems solved") return b.solved - a.solved;
        if (sortBy === "Contest wins") return b.wins - a.wins;
        return b.rating - a.rating;
      });
  }, [search, sortBy]);

  const podiumPlayers = [players[1], players[0], players[2]];

  const currentRank = players.findIndex((player) => player.name === "Anamika") + 1;
  const currentPlayer = players.find((player) => player.name === "Anamika");

  return (
    <main className="min-h-screen bg-[#11120f] px-4 pb-12 pt-8 text-[#f0f0e9] sm:px-7 lg:px-10 lg:pt-10">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end"
        >
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#d7b45f]">
              <Trophy size={15} />
              Knightzone rankings
            </div>

            <h1 className="mt-4 text-4xl font-bold tracking-[-0.06em] sm:text-5xl lg:text-6xl">
              The standings<span className="text-[#d7b45f]">.</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#a0a198]">
              Every solved problem builds your skills. Every competition is
              another chance to climb the board.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#d7b45f]/10 text-[#d7b45f]">
              <Medal size={22} />
            </div>
            <div>
              <p className="text-xs text-[#96978d]">Your demo position</p>
              <p className="mt-1 text-xl font-bold">
                #{currentRank}
                <span className="ml-2 text-xs font-normal text-[#96978d]">
                  of {players.length} players
                </span>
              </p>
            </div>
          </div>
        </motion.header>

        {/* Snapshot stats */}
        <section className="grid grid-cols-2 border-b border-white/10 sm:grid-cols-4">
          {[
            {
              label: "Players listed",
              value: String(players.length).padStart(2, "0"),
              icon: Users,
            },
            {
              label: "Highest rating",
              value: String(Math.max(...players.map((p) => p.rating))),
              icon: Crown,
            },
            {
              label: "Problems solved",
              value: String(
                players.reduce((sum, player) => sum + player.solved, 0)
              ),
              icon: TrendingUp,
            },
            {
              label: "Top player",
              value: "ShadowKnight",
              icon: Medal,
            },
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
                <div className="flex items-center gap-2 text-[#898b80]">
                  <Icon size={15} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] sm:text-xs">
                    {item.label}
                  </span>
                </div>
                <p
                  className={`mt-3 truncate text-xl font-bold tracking-tight sm:text-2xl ${
                    item.label === "Top player" ? "text-[#d7b45f]" : ""
                  }`}
                >
                  {item.value}
                </p>
              </div>
            );
          })}
        </section>

        {/* Podium */}
        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d7b45f]">
                The podium
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Leading players
              </h2>
            </div>
            <span className="hidden font-mono text-[10px] uppercase tracking-widest text-[#797b71] sm:block">
              Current sample rankings
            </span>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {podiumPlayers.map((player, index) => {
              const rank = player.id;
              const style = podiumStyles[rank];
              const isFirst = rank === 1;

              return (
                <motion.article
                  key={player.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className={`relative flex min-w-0 flex-col rounded-xl border p-5 sm:p-6 ${
                    style.panel
                  } ${isFirst ? "md:-translate-y-2" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-semibold tracking-[0.17em] text-[#a0a198]">
                      {style.label}
                    </span>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${style.medal}`}
                    >
                      {rank === 1 ? (
                        <Crown size={16} />
                      ) : (
                        <Medal size={16} />
                      )}
                    </span>
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold ${
                        isFirst
                          ? "bg-[#d7b45f]/15 text-[#d7b45f]"
                          : "bg-white/[0.06] text-[#d8d9d1]"
                      }`}
                    >
                      {player.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold">
                        {player.name}
                      </h3>
                      <p className="mt-1 truncate text-xs text-[#929389]">
                        {player.handle}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#898b80]">
                        Rating
                      </p>
                      <p
                        className={`mt-1 text-3xl font-bold tracking-tight ${
                          isFirst ? "text-[#d7b45f]" : ""
                        }`}
                      >
                        {player.rating.toLocaleString("en-US")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-[#898b80]">
                        Solved
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {player.solved}
                      </p>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        {/* Full table */}
        <section className="mt-10 overflow-hidden rounded-xl border border-white/10 bg-[#181a16]">
          <div className="flex flex-col gap-4 border-b border-white/10 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                Player rankings
              </h2>
              <p className="mt-1 text-xs text-[#929389]">
                {sortedPlayers.length} players shown · illustrative data
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 sm:w-56">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8e83]"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Find a player"
                  className="w-full rounded-lg border border-white/10 bg-[#11120f] py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-[#73766c] focus:border-[#d7b45f]/60"
                />
              </div>

              <label className="relative">
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="w-full appearance-none rounded-lg border border-white/10 bg-[#11120f] py-2.5 pl-3 pr-9 text-sm outline-none focus:border-[#d7b45f]/60 sm:w-auto"
                >
                  <option>Rating</option>
                  <option>Problems solved</option>
                  <option>Contest wins</option>
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#929389]"
                />
              </label>

              <label className="relative">
                <select
                  value={period}
                  onChange={(event) => setPeriod(event.target.value)}
                  className="w-full appearance-none rounded-lg border border-white/10 bg-[#11120f] py-2.5 pl-3 pr-9 text-sm outline-none focus:border-[#d7b45f]/60 sm:w-auto"
                >
                  <option>All time</option>
                  <option>This month</option>
                  <option>This week</option>
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#929389]"
                />
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-white/[0.025] text-[10px] font-semibold uppercase tracking-[0.14em] text-[#85877d]">
                <tr>
                  <th className="px-5 py-4">Rank</th>
                  <th className="px-4 py-4">Player</th>
                  <th className="px-4 py-4 text-right">Rating</th>
                  <th className="px-4 py-4 text-right">Solved</th>
                  <th className="px-4 py-4 text-right">Wins</th>
                  <th className="px-5 py-4 text-right">Movement</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.06]">
                {sortedPlayers.map((player, index) => {
                  const isCurrentPlayer = player.name === "Anamika";
                  const originalRank =
                    players.findIndex((item) => item.id === player.id) + 1;

                  return (
                    <tr
                      key={player.id}
                      className={`transition hover:bg-white/[0.035] ${
                        isCurrentPlayer ? "bg-[#d7b45f]/[0.055]" : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <span
                          className={`font-mono text-sm font-semibold ${
                            originalRank <= 3
                              ? "text-[#d7b45f]"
                              : "text-[#a0a198]"
                          }`}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                              isCurrentPlayer
                                ? "bg-[#d7b45f]/15 text-[#d7b45f]"
                                : "bg-white/[0.06] text-[#c7c9c0]"
                            }`}
                          >
                            {player.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p
                              className={`text-sm font-semibold ${
                                isCurrentPlayer ? "text-[#e7ca7e]" : ""
                              }`}
                            >
                              {player.name}
                              {isCurrentPlayer && (
                                <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-[#d7b45f]">
                                  You · demo
                                </span>
                              )}
                            </p>
                            <p className="mt-1 text-xs text-[#85877d]">
                              {player.handle}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right font-mono text-sm font-semibold">
                        {player.rating.toLocaleString("en-US")}
                      </td>

                      <td className="px-4 py-4 text-right text-sm text-[#b6b8ae]">
                        {player.solved}
                      </td>

                      <td className="px-4 py-4 text-right text-sm text-[#b6b8ae]">
                        {player.wins}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <span
                          className={`inline-flex items-center justify-end gap-1 text-xs font-semibold ${
                            player.change > 0
                              ? "text-emerald-400"
                              : player.change < 0
                              ? "text-rose-400"
                              : "text-[#85877d]"
                          }`}
                        >
                          {player.change > 0 ? (
                            <TrendingUp size={14} />
                          ) : player.change < 0 ? (
                            <ArrowUpRight
                              size={14}
                              className="rotate-90"
                            />
                          ) : (
                            <Minus size={14} />
                          )}
                          {player.change > 0
                            ? `+${player.change}`
                            : player.change}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sortedPlayers.length === 0 && (
            <div className="px-5 py-12 text-center">
              <Search className="mx-auto text-[#85877d]" size={25} />
              <p className="mt-3 font-semibold">No players found</p>
              <p className="mt-1 text-sm text-[#929389]">
                Try searching with another name.
              </p>
            </div>
          )}

          <div className="border-t border-white/10 bg-white/[0.02] px-5 py-3 text-xs leading-5 text-[#85877d]">
            Demo leaderboard. Period selection is a visual control only; actual
            historical filtering and player rankings require backend data.
          </div>
        </section>

        {/* Personal progress */}
        <section className="mt-6 flex flex-col justify-between gap-5 rounded-xl border border-[#d7b45f]/20 bg-[#d7b45f]/[0.055] p-5 sm:flex-row sm:items-center sm:p-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d7b45f]">
              Your next move
            </p>
            <h2 className="mt-2 text-xl font-bold">
              Improve your rating one problem at a time.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#a0a198]">
              Practise consistently and prepare for future rated competitions.
            </p>
          </div>

          <Link
            to="/problems"
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg bg-[#d7b45f] px-5 py-3 text-sm font-bold text-[#292416] transition hover:bg-[#e8cb7f]"
          >
            Practise now <ArrowUpRight size={16} />
          </Link>
        </section>

        <footer className="mt-6 flex flex-col justify-between gap-2 font-mono text-[10px] uppercase tracking-wider text-[#72746b] sm:flex-row">
          <span>KNIGHTZONE / RANKINGS</span>
          <span>Sample players · Not live standings</span>
        </footer>
      </div>
    </main>
  );
};

export default Leaderboard;
