import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrg } from "../../../hooks/useOrg";
import { useAuth } from "../../../hooks/useAuth";
import { usePermissions } from "../../../hooks/usePermissions";
import {
  getFinanceColumns,
  addFinanceEntry,
  addFinanceColumn,
} from "../../../services/financeService";
import StepForm from "../../../components/ui/StepForm";
import Button from "../../../components/ui/Button";
import AlertBanner from "../../../components/ui/AlertBanner";
import { DollarSign, PlusCircle, Settings } from "lucide-react";

export default function AddFinanceEntry() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { org } = useOrg();
  const { user } = useAuth();
  const { canApprove, role } = usePermissions();

  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newCol, setNewCol] = useState({ name: "", dataType: "string" });

  useEffect(() => {
    if (!org?.id || !projectId) return;
    loadColumns();
  }, [org?.id, projectId]);

  async function loadColumns() {
    setLoading(true);
    try {
      const cols = await getFinanceColumns(org.id, projectId);
      if (cols.length === 0) {
        // seed defaults
        await Promise.all([
          addFinanceColumn(org.id, projectId, { name: "Description", dataType: "string" }),
          addFinanceColumn(org.id, projectId, { name: "Amount", dataType: "numeric" }),
          addFinanceColumn(org.id, projectId, { name: "Type", dataType: "string" }),
          addFinanceColumn(org.id, projectId, { name: "Party / Vendor", dataType: "string" }),
        ]);
        const refreshed = await getFinanceColumns(org.id, projectId);
        setColumns(refreshed);
      } else {
        setColumns(cols);
      }
    } catch {
      setError("Failed to load columns.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddColumn() {
    if (!newCol.name.trim()) return;
    try {
      await addFinanceColumn(org.id, projectId, newCol);
      setShowAddColumn(false);
      setNewCol({ name: "", dataType: "string" });
      loadColumns();
    } catch {
      setError("Failed to add column.");
    }
  }

  async function handleSubmit(formData) {
    setSubmitting(true);
    setError("");
    try {
      const status = canApprove ? "approved" : "pending";
      await addFinanceEntry(org.id, projectId, {
        ...formData,
        submittedBy: user?.displayName || user?.phoneNumber || user?.email || user?.uid,
        status,
        approvedBy: canApprove ? (user?.displayName || user?.uid) : null,
      });
      navigate(`/projects/${projectId}/finance`);
    } catch {
      setError("Failed to submit entry.");
      setSubmitting(false);
    }
  }

  const steps = [
    {
      title: "Date",
      description: "When did this transaction occur?",
      field: { id: "date", label: "Transaction Date", type: "date", required: true },
    },
    ...columns.map((col) => ({
      title: col.name,
      description: `Enter ${col.name}`,
      field: {
        id: col.id,
        label: col.name,
        type: col.dataType === "numeric" ? "number" : col.dataType === "date" ? "date" : "text",
        required: false,
        placeholder: col.dataType === "numeric" ? "Enter amount..." : `Enter ${col.name}...`,
      },
    })),
  ];

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <DollarSign size={22} className="text-green-600" />
          Add Finance Entry
        </h2>
        {canApprove && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddColumn(!showAddColumn)}
            className="flex items-center gap-1"
          >
            <Settings size={14} /> Manage Columns
          </Button>
        )}
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {!canApprove && (
        <AlertBanner
          type="info"
          message="Your entry will be submitted for approval by a Manager or Asst. Manager."
        />
      )}

      {/* Add Column Panel */}
      {showAddColumn && canApprove && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <PlusCircle size={16} /> Add New Column
          </h3>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Column name (e.g. Invoice No)"
            value={newCol.name}
            onChange={(e) => setNewCol({ ...newCol, name: e.target.value })}
          />
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            value={newCol.dataType}
            onChange={(e) => setNewCol({ ...newCol, dataType: e.target.value })}
          >
            <option value="string">Text / String</option>
            <option value="numeric">Numeric (for calculations)</option>
            <option value="date">Date</option>
          </select>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddColumn}>Add Column</Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddColumn(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <StepForm steps={steps} onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}
