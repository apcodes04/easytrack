import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useOrg } from "../../../hooks/useOrg";
import { useAuth } from "../../../hooks/useAuth";
import { createCustomFeature } from "../../../services/customFeatureService";
import Button from "../../../components/ui/Button";
import AlertBanner from "../../../components/ui/AlertBanner";
import { Layers, PlusCircle, Trash2, Sparkles } from "lucide-react";

const DATA_TYPES = [
  { value: "string", label: "Text (names, notes, etc.)" },
  { value: "numeric", label: "Numeric (for calculations)" },
  { value: "date", label: "Date" },
];

export default function CreateCustomFeature() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { org } = useOrg();
  const { user } = useAuth();

  const [featureName, setFeatureName] = useState("");
  const [columns, setColumns] = useState([
    { name: "", dataType: "string" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function addColumn() {
    setColumns([...columns, { name: "", dataType: "string" }]);
  }

  function removeColumn(idx) {
    setColumns(columns.filter((_, i) => i !== idx));
  }

  function updateColumn(idx, field, value) {
    setColumns(columns.map((col, i) => (i === idx ? { ...col, [field]: value } : col)));
  }

  async function handleCreate() {
    if (!featureName.trim()) {
      setError("Please enter a feature name.");
      return;
    }
    const validCols = columns.filter((c) => c.name.trim());
    if (validCols.length === 0) {
      setError("Add at least one column.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await createCustomFeature(org.id, projectId, {
        name: featureName.trim(),
        columns: validCols,
        createdBy: user?.uid,
      });
      navigate(`/projects/${projectId}`);
    } catch {
      setError("Failed to create feature.");
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Sparkles size={20} className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Create Custom Feature</h2>
          <p className="text-sm text-gray-500">Build a custom tracking table for your project.</p>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {/* Feature Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Feature Name <span className="text-red-500">*</span>
        </label>
        <input
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="e.g. Equipment Log, Safety Checklist..."
          value={featureName}
          onChange={(e) => setFeatureName(e.target.value)}
        />
      </div>

      {/* Columns */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-700">
            Columns <span className="text-xs text-gray-400">(Date is always included)</span>
          </label>
          <button
            onClick={addColumn}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <PlusCircle size={16} /> Add Column
          </button>
        </div>

        <div className="space-y-3">
          {/* Date column (fixed) */}
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Date</p>
              <p className="text-xs text-gray-400">Mandatory — always included</p>
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Date</span>
          </div>

          {columns.map((col, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
              <input
                className="flex-1 text-sm border-none outline-none bg-transparent placeholder-gray-400"
                placeholder={`Column ${idx + 1} name...`}
                value={col.name}
                onChange={(e) => updateColumn(idx, "name", e.target.value)}
              />
              <select
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                value={col.dataType}
                onChange={(e) => updateColumn(idx, "dataType", e.target.value)}
              >
                {DATA_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>{dt.label}</option>
                ))}
              </select>
              <button
                onClick={() => removeColumn(idx)}
                className="text-red-400 hover:text-red-600 transition"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Numeric relations hint */}
      {columns.filter((c) => c.dataType === "numeric").length >= 2 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <strong>💡 Tip:</strong> You have multiple numeric columns. After creating the feature, you can define calculated columns (e.g. Received − Used = Remaining) in the feature settings.
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={handleCreate} disabled={submitting} className="flex-1">
          {submitting ? "Creating..." : "Create Feature"}
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
