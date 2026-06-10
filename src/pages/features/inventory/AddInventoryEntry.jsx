import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { usePermissions } from "../../../hooks/usePermissions";
import {
  getInventoryColumns,
  getMaterialProfiles,
  addInventoryEntry,
  submitEntryForApproval,
} from "../../../services/inventoryService";
import { ChevronRight, ChevronLeft, Check, Package, X, Plus } from "lucide-react";
import toast from "react-hot-toast";

// ─── Step indicator at top ────────────────────────────────────────────────────
function StepDots({ total, current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`transition-all duration-300 rounded-full ${
            i < current
              ? "w-6 h-2 bg-blue-500"
              : i === current
              ? "w-8 h-2 bg-blue-600"
              : "w-2 h-2 bg-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Individual step card ─────────────────────────────────────────────────────
function StepCard({ column, value, onChange, materialProfiles }) {
  const isMaterial =
    column.name?.toLowerCase().includes("material") ||
    column.name?.toLowerCase().includes("supplier") ||
    column.dataType === "profile";

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
        {column.name}
        {column.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {column.dataType === "date" ? (
        <input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-lg font-medium focus:border-blue-500 focus:outline-none transition-colors"
        />
      ) : column.dataType === "numeric" ? (
        <div className="relative">
          <input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${column.name}`}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-lg font-medium focus:border-blue-500 focus:outline-none transition-colors"
          />
          {column.unit && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
              {column.unit}
            </span>
          )}
        </div>
      ) : isMaterial && materialProfiles?.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {materialProfiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => onChange(profile.name)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                value === profile.name
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300 text-gray-700"
              }`}
            >
              <Package className="w-5 h-5 mb-1 opacity-60" />
              <div className="font-medium text-sm">{profile.name}</div>
              {profile.unit && (
                <div className="text-xs text-gray-400">{profile.unit}</div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${column.name}`}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-lg font-medium focus:border-blue-500 focus:outline-none transition-colors"
        />
      )}

      {column.description && (
        <p className="text-sm text-gray-400">{column.description}</p>
      )}
    </div>
  );
}

