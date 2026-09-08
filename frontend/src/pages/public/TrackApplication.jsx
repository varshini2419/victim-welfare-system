import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import PublicNavbar from "../../components/public/PublicNavbar";
import PublicFooter from "../../components/public/PublicFooter";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const StatusBadge = ({ status }) => {
  const configs = {
    pending: {
      bg: "bg-amber-900/30",
      border: "border-amber-500/50",
      text: "text-amber-300",
      dot: "bg-amber-400",
      label: "PENDING REVIEW",
      icon: "?",
    },
    approved: {
      bg: "bg-green-900/30",
      border: "border-green-500/50",
      text: "text-green-300",
      dot: "bg-green-400",
      label: "APPROVED",
      icon: "?",
    },
    rejected: {
      bg: "bg-red-900/30",
      border: "border-red-500/50",
      text: "text-red-300",
      dot: "bg-red-400",
      label: "NOT APPROVED",
      icon: "?",
    },
  };
  const c = configs[status] || configs.pending;
  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border ${c.bg} ${c.border} ${c.text}`}
    >
      <span className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`}></span>
      {c.icon} {c.label}
    </span>
  );
};

const TrackApplication = () => {
  const [searchParams] = useSearchParams();
  const [inputId, setInputId] = useState(searchParams.get("registrationId") || "");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const preloaded = searchParams.get("registrationId");
    if (preloaded && preloaded.trim().length > 5) {
      doSearch(preloaded.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSearch = async (id) => {
    const searchId = (id || inputId).trim();
    if (!searchId) {
      setError("Please enter a Registration ID.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const { data } = await axios.get(
        `${API_BASE}/auth/registration-status/${encodeURIComponent(searchId)}`
      );
      setResult(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to retrieve registration status. Please check the ID and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "�";
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <PublicNavbar />
      <main className="flex-1 flex flex-col items-center px-4 py-16">
        <div className="text-center mb-12 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-500/30 text-blue-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 tracking-wider">
            AAROHAN VICTIM WELFARE SYSTEM
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
            Track Your Application
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Enter your Registration ID to view the current status of your application. The
            Registration ID was provided when you completed registration.
          </p>
        </div>

        {/* Search Card */}
        <div className="w-full max-w-xl bg-gray-900 border border-gray-700/60 rounded-2xl p-8 shadow-2xl mb-8">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            Registration ID
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              placeholder="ARH-REG-A7F93E1B8C245D60"
              className="flex-1 bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono placeholder-gray-600"
            />
            <button
              onClick={() => doSearch()}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? "Checking�" : "CHECK STATUS"}
            </button>
          </div>
          <p className="text-gray-600 text-xs mt-3">
            Example: <span className="font-mono text-gray-500">ARH-REG-A7F93E1B8C245D60</span>
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="w-full max-w-xl bg-red-900/20 border border-red-500/40 text-red-300 rounded-xl px-6 py-4 text-sm mb-6 flex items-start gap-3">
            <span className="text-red-400 text-lg mt-0.5">?</span>
            <span>{error}</span>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="w-full max-w-xl">
            {result.status === "pending" && (
              <div className="bg-amber-900/10 border border-amber-500/30 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white">Application Status</h2>
                  <StatusBadge status="pending" />
                </div>
                <div className="space-y-4 text-sm text-gray-300">
                  <div className="flex items-start gap-3 bg-gray-800/50 rounded-xl p-4">
                    <span className="text-amber-400 text-xl">?</span>
                    <div>
                      <p className="font-semibold text-white mb-1">Your application is under review</p>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        An administrator will review your registration and case details. Please check
                        back using this page.
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-800/40 rounded-lg px-4 py-3 font-mono text-xs text-gray-400 flex items-center justify-between">
                    <span>Registration ID</span>
                    <span className="text-white">{result.registrationId}</span>
                  </div>
                </div>
              </div>
            )}

            {result.status === "approved" && (
              <div className="bg-green-900/10 border border-green-500/30 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white">Application Status</h2>
                  <StatusBadge status="approved" />
                </div>
                <div className="space-y-4 text-sm text-gray-300">
                  <div className="flex items-start gap-3 bg-gray-800/50 rounded-xl p-4">
                    <span className="text-green-400 text-xl">?</span>
                    <div>
                      <p className="font-semibold text-white mb-1">
                        Your application has been approved
                      </p>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        A Case ID has been assigned. You can now log in to the Victim Portal.
                      </p>
                    </div>
                  </div>
                  {result.caseId && (
                    <div className="bg-gray-800/40 rounded-lg px-4 py-3 flex items-center justify-between">
                      <span className="text-xs text-gray-400">Case ID</span>
                      <span className="font-mono text-green-300 font-bold text-sm">{result.caseId}</span>
                    </div>
                  )}
                  {result.approvedAt && (
                    <div className="bg-gray-800/40 rounded-lg px-4 py-3 flex items-center justify-between">
                      <span className="text-xs text-gray-400">Approved On</span>
                      <span className="text-xs text-gray-300">{formatDate(result.approvedAt)}</span>
                    </div>
                  )}
                  <Link
                    to="/login"
                    className="block w-full text-center bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors mt-2"
                  >
                    GO TO VICTIM LOGIN ?
                  </Link>
                </div>
              </div>
            )}

            {result.status === "rejected" && (
              <div className="bg-red-900/10 border border-red-500/30 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white">Application Status</h2>
                  <StatusBadge status="rejected" />
                </div>
                <div className="space-y-4 text-sm text-gray-300">
                  <div className="flex items-start gap-3 bg-gray-800/50 rounded-xl p-4">
                    <span className="text-red-400 text-xl">?</span>
                    <div>
                      <p className="font-semibold text-white mb-1">
                        Your application was not approved
                      </p>
                      <p className="text-gray-400 text-xs leading-relaxed">
                        We regret to inform you that your registration was not approved. The reason
                        provided by the administrator is shown below.
                      </p>
                    </div>
                  </div>
                  {result.rejectionReason && (
                    <div className="bg-red-900/20 border border-red-500/20 rounded-lg px-4 py-3">
                      <p className="text-xs text-red-400 font-semibold mb-1 uppercase tracking-wider">
                        Reason
                      </p>
                      <p className="text-sm text-gray-300">{result.rejectionReason}</p>
                    </div>
                  )}
                  {result.reviewedAt && (
                    <div className="bg-gray-800/40 rounded-lg px-4 py-3 flex items-center justify-between">
                      <span className="text-xs text-gray-400">Reviewed On</span>
                      <span className="text-xs text-gray-300">{formatDate(result.reviewedAt)}</span>
                    </div>
                  )}
                  {(result.supportContact?.name || result.supportContact?.phone || result.supportContact?.email) && (
                    <div className="bg-gray-800/40 rounded-lg px-4 py-3 text-xs text-gray-300">
                      <p className="text-red-400 font-semibold mb-1 uppercase tracking-wider">Support Contact</p>
                      {result.supportContact.name && <p>{result.supportContact.name}</p>}
                      {result.supportContact.phone && <p>{result.supportContact.phone}</p>}
                      {result.supportContact.email && <p>{result.supportContact.email}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 text-center max-w-md">
          <p className="text-gray-600 text-xs leading-relaxed">
            Your Registration ID was displayed on the confirmation page after submitting your
            registration. If you have lost it, please contact the Victim Welfare helpline.
          </p>
          <Link
            to="/register/victim"
            className="inline-block mt-4 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
          >
            Submit a new registration ?
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export default TrackApplication;
