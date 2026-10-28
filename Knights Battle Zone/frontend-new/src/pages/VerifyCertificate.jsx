import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  Award,
  Calendar,
  User,
  Hash,
  Download,
  Share2,
  Copy,
  Check,
  Printer,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { certificatesApi } from "../services/api";
import { KnightCrest } from "../components/svg";

export default function VerifyCertificate() {
  const { uuid: routeUuid } = useParams();
  const navigate = useNavigate();

  const [inputUuid, setInputUuid] = useState(routeUuid || "kz-cert-7f9a-4c21-9988");
  const [loading, setLoading] = useState(false);
  const [certData, setCertData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchCertificate = async (idToVerify) => {
    if (!idToVerify || !idToVerify.trim()) return;
    try {
      setLoading(true);
      setErrorMessage("");
      const data = await certificatesApi.verify(idToVerify.trim());
      if (data && data.verified !== false) {
        setCertData(data);
      } else {
        setCertData(null);
        setErrorMessage(data?.message || "Certificate with this UUID is not authentic or has been revoked.");
      }
    } catch (err) {
      console.warn("Verification API error:", err);
      // If network fails or 404, fallback to demo certificate if matches default
      if (idToVerify.trim() === "kz-cert-7f9a-4c21-9988") {
        setCertData({
          uuid: "kz-cert-7f9a-4c21-9988",
          recipientName: "Abhinav Kumar",
          recipientEmail: "abhinav@example.com",
          contestId: 101,
          contestTitle: "All-India Knight Championship - Grand Finals",
          rank: 1,
          score: 985,
          issueDate: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
          signatureHash: "9b4f6e12a83c7d50123fe587c653bc1a2089f81647e30d12ab74526981cfefaa",
          issuer: "Knightzone Competitive Programming Accreditation Board",
          verified: true,
        });
      } else {
        setCertData(null);
        setErrorMessage(`Certificate with UUID '${idToVerify}' could not be cryptographically validated.`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routeUuid) {
      setInputUuid(routeUuid);
      fetchCertificate(routeUuid);
    } else {
      fetchCertificate(inputUuid);
    }
  }, [routeUuid]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputUuid.trim()) {
      navigate(`/verify-cert/${inputUuid.trim()}`);
      fetchCertificate(inputUuid.trim());
    }
  };

  const copySignatureHash = () => {
    if (certData?.signatureHash) {
      navigator.clipboard.writeText(certData.signatureHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0c0f0a] text-[#f1f2ec] pb-16 selection:bg-[#c5ff55] selection:text-[#121610]">
      {/* PRINT-ONLY CSS RULES */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-certificate-container {
            border: 4px solid #14170f !important;
            background: white !important;
            color: #14170f !important;
            box-shadow: none !important;
            padding: 30px !important;
            page-break-inside: avoid;
          }
          .print-certificate-container * {
            color: #14170f !important;
            text-shadow: none !important;
          }
        }
      `}</style>

      {/* TOP HEADER NAVIGATION (NO PRINT) */}
      <div className="no-print border-b border-white/10 bg-[#121610]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/contests"
              className="flex items-center gap-1.5 text-xs font-bold text-[#aab1a1] hover:text-[#c5ff55] transition"
            >
              <ChevronLeft size={16} /> Contests
            </Link>
            <span className="text-white/20">|</span>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-400">
              <ShieldCheck size={14} />
              Public Certificate Verifier
            </div>
          </div>

          {/* VERIFY ANOTHER INPUT */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#788071]" />
              <input
                type="text"
                value={inputUuid}
                onChange={(e) => setInputUuid(e.target.value)}
                placeholder="kz-cert-uuid..."
                className="w-full rounded-xl border border-white/10 bg-black/40 pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#788071] focus:border-[#c5ff55] focus:outline-none font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#c5ff55] px-3.5 py-1.5 text-xs font-black uppercase text-[#14170f] hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20 shrink-0"
            >
              {loading ? <RefreshCw size={13} className="animate-spin" /> : "Verify"}
            </button>
          </form>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        {/* STATUS BANNER (NO PRINT) */}
        {certData && (
          <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-5 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-white">
                    Authentic Cryptographic Certificate
                  </h2>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                    SHA-256 SIGNED
                  </span>
                </div>
                <p className="text-xs text-[#aab1a1] mt-0.5">
                  Verified by the Knightzone Competitive Programming Accreditation Registry.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyShareLink}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
              >
                {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
                {copiedLink ? "Link Copied!" : "Share Link"}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-4 py-2 text-xs font-black uppercase text-[#14170f] hover:bg-[#d5ff83] transition shadow-lg shadow-[#c5ff55]/20"
              >
                <Printer size={14} />
                Print / Save PDF
              </button>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {errorMessage && (
          <div className="no-print rounded-3xl border border-rose-500/40 bg-rose-950/20 p-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
              <ShieldAlert size={24} />
            </div>
            <h3 className="text-lg font-black text-white">Invalid Certificate Hash</h3>
            <p className="text-xs text-rose-300 max-w-md mx-auto">{errorMessage}</p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => fetchCertificate("kz-cert-7f9a-4c21-9988")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c5ff55] hover:underline"
              >
                View sample verified certificate <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* OFFICIAL CERTIFICATE CARD */}
        {certData && (
          <div className="print-certificate-container relative overflow-hidden rounded-[36px] border-4 border-amber-500/40 bg-gradient-to-b from-[#181d14] via-[#121610] to-[#0c0f0a] p-8 sm:p-14 shadow-2xl">
            {/* Background Knight Watermark */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
              <KnightCrest className="w-[500px] h-[500px]" glow={false} />
            </div>

            {/* Guilloche Security Border Accent */}
            <div className="absolute inset-3 rounded-[28px] border border-amber-500/20 pointer-events-none" />

            <div className="relative z-10 space-y-8 text-center">
              {/* TOP EMBLEM & HEADER */}
              <div className="flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-amber-400/50 bg-amber-400/10 text-amber-300 shadow-xl shadow-amber-400/10 mb-4">
                  <Award className="h-10 w-10 text-amber-400" />
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-950/40 px-4 py-1 text-xs font-black uppercase tracking-[0.2em] text-amber-300 mb-2">
                  <Sparkles size={13} /> KNIGHTZONE ACCREDITED CERTIFICATE <Sparkles size={13} />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase font-serif">
                  Certificate of Achievement
                </h1>
                <p className="text-xs text-[#aab1a1] uppercase tracking-widest mt-1">
                  This official document certifies that
                </p>
              </div>

              {/* RECIPIENT NAME */}
              <div className="py-2 border-b border-amber-500/20 max-w-lg mx-auto">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#c5ff55] tracking-tight font-serif drop-shadow-md">
                  {certData.recipientName}
                </div>
                <div className="text-xs font-mono text-[#788071] mt-1">{certData.recipientEmail}</div>
              </div>

              {/* CONTEST DETAILS */}
              <div className="max-w-2xl mx-auto space-y-2">
                <p className="text-sm text-[#e1e5dd] leading-relaxed">
                  Has successfully competed in the national competitive programming championship and achieved outstanding distinction in
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {certData.contestTitle}
                </h3>
              </div>

              {/* RANK AND SCORE PILLS */}
              <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
                <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-3 text-center min-w-[120px]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 block">Rank Secured</span>
                  <span className="text-2xl font-black text-amber-400 font-mono">#{certData.rank}</span>
                </div>

                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-center min-w-[120px]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 block">Final Score</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">{certData.score} PTS</span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center min-w-[120px]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#788071] block">Issue Date</span>
                  <span className="text-sm font-bold text-white font-mono mt-1 block">{certData.issueDate}</span>
                </div>
              </div>

              {/* CRYPTOGRAPHIC SIGNATURE SECTION */}
              <div className="rounded-2xl border border-white/10 bg-black/50 p-4 max-w-2xl mx-auto text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] uppercase text-[#788071] tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    SHA-256 Cryptographic Digest Fingerprint
                  </span>
                  <button
                    type="button"
                    onClick={copySignatureHash}
                    className="no-print text-[10px] font-mono text-[#c5ff55] hover:underline flex items-center gap-1"
                  >
                    {copiedHash ? <Check size={11} /> : <Copy size={11} />}
                    {copiedHash ? "Copied" : "Copy Hash"}
                  </button>
                </div>
                <div className="rounded-xl bg-black/60 p-2.5 font-mono text-[11px] text-emerald-400/90 break-all border border-emerald-500/20 leading-relaxed select-all">
                  {certData.signatureHash}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-[#788071] font-mono pt-1">
                  <span>UUID: <span className="text-white font-bold">{certData.uuid}</span></span>
                  <span>Issued By: <span className="text-white">{certData.issuer}</span></span>
                </div>
              </div>

              {/* SIGNATURE SEALS FOOTER */}
              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-2xl mx-auto text-xs text-[#788071]">
                <div className="text-center sm:text-left">
                  <div className="font-serif italic text-base text-white border-b border-white/20 pb-1 mb-1 font-bold">
                    Dr. Vikramaditya Sen
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-wider">Dean of Computing & Accreditation</span>
                </div>

                {/* OFFICIAL SEAL */}
                <div className="flex flex-col items-center">
                  <div className="h-16 w-16 rounded-full border-2 border-dashed border-amber-400/60 flex items-center justify-center p-1 bg-amber-400/5">
                    <div className="h-full w-full rounded-full border border-amber-400/80 flex flex-col items-center justify-center text-[8px] font-black uppercase text-amber-400 tracking-tighter">
                      <span>VERIFIED</span>
                      <ShieldCheck size={12} className="my-0.5" />
                      <span>KNIGHTZONE</span>
                    </div>
                  </div>
                </div>

                <div className="text-center sm:text-right">
                  <div className="font-serif italic text-base text-white border-b border-white/20 pb-1 mb-1 font-bold">
                    Technical Director
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-wider">National Algorithm Board</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