// ─── Summary review screen ────────────────────────────────────────────────────
function ReviewSummary({ columns, formData, onEdit }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 mb-4">
        Review your entry before submitting.
      </p>
      {columns.map((col) => (
        <div
          key={col.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
        >
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
              {col.name}
            </div>
            <div className="text-gray-800 font-medium mt-0.5">
              {formData[col.id] !== undefined && formData[col.id] !== ""
                ? String(formData[col.id])
                : <span className="text-gray-300 italic">Not entered</span>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onEdit(col.id)}
            className="text-blue-500 text-sm font-medium hover:text-blue-700"
          >
            Edit
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddInventoryEntry() {
  const { orgId, projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canApprove, role } = usePermissions();

  const [columns, setColumns] = useState([]);
  const [materialProfiles, setMaterialProfiles] = useState([]);
  const [formData, setFormData] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [jumpToStep, setJumpToStep] = useState(null);

  // Derived: steps = date column first, then rest, then review
  const dateCol = columns.find((c) => c.dataType === "date");
  const otherCols = columns.filter((c) => c.dataType !== "date");
  const orderedColumns = dateCol ? [dateCol, ...otherCols] : columns;
  const totalSteps = orderedColumns.length + 1; // +1 for review
  const isReview = currentStep === orderedColumns.length;

  useEffect(() => {
    async function load() {
      try {
        const [cols, profiles] = await Promise.all([
          getInventoryColumns(orgId, projectId),
          getMaterialProfiles(orgId, projectId),
        ]);
        setColumns(cols);
        setMaterialProfiles(profiles);

        // Pre-fill date with today
        const datecol = cols.find((c) => c.dataType === "date");
        if (datecol) {
          setFormData((prev) => ({
            ...prev,
            [datecol.id]: new Date().toISOString().split("T")[0],
          }));
        }
      } catch (err) {
        toast.error("Failed to load inventory columns.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orgId, projectId]);

  // Handle jump-to-edit from review
  useEffect(() => {
    if (jumpToStep !== null) {
      const idx = orderedColumns.findIndex((c) => c.id === jumpToStep);
      if (idx !== -1) setCurrentStep(idx);
      setJumpToStep(null);
    }
  }, [jumpToStep, orderedColumns]);

  function handleChange(colId, value) {
    setFormData((prev) => ({ ...prev, [colId]: value }));
  }

  function handleNext() {
    const col = orderedColumns[currentStep];
    if (col?.required && !formData[col.id]) {
      toast.error(`${col.name} is required.`);
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
  }

  function handleBack() {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const entry = {
        ...formData,
        submittedBy: user.uid,
        submittedByName: user.displayName || user.email || "Unknown",
        status: canApprove ? "approved" : "pending",
        approvedBy: canApprove ? user.uid : null,
        approvedByName: canApprove
          ? user.displayName || user.email
          : null,
        timestamp: new Date().toISOString(),
      };

      if (canApprove) {
        await addInventoryEntry(orgId, projectId, entry);
        toast.success("Entry added to inventory!");
      } else {
        await submitEntryForApproval(orgId, projectId, entry);
        toast.success("Entry submitted for manager approval.");
      }

      setSubmitted(true);
    } catch (err) {
      toast.error("Failed to submit entry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {canApprove ? "Entry Added!" : "Submitted for Approval"}
        </h2>
        <p className="text-gray-500 mb-8 max-w-xs">
          {canApprove
            ? "Your inventory record has been saved successfully."
            : "Your entry will appear in the inventory after a manager approves it."}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => {
              setFormData({});
              setCurrentStep(0);
              setSubmitted(false);
              // re-fill today's date
              const datecol = columns.find((c) => c.dataType === "date");
              if (datecol) {
                setFormData({
                  [datecol.id]: new Date().toISOString().split("T")[0],
                });
              }
            }}
            className="w-full bg-blue-600 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Another Entry
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full border-2 border-gray-200 text-gray-600 font-semibold py-4 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-sm">Loading fields…</span>
        </div>
      </div>
    );
  }

  // ── No columns configured ──
  if (columns.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <Package className="w-16 h-16 text-gray-200 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">
          No Columns Set Up
        </h2>
        <p className="text-gray-400 mb-6">
          A manager needs to add columns to the inventory table first.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 font-semibold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const currentCol = orderedColumns[currentStep];
  const progress = ((currentStep) / (totalSteps - 1)) * 100;

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm font-semibold text-gray-400">
            {isReview ? "Review" : `${currentStep + 1} of ${orderedColumns.length}`}
          </span>
          <div className="w-9" />
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <StepDots total={totalSteps} current={currentStep} />
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        {isReview ? (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Review Entry
            </h1>
            <ReviewSummary
              columns={orderedColumns}
              formData={formData}
              onEdit={(colId) => setJumpToStep(colId)}
            />
          </div>
        ) : (
          <div key={currentStep} className="animate-fadeIn">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              {currentStep === 0 && dateCol?.id === currentCol?.id
                ? "📅 When did this happen?"
                : `Enter ${currentCol?.name}`}
            </h1>
            {currentCol && (
              <StepCard
                column={currentCol}
                value={formData[currentCol.id]}
                onChange={(val) => handleChange(currentCol.id, val)}
                materialProfiles={materialProfiles}
              />
            )}

            {/* Optional: low stock hint for numeric columns */}
            {currentCol?.lowStockLimit && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                ⚠️ Low stock alert is set at{" "}
                <span className="font-bold">{currentCol.lowStockLimit}</span>{" "}
                {currentCol.unit || "units"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer navigation ── */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
        {/* Skip hint for non-required fields */}
        {!isReview && !currentCol?.required && (
          <p className="text-center text-xs text-gray-400 mb-3">
            This field is optional — you can skip it.
          </p>
        )}

        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              disabled={submitting}
              className="flex items-center justify-center gap-1 px-5 py-4 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
          )}

          {isReview ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {canApprove ? "Save Entry" : "Submit for Approval"}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              {currentStep === orderedColumns.length - 1 ? (
                "Review Entry"
              ) : (
                <>
                  Next
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Role note */}
        {!canApprove && (
          <p className="text-center text-xs text-gray-400 mt-3">
            Your entry will go to a manager for approval.
          </p>
        )}
      </div>
    </div>
  );
}

// Add to index.css if not already present:
// @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
// .animate-fadeIn { animation: fadeIn 0.25s ease; }
