import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Plus,
  Search,
  Edit3,
  Users,
  ArrowLeft,
  Check,
  Loader2,
  Calendar,
  Building2,
  MapPin,
  IndianRupee,
  CheckCircle2,
} from "lucide-react";
import { adminApi } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

export default function JobsWorkspace({
  jobs = [],
  onRefresh = () => {},
  showNotification = () => {},
}) {
  const { isNight } = useTheme();
  const [viewMode, setViewMode] = useState("list"); // "list" | "studio" | "applicants"
  const [editingJobId, setEditingJobId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);

  // Job Form State
  const [jobForm, setJobForm] = useState({
    title: "",
    companyName: "",
    location: "Bengaluru, India (Hybrid)",
    salaryRange: "₹18,00,000 - ₹26,00,000",
    jobType: "FULL_TIME",
    description: "Seeking high-caliber algorithmic problem solver with expertise in distributed systems.",
    eligibilityCriteria: "B.Tech CSE/IT/ECE with 7.0+ CGPA",
    deadline: "",
  });

  // Applicants Review State
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);
  const [applicantsList, setApplicantsList] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [updatingAppId, setUpdatingAppId] = useState(null);

  // Open Full-Page Studio
  const handleOpenStudio = (jobToEdit = null) => {
    if (jobToEdit) {
      setEditingJobId(jobToEdit.id);
      setJobForm({
        title: jobToEdit.title || "",
        companyName: jobToEdit.companyName || "",
        location: jobToEdit.location || "Bengaluru, India (Hybrid)",
        salaryRange: jobToEdit.salaryRange || "₹18,00,000 - ₹26,00,000",
        jobType: jobToEdit.jobType || "FULL_TIME",
        description: jobToEdit.description || "",
        eligibilityCriteria: jobToEdit.eligibilityCriteria || "B.Tech CSE/IT with 7.0+ CGPA",
        deadline: jobToEdit.deadline ? jobToEdit.deadline.slice(0, 16) : "",
      });
    } else {
      setEditingJobId(null);
      const inTwoWeeks = new Date(Date.now() + 14 * 86400000);
      setJobForm({
        title: "",
        companyName: "",
        location: "Bengaluru, India (Hybrid)",
        salaryRange: "₹18,00,000 - ₹26,00,000",
        jobType: "FULL_TIME",
        description: "Looking for competitive programmers and engineers for our core tech team.",
        eligibilityCriteria: "B.Tech CSE/IT/ECE with 7.0+ CGPA",
        deadline: inTwoWeeks.toISOString().slice(0, 16),
      });
    }
    setViewMode("studio");
  };

  // Save Job (Create or Update)
  const handleSaveJob = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!jobForm.title.trim() || !jobForm.companyName.trim()) {
      showNotification("Company name and job title are required", true);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: jobForm.title.trim(),
        companyName: jobForm.companyName.trim(),
        location: jobForm.location.trim(),
        salaryRange: jobForm.salaryRange.trim(),
        jobType: jobForm.jobType,
        description: jobForm.description.trim(),
        eligibilityCriteria: jobForm.eligibilityCriteria.trim(),
        deadline: jobForm.deadline ? new Date(jobForm.deadline).toISOString() : undefined,
      };

      if (editingJobId) {
        await adminApi.updateJob(editingJobId, payload);
        showNotification(`Career Drive #${editingJobId} updated!`);
      } else {
        await adminApi.createJob(payload);
        showNotification("Career drive published to campus board!");
      }

      setViewMode("list");
      setEditingJobId(null);
      onRefresh();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to save drive", true);
    } finally {
      setSaving(false);
    }
  };

  // Open Applicants Review
  const handleOpenApplicants = async (job) => {
    setSelectedJobForApplicants(job);
    setViewMode("applicants");
    setLoadingApplicants(true);
    try {
      const data = await adminApi.getJobApplications(job.id);
      setApplicantsList(Array.isArray(data) ? data : []);
    } catch (err) {
      setApplicantsList([]);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      setUpdatingAppId(appId);
      await adminApi.updateApplicationStatus(
        appId,
        newStatus,
        `Updated by Admin on ${new Date().toLocaleDateString()}`
      );
      showNotification(`Candidate application #${appId} updated to ${newStatus}.`);
      setApplicantsList((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
      );
    } catch {
      showNotification("Failed to update status", true);
    } finally {
      setUpdatingAppId(null);
    }
  };

  const filteredJobs = jobs.filter(
    (j) =>
      (j.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.companyName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // =========================================================================
  // VIEW 1: FULL-PAGE CAREER DRIVE STUDIO (CREATE & EDIT)
  // =========================================================================
  if (viewMode === "studio") {
    const isEditing = Boolean(editingJobId);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setViewMode("list");
                setEditingJobId(null);
              }}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-[#aab1a1] hover:bg-white/10 hover:text-white transition"
            >
              <ArrowLeft size={14} /> Back to Drives
            </button>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-[#788874]">
                Enterprise Studio / Placement & Careers Portal
              </div>
              <h2 className="text-xl font-black text-white">
                {isEditing ? `Edit Career Drive #${editingJobId}` : "Post New Placement Drive"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setViewMode("list");
                setEditingJobId(null);
              }}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-[#aab1a1] hover:text-white transition"
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={handleSaveJob}
              disabled={saving || !jobForm.title.trim() || !jobForm.companyName.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#c5ff55] px-6 py-2.5 text-xs font-black uppercase tracking-wider text-[#0c0f0a] shadow-lg shadow-[#c5ff55]/20 hover:bg-[#d5ff83] disabled:opacity-50 transition"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              {isEditing ? "Save Drive Changes" : "Publish Drive"}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#161a14] p-8 space-y-5 max-w-4xl mx-auto shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-1.5">
                Hiring Organization / Company Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Cloud Systems or Google DeepMind"
                value={jobForm.companyName}
                onChange={(e) => setJobForm({ ...jobForm, companyName: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs font-bold text-white focus:border-[#c5ff55] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-1.5">
                Job Role / Position Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Member of Technical Staff - Distributed Systems"
                value={jobForm.title}
                onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs font-bold text-white focus:border-[#c5ff55] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-1.5">Location</label>
              <input
                type="text"
                value={jobForm.location}
                onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs text-white focus:border-[#c5ff55] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-1.5">Compensation (CTC)</label>
              <input
                type="text"
                value={jobForm.salaryRange}
                onChange={(e) => setJobForm({ ...jobForm, salaryRange: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs font-mono font-bold text-[#c5ff55] focus:border-[#c5ff55] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-1.5">Employment Type</label>
              <select
                value={jobForm.jobType}
                onChange={(e) => setJobForm({ ...jobForm, jobType: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs font-bold text-white focus:border-[#c5ff55] focus:outline-none"
              >
                <option value="FULL_TIME" className="bg-[#161a14]">Full Time</option>
                <option value="INTERNSHIP" className="bg-[#161a14]">Internship</option>
                <option value="CONTRACT" className="bg-[#161a14]">Contract / Freelance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-1.5">
              Role Overview & Responsibilities
            </label>
            <textarea
              rows={6}
              value={jobForm.description}
              onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
              className="w-full rounded-2xl border border-white/15 bg-black/50 p-4 text-xs font-mono text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-1.5">
                Eligibility & Academic Criteria
              </label>
              <input
                type="text"
                placeholder="e.g. B.Tech CSE/IT with 7.5+ CGPA and DSA proficiency"
                value={jobForm.eligibilityCriteria}
                onChange={(e) => setJobForm({ ...jobForm, eligibilityCriteria: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs text-white focus:border-[#c5ff55] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#8f9d8a] mb-1.5">
                Application Deadline
              </label>
              <input
                type="datetime-local"
                value={jobForm.deadline}
                onChange={(e) => setJobForm({ ...jobForm, deadline: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs font-mono text-white focus:border-[#c5ff55] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: FULL-PAGE APPLICANTS REVIEWER
  // =========================================================================
  if (viewMode === "applicants" && selectedJobForApplicants) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setViewMode("list");
                setSelectedJobForApplicants(null);
              }}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-[#aab1a1] hover:text-white"
            >
              <ArrowLeft size={14} /> Back to Drives
            </button>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-[#788874]">
                Applicant Pipeline Review
              </div>
              <h2 className="text-xl font-black text-white">
                {selectedJobForApplicants.companyName} • {selectedJobForApplicants.title}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#161a14] overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 bg-black/40 font-bold uppercase tracking-wider text-[#788874]">
              <tr>
                <th className="p-4">App ID</th>
                <th className="p-4">Candidate</th>
                <th className="p-4">Email</th>
                <th className="p-4">College</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loadingApplicants ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#8f9d8a]">
                    <Loader2 size={24} className="mx-auto mb-2 animate-spin text-[#c5ff55]" />
                    Fetching candidate profiles...
                  </td>
                </tr>
              ) : applicantsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#8f9d8a]">
                    No candidates have applied to this drive yet.
                  </td>
                </tr>
              ) : (
                applicantsList.map((app) => (
                  <tr key={app.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-4 font-mono font-bold text-[#c5ff55]">#{app.id}</td>
                    <td className="p-4 font-bold text-white">{app.applicantName || "Anonymous Candidate"}</td>
                    <td className="p-4 text-[#aab1a1]">{app.applicantEmail}</td>
                    <td className="p-4 text-[#aab1a1]">{app.college || "Direct Applicant"}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                          app.status === "SELECTED"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : app.status === "REJECTED"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        {app.status || "APPLIED"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <select
                        value={app.status || "APPLIED"}
                        onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                        disabled={updatingAppId === app.id}
                        className="rounded-xl border border-white/15 bg-black/50 px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-[#c5ff55]"
                      >
                        <option value="APPLIED" className="bg-[#161a14]">APPLIED</option>
                        <option value="UNDER_REVIEW" className="bg-[#161a14]">UNDER REVIEW</option>
                        <option value="INTERVIEW_SCHEDULED" className="bg-[#161a14]">INTERVIEW SCHEDULED</option>
                        <option value="SELECTED" className="bg-[#161a14]">SELECTED</option>
                        <option value="REJECTED" className="bg-[#161a14]">REJECTED</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: FULL-PAGE CAREER DRIVES LIST
  // =========================================================================
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-black flex items-center gap-2.5 ${isNight ? "text-white" : "text-slate-900"}`}>
            <Briefcase size={22} className={isNight ? "text-[#c5ff55]" : "text-emerald-700"} /> Placement Drives & Careers Portal
          </h2>
          <p className={`text-xs mt-0.5 ${isNight ? "text-[#aab1a1]" : "text-slate-600"}`}>
            Manage hiring drives, technical job requirements, CTC offerings, and applicant candidate pipelines.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenStudio()}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#c5ff55] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#14170f] shadow-lg shadow-[#c5ff55]/20 hover:bg-[#d5ff83] transition"
        >
          <Plus size={16} /> Post Career Drive Studio
        </button>
      </div>

      {/* Search */}
      <div className={`relative rounded-2xl border p-3 shadow-sm ${
        isNight ? "border-white/10 bg-[#161a14]" : "border-slate-200 bg-white"
      }`}>
        <Search size={15} className={`absolute left-6 top-5 ${isNight ? "text-[#5a6b56]" : "text-slate-400"}`} />
        <input
          type="text"
          placeholder="Search drives by company or title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full rounded-xl border pl-10 pr-4 py-2 text-xs focus:outline-none transition ${
            isNight
              ? "border-white/10 bg-black/40 text-white placeholder-[#5a6b56] focus:border-[#c5ff55]"
              : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-emerald-600"
          }`}
        />
      </div>

      {/* Drives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredJobs.length === 0 ? (
          <div className={`col-span-full py-16 text-center text-xs rounded-3xl border ${
            isNight ? "border-white/10 bg-[#161a14] text-[#8f9d8a]" : "border-slate-200 bg-white text-slate-500"
          }`}>
            <Briefcase size={32} className={`mx-auto mb-2 ${isNight ? "text-[#5a6b56]" : "text-slate-400"}`} />
            No placement drives found.
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              className={`group flex flex-col justify-between rounded-3xl border p-6 transition shadow-xs hover:shadow-lg ${
                isNight
                  ? "border-white/10 bg-[#161a14] hover:border-[#c5ff55]/40 hover:shadow-[#c5ff55]/5"
                  : "border-slate-200 bg-white hover:border-emerald-500 hover:shadow-emerald-500/10"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-lg border ${
                    isNight
                      ? "text-[#c5ff55] bg-black/40 border-white/10"
                      : "text-emerald-800 bg-emerald-50 border-emerald-200"
                  }`}>
                    #{job.id}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold font-mono border ${
                    isNight
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-emerald-50 border-emerald-200 text-emerald-700"
                  }`}>
                    {job.salaryRange || "Competitive"}
                  </span>
                </div>

                <div className={`text-[11px] font-bold uppercase tracking-wider ${isNight ? "text-[#788874]" : "text-slate-500"}`}>
                  {job.companyName}
                </div>
                <h3 className={`text-base font-black mt-0.5 mb-2 transition ${
                  isNight ? "text-white group-hover:text-[#c5ff55]" : "text-slate-900 group-hover:text-emerald-700"
                }`}>{job.title}</h3>

                <p className={`text-xs line-clamp-2 leading-relaxed mb-4 ${isNight ? "text-[#aab1a1]" : "text-slate-600"}`}>
                  {job.description || "No description provided."}
                </p>

                <div className={`border-t pt-3 grid grid-cols-2 gap-2 text-[10px] ${
                  isNight ? "border-white/10 text-[#788874]" : "border-slate-100 text-slate-500"
                }`}>
                  <div>
                    <span className={`font-bold block ${isNight ? "text-[#8f9d8a]" : "text-slate-700"}`}>Location:</span>
                    {job.location || "Hybrid"}
                  </div>
                  <div>
                    <span className={`font-bold block ${isNight ? "text-[#8f9d8a]" : "text-slate-700"}`}>Eligibility:</span>
                    {job.eligibilityCriteria || "B.Tech"}
                  </div>
                </div>
              </div>

              <div className={`mt-5 pt-4 border-t flex items-center justify-between gap-2 ${
                isNight ? "border-white/10" : "border-slate-100"
              }`}>
                <button
                  type="button"
                  onClick={() => handleOpenStudio(job)}
                  className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                    isNight
                      ? "border-white/15 bg-white/5 text-white hover:border-[#c5ff55] hover:text-[#c5ff55]"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-600 hover:text-emerald-700"
                  }`}
                >
                  <Edit3 size={12} /> Edit Drive Studio
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenApplicants(job)}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    isNight
                      ? "bg-white/10 text-white hover:bg-white/20"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  <Users size={13} className={isNight ? "text-[#c5ff55]" : "text-emerald-600"} /> Review Candidates
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
