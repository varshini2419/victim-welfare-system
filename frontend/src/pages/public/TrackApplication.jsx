import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import PublicNavbar from "../../components/public/PublicNavbar";
import PublicFooter from "../../components/public/PublicFooter";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const StatusBadge = ({ status }) => {
  const configs = {
    pending: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      dot: "bg-amber-500",
      label: "PENDING REVIEW",
      icon: "⏳",
    },
    approved: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
      label: "APPROVED",
      icon: "✓",
    },
    rejected: {
      bg: "bg-rose-50",
      border: "border-rose-200",
      text: "text-rose-700",
      dot: "bg-rose-500",
      label: "NOT APPROVED",
      icon: "!",
    },
  };
  const c = configs[status] || configs.pending;

  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border ${c.bg} ${c.border} ${c.text}`}
    >
      <span className={`w-2 h-2 rounded-full ${c.dot}`}></span>
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
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col">
      <PublicNavbar />

      <main className="flex-1 px-4 py-10 md:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 mb-3">
              AAROHAN VICTIM WELFARE SYSTEM
            </p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
              Track Your Application
            </h1>
            <p className="max-w-3xl text-base md:text-lg text-slate-600 leading-relaxed">
              Enter your registration ID to view the current status of your application.
              Your ID was provided when you completed registration.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr] items-start">
            <section className="bg-white rounded-3xl border border-slate-200 shadow-[0_12px_32px_rgba(15,23,42,0.06)] p-6 md:p-8">
              <label className="block text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">
                Registration ID
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    🔎
                  </span>
                  <input
                    type="text"
                    value={inputId}
                    onChange={(e) => setInputId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && doSearch()}
                    placeholder="ARH-REG-A7F93E1B8C245D60"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-base rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 font-mono placeholder:text-slate-400"
                  />
                </div>

                <button
                  onClick={() => doSearch()}
                  disabled={loading}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loading ? "Checking..." : "CHECK STATUS"}
                </button>
              </div>

              <p className="mt-3 text-sm text-slate-500">
                Example: <span className="font-mono text-slate-700">ARH-REG-A7F93E1B8C245D60</span>
              </p>

              {error && (
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm flex items-start gap-3">
                  <span className="text-base">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {result && (
                <div className="mt-6">
                  {result.status === "pending" && (
                    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
                        <h2 className="text-xl font-bold text-slate-900">Application Status</h2>
                        <StatusBadge status="pending" />
                      </div>

                      <div className="bg-white/70 border border-amber-100 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">⏳</div>
                          <div>
                            <p className="font-semibold text-slate-900 mb-1">Your application is under review</p>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              A support officer will review your registration details and update the status here.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm flex items-center justify-between gap-3">
                        <span className="text-slate-500">Registration ID</span>
                        <span className="font-mono text-slate-800 font-semibold">{result.registrationId}</span>
                      </div>
                    </div>
                  )}

                  {result.status === "approved" && (
                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
                        <h2 className="text-xl font-bold text-slate-900">Application Status</h2>
                        <StatusBadge status="approved" />
                      </div>

                      <div className="bg-white/70 border border-emerald-100 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">✅</div>
                          <div>
                            <p className="font-semibold text-slate-900 mb-1">Your application has been approved</p>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              A Case ID has been assigned and your access is ready for login.
                            </p>
                          </div>
                        </div>
                      </div>

                      {result.caseId && (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm flex items-center justify-between gap-3">
                          <span className="text-slate-500">Case ID</span>
                          <span className="font-mono text-emerald-700 font-bold">{result.caseId}</span>
                        </div>
                      )}

                      {result.approvedAt && (
                        <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm flex items-center justify-between gap-3">
                          <span className="text-slate-500">Approved On</span>
                          <span className="text-slate-700">{formatDate(result.approvedAt)}</span>
                        </div>
                      )}

                      <Link
                        to="/login"
                        className="mt-5 block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl transition-colors"
                      >
                        GO TO LOGIN
                      </Link>
                    </div>
                  )}

                  {result.status === "rejected" && (
                    <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
                      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
                        <h2 className="text-xl font-bold text-slate-900">Application Status</h2>
                        <StatusBadge status="rejected" />
                      </div>

                      <div className="bg-white/70 border border-rose-100 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">⚠️</div>
                          <div>
                            <p className="font-semibold text-slate-900 mb-1">Your application was not approved</p>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              The reviewing team has provided the following reason for the decision.
                            </p>
                          </div>
                        </div>
                      </div>

                      {result.rejectionReason && (
                        <div className="mt-4 rounded-2xl border border-rose-200 bg-white px-4 py-3">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-600 mb-2">Reason</p>
                          <p className="text-sm text-slate-700">{result.rejectionReason}</p>
                        </div>
                      )}

                      {result.reviewedAt && (
                        <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm flex items-center justify-between gap-3">
                          <span className="text-slate-500">Reviewed On</span>
                          <span className="text-slate-700">{formatDate(result.reviewedAt)}</span>
                        </div>
                      )}

                      {(result.supportContact?.name || result.supportContact?.phone || result.supportContact?.email) && (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">Support Contact</p>
                          {result.supportContact.name && <p>{result.supportContact.name}</p>}
                          {result.supportContact.phone && <p>{result.supportContact.phone}</p>}
                          {result.supportContact.email && <p>{result.supportContact.email}</p>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_12px_32px_rgba(15,23,42,0.05)] p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Need help?</h3>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex gap-3 items-start">
                    <span className="text-blue-700">•</span>
                    <span>Use the exact registration ID from your confirmation message.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="text-blue-700">•</span>
                    <span>Applications are usually reviewed within a short verification window.</span>
                  </li>
                  <li className="flex gap-3 items-start">
                    <span className="text-blue-700">•</span>
                    <span>If you lost the ID, contact the welfare support helpline.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-[0_18px_36px_rgba(15,23,42,0.18)]">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300 mb-2">Need to reapply?</p>
                <p className="text-sm text-slate-200 leading-relaxed mb-5">
                  Your registration ID was shown after successful submission. If you need to apply again,
                  please start a fresh registration.
                </p>
                <Link
                  to="/register/victim"
                  className="inline-flex items-center justify-center w-full bg-white text-slate-900 font-bold py-3 rounded-2xl hover:bg-slate-100 transition-colors"
                >
                  Submit a new registration
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default TrackApplication;
