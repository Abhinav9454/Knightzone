import { useState, useEffect } from "react";
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Send,
  FileText,
  AlertCircle,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { jobsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { KnightCrest, TrophyIllustration } from "../components/svg";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState("openings"); // "openings" | "applications"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Application Modal state
  const [selectedJob, setSelectedJob] = useState(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    loadJobsData();
  }, []);

  const loadJobsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const jobsData = await jobsApi.getAll();
      setJobs(Array.isArray(jobsData) ? jobsData : []);

      if (isAuthenticated) {
        try {
          const appsData = await jobsApi.getMyApplications();
          setApplications(Array.isArray(appsData) ? appsData : []);
        } catch (appErr) {
          console.warn("My applications error:", appErr);
        }
      }
    } catch (err) {
      console.error("Failed to load jobs:", err);
      setError("Failed to load placement opportunities. Please login or check connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApplyModal = (job) => {
    if (!isAuthenticated) {
      alert("Please login to apply for career openings.");
      return;
    }
    setSelectedJob(job);
    setApplySuccess(false);
    setResumeUrl(user?.portfolioUrl || user?.githubUrl || "");
    setCoverLetter("");
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    try {
      setSubmitting(true);
      await jobsApi.apply(selectedJob.id, {
        resumeUrl: resumeUrl.trim(),
        coverLetter: coverLetter.trim(),
      });

      setApplySuccess(true);
      setTimeout(() => {
        setSelectedJob(null);
        setApplySuccess(false);
        loadJobsData();
      }, 1800);
    } catch (err) {
      console.error("Apply failed:", err);
      alert(err.response?.data?.message || "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    const q = searchQuery.toLowerCase();
    return (
      j.title?.toLowerCase().includes(q) ||
      j.companyName?.toLowerCase().includes(q) ||
      j.location?.toLowerCase().includes(q) ||
      j.description?.toLowerCase().includes(q)
    );
  });

  const isApplied = (jobId) =>
    applications.some((app) => app.jobId === jobId);

  return (
    <div className="min-h-screen bg-[#fbfcf9] text-[#252922] pb-16">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden border-b border-[#e4e5df] bg-gradient-to-b from-[#183d34]/5 via-transparent to-transparent py-10 px-6 sm:px-10">
        <div className="absolute -right-12 -top-12 opacity-10 pointer-events-none">
          <KnightCrest className="w-80 h-80" />
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#183d34]/20 bg-[#183d34]/10 px-3 py-1 text-xs font-bold text-[#183d34] mb-3">
                <Briefcase size={14} className="text-[#183d34]" />
                Campus Placement & Careers
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#183d34]">
                Career Opportunities & Drives
              </h1>
              <p className="mt-2 text-sm text-[#555d53] max-w-xl">
                Direct hiring pipelines, internships, and full-time engineering roles
                from partner tech companies looking for top problem solvers.
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-4 rounded-2xl border border-[#dfe4de] bg-white p-4 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#183d34] text-[#c5ff55]">
                <Building2 size={24} />
              </div>
              <div>
                <p className="text-2xl font-black text-[#183d34]">
                  {jobs.length}
                </p>
                <p className="text-xs font-semibold text-[#8b948a] uppercase tracking-wider">
                  Open Roles
                </p>
              </div>
              {isAuthenticated && applications.length > 0 && (
                <div className="border-l border-slate-200 pl-4 ml-2">
                  <p className="text-2xl font-black text-emerald-600">
                    {applications.length}
                  </p>
                  <p className="text-xs font-semibold text-[#8b948a] uppercase tracking-wider">
                    My Apps
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* TABS & SEARCH */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-[#f0f2ed] p-1 rounded-xl w-full sm:w-auto">
              <button
                onClick={() => setActiveTab("openings")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === "openings"
                    ? "bg-white text-[#183d34] shadow-sm"
                    : "text-[#555d53] hover:text-[#252922]"
                }`}
              >
                All Openings ({jobs.length})
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => setActiveTab("applications")}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition ${
                    activeTab === "applications"
                      ? "bg-white text-[#183d34] shadow-sm"
                      : "text-[#555d53] hover:text-[#252922]"
                  }`}
                >
                  My Applications ({applications.length})
                </button>
              )}
            </div>

            {activeTab === "openings" && (
              <div className="relative w-full sm:w-80">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b948a]"
                />
                <input
                  type="text"
                  placeholder="Search by role, company, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-[#dfe4de] bg-white focus:outline-none focus:ring-2 focus:ring-[#183d34]"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT LIST */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#183d34] border-t-transparent" />
            <p className="text-sm font-semibold text-[#8b948a]">
              Loading verified opportunities...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm font-bold text-red-800">{error}</p>
            <button
              onClick={loadJobsData}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        ) : activeTab === "openings" ? (
          filteredJobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#dfe4de] bg-white p-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-[#8b948a] mb-3" />
              <h3 className="text-base font-bold text-[#252922]">No Openings Found</h3>
              <p className="text-xs text-[#555d53] mt-1">
                {searchQuery
                  ? "Try adjusting your search criteria."
                  : "New hiring drives will be published soon by partner recruiters."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredJobs.map((job) => {
                const applied = isApplied(job.id);

                return (
                  <div
                    key={job.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-[#dfe4de] bg-white p-6 shadow-sm transition hover:shadow-md hover:border-[#183d34]/40"
                  >
                    <div>
                      {/* Company & Location Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#183d34] bg-[#183d34]/10 px-2.5 py-1 rounded-md">
                          <Building2 size={12} />
                          {job.companyName || "Tech Enterprise"}
                        </span>

                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8b948a]">
                          <MapPin size={12} />
                          {job.location || "Remote / On-site"}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-[#183d34] group-hover:text-emerald-700 transition">
                        {job.title}
                      </h3>

                      {job.salary && (
                        <p className="mt-1 text-xs font-black text-emerald-700">
                          CTC / Compensation: {job.salary}
                        </p>
                      )}

                      <p className="mt-3 text-xs text-[#555d53] line-clamp-3 leading-relaxed">
                        {job.description ||
                          "Seeking ambitious problem solvers with strong foundations in data structures, algorithms, and modular design."}
                      </p>

                      {job.eligibilityCriteria && (
                        <div className="mt-3 rounded-xl bg-[#f0f2ed] p-2.5 text-[11px] text-[#555d53]">
                          <span className="font-bold text-[#183d34]">
                            Eligibility:{" "}
                          </span>
                          {job.eligibilityCriteria}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-6 pt-4 border-t border-[#f0f2ed] flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-[#8b948a]">
                        <Clock size={13} />
                        <span>
                          {job.deadline
                            ? `Deadline: ${new Date(job.deadline).toLocaleDateString()}`
                            : "Actively Hiring"}
                        </span>
                      </div>

                      {applied ? (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-bold text-emerald-800">
                          <CheckCircle2 size={14} />
                          Applied
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenApplyModal(job)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#183d34] px-4 py-2 text-xs font-bold text-[#c5ff55] hover:bg-[#122e27] transition shadow-sm"
                        >
                          Apply Now
                          <ArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* MY APPLICATIONS TAB */
          applications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#dfe4de] bg-white p-12 text-center">
              <TrophyIllustration className="mx-auto h-20 w-20 mb-3" />
              <h3 className="text-base font-bold text-[#252922]">
                No Applications Submitted Yet
              </h3>
              <p className="text-xs text-[#555d53] mt-1 mb-4">
                Explore verified job postings and apply directly with your Knight profile.
              </p>
              <button
                onClick={() => setActiveTab("openings")}
                className="px-4 py-2 text-xs font-bold text-[#c5ff55] bg-[#183d34] rounded-xl"
              >
                Browse Openings
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const job = jobs.find((j) => j.id === app.jobId);

                return (
                  <div
                    key={app.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#dfe4de] bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#183d34] text-[#c5ff55] font-black text-sm">
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#183d34]">
                          {job?.title || `Position #${app.jobId}`}
                        </h4>
                        <p className="text-xs font-semibold text-[#8b948a] mt-0.5">
                          {job?.companyName || "Hiring Partner"} • Applied on{" "}
                          {app.appliedDate
                            ? new Date(app.appliedDate).toLocaleDateString()
                            : "Recently"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                          app.status === "SELECTED"
                            ? "bg-emerald-100 text-emerald-800"
                            : app.status === "SHORTLISTED"
                            ? "bg-purple-100 text-purple-800"
                            : app.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {app.status || "APPLIED"}
                      </span>

                      {app.comments && (
                        <p className="text-xs text-[#555d53] italic">
                          &quot;{app.comments}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* APPLY MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-[#dfe4de] bg-white p-6 sm:p-8 shadow-xl">
            {applySuccess ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600 mb-3 animate-bounce" />
                <h3 className="text-xl font-black text-[#183d34]">
                  Application Sent!
                </h3>
                <p className="text-xs text-[#555d53] mt-1">
                  Your profile and application have been submitted to{" "}
                  <span className="font-bold text-[#183d34]">
                    {selectedJob.companyName}
                  </span>
                  . Good luck!
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b948a]">
                      Applying for
                    </span>
                    <h3 className="text-lg font-black text-[#183d34]">
                      {selectedJob.title}
                    </h3>
                    <p className="text-xs font-semibold text-[#555d53]">
                      {selectedJob.companyName}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmitApplication} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#252922] mb-1">
                      Resume / Portfolio Link *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://drive.google.com/... or https://github.com/..."
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                      className="w-full rounded-xl border border-[#dfe4de] px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#183d34]"
                    />
                    <p className="text-[10px] text-[#8b948a] mt-1">
                      Google Drive, GitHub portfolio, or hosted PDF URL.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#252922] mb-1">
                      Cover Note to Hiring Manager
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Explain why you are a great match for this role and mention your competitive coding achievements..."
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      className="w-full rounded-xl border border-[#dfe4de] px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#183d34]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setSelectedJob(null)}
                      className="rounded-xl border border-[#dfe4de] px-4 py-2 text-xs font-bold text-[#555d53] hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !resumeUrl.trim()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#183d34] px-5 py-2 text-xs font-bold text-[#c5ff55] hover:bg-[#122e27] disabled:opacity-50"
                    >
                      <Send size={13} />
                      {submitting ? "Submitting..." : "Submit Application"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
