import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrg } from "../../../hooks/useOrg";
import { useAuth } from "../../../hooks/useAuth";
import { usePermissions } from "../../../hooks/usePermissions";
import {
  getCustomFeature,
  getCustomEntries,
  addCustomEntry,
  deleteCustomEntry,
} from "../../../services/customFeatureService";
import StepForm from "../../../components/ui/StepForm";
import DataTable from "../../../components/ui/DataTable";
import Button from "../../../components/ui/Button";
import AlertBanner from "../../../components/ui/AlertBanner";
import { formatDate } from "../../../utils/dateHelpers";
import { Layers, PlusCircle, Trash2, Table } from "lucide-react";

export default function CustomFeature() {
  const { projectId, featureId } = useParams();
  const navigate = useNavigate();
  const { org } = useOrg();
  const { user } = useAuth();
  const { canEdit, canApprove } = usePermissions();

  const [feature, setFeature] = useState(null);
  const [entries, setEntries] = useState([]);
  const [view, setView] = useState("table"); // "table" | "add"
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!org?.id || !projectId || !featureId) return;
    loadData();
  }, [org?.id, projectId, featureId]);

  async function loadData() {
    setLoading(true);
    try {
      const [feat, ents] = await Promise.all([
        getCustomFeature(org.id, projectId, featureId),
        getCustomEntries(org.id, projectId, featureId),
      ]);
      setFeature(feat);
      setEntries(ents);
    } catch {
      setError("Failed to load feature data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(formData) {
    setSubmitting(true);
    setError("");
    try {
      const status = canApprove ? "approved" : "pending";
      await addCustomEntry(org.id, projectId, featureId, {
        ...formData,
        submittedBy: user?.displayName || user?.phoneNumber || user?.email || user?.uid,
        status,
        approvedBy: canApprove ? (user?.displayName || user?.uid) : null,
      });
      setView("table");
      loadData();
    } catch {
      setError("Failed to add entry.");
      setSubmitting(false);
    }
  }

  async function handleDelete(entryId) {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await deleteCustomEntry(org.id, projectId, featureId, entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch {
      setError("Failed to delete.");
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  if (!feature) return <div className="text-center py-12 text-red-400">Feature not found.</div>;

  const steps = [
    {
      title: "Date",
      description: "Date of this entry",
      field: { id: "date", label: "Date", type: "date", required: true },
    },
    ...(feature.columns || []).map((col) => ({
      title: col.name,
      description: `Enter ${col.name}`,
      field: {
        id: col.id || col.name.toLowerCase().replace(/\s+/g, "_"),
        label: col.name,
        type: col.dataType === "numeric" ? "number" : col.dataType === "date" ? "date" : "text",
        required: false,
        placeholder: `Enter ${col.name}...`,
      },
    })),
  ];

  const tableColumns = [
    { key: "date", label: "Date", render: (v) => formatDate(v) },
    ...(feature.columns || []).map((col) => ({
      key: col.id || col.name.toLowerCase().replace(/\s+/g, "_"),
      label: col.name,
      render: (v) =>
        col.dataType === "numeric" && v !== undefined ? Number(v).toLocaleString() : v || "—",
    })),
    {
      key: "status",
      label: "Status",
      render: (v) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            v === "approved"
              ? "bg-green-100 text-green-700"
              : v === "pending"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {v}
        </span>
      ),
    },
    { key: "submittedBy", label: "Submitted By", render: (v) => v || "—" },
    ...(canApprove
      ? [
          { key: "approvedBy", label: "Approved By", render: (v) => v || "—" },
          {
            key: "actions",
            label: "",
            render: (_, row) => (
              <button
                onClick={() => handleDelete(row.id)}
                className="text-red-400 hover:text-red-600 transition"
              >
                <Trash2 size={16} />
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Layers size={18} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{feature.name}</h2>
            <p className="text-xs text-gray-400">{entries.length} total entries</p>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button
              onClick={() => setView("table")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${view === "table" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              <Table size={14} /> Table
            </button>
            <button
              onClick={() => setView("add")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${view === "add" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              <PlusCircle size={14} /> Add Entry
            </button>
          </div>
        )}
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {view === "table" ? (
        entries.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No entries yet.{" "}
            {canEdit && (
              <button
                onClick={() => setView("add")}
                className="text-indigo-600 underline"
              >
                Add the first entry
              </button>
            )}
          </div>
        ) : (
          <DataTable columns={tableColumns} data={entries} />
        )
      ) : (
        <div className="max-w-xl mx-auto">
          {!canApprove && (
            <AlertBanner
              type="info"
              message="Your entry will be submitted for approval."
              className="mb-4"
            />
          )}
          <StepForm steps={steps} onSubmit={handleSubmit} submitting={submitting} />
        </div>
      )}
    </div>
  );
}
