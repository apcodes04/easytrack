import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useOrg } from "../../../hooks/useOrg";
import { usePermissions } from "../../../hooks/usePermissions";
import {
  getFinanceColumns,
  getFinanceEntries,
  deleteFinanceEntry,
} from "../../../services/financeService";
import DataTable from "../../../components/ui/DataTable";
import Button from "../../../components/ui/Button";
import AlertBanner from "../../../components/ui/AlertBanner";
import { formatDate } from "../../../utils/dateHelpers";
import { Link } from "react-router-dom";
import { PlusCircle, Trash2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default function FinanceTable() {
  const { projectId } = useParams();
  const { org } = useOrg();
  const { canEdit, canApprove } = usePermissions();

  const [columns, setColumns] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({});

  useEffect(() => {
    if (!org?.id || !projectId) return;
    loadData();
  }, [org?.id, projectId]);

  async function loadData() {
    setLoading(true);
    try {
      const [cols, ents] = await Promise.all([
        getFinanceColumns(org.id, projectId),
        getFinanceEntries(org.id, projectId),
      ]);
      setColumns(cols);
      setEntries(ents);
      computeSummary(cols, ents);
    } catch (e) {
      setError("Failed to load finance data.");
    } finally {
      setLoading(false);
    }
  }

  function computeSummary(cols, ents) {
    const approvedEntries = ents.filter((e) => e.status === "approved");
    const s = {};
    cols.forEach((col) => {
      if (col.dataType === "numeric") {
        s[col.name] = approvedEntries.reduce(
          (sum, e) => sum + (parseFloat(e[col.id]) || 0),
          0
        );
      }
    });
    setSummary(s);
  }

  async function handleDelete(entryId) {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await deleteFinanceEntry(org.id, projectId, entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch {
      setError("Failed to delete entry.");
    }
  }

  const tableColumns = [
    { key: "date", label: "Date", render: (v) => formatDate(v) },
    ...columns.map((col) => ({
      key: col.id,
      label: col.name,
      render: (v) =>
        col.dataType === "numeric" && v !== undefined
          ? Number(v).toLocaleString()
          : v || "—",
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
    {
      key: "submittedBy",
      label: "Submitted By",
      render: (v) => v || "—",
    },
    ...(canApprove
      ? [
          {
            key: "approvedBy",
            label: "Approved By",
            render: (v) => v || "—",
          },
        ]
      : []),
    ...(canEdit
      ? [
          {
            key: "actions",
            label: "",
            render: (_, row) =>
              canApprove ? (
                <button
                  onClick={() => handleDelete(row.id)}
                  className="text-red-400 hover:text-red-600 transition"
                >
                  <Trash2 size={16} />
                </button>
              ) : null,
          },
        ]
      : []),
  ];

  const totalIncome = Object.entries(summary)
    .filter(([k]) => k.toLowerCase().includes("income") || k.toLowerCase().includes("revenue") || k.toLowerCase().includes("earning"))
    .reduce((s, [, v]) => s + v, 0);

  const totalExpense = Object.entries(summary)
    .filter(([k]) => k.toLowerCase().includes("expense") || k.toLowerCase().includes("cost") || k.toLowerCase().includes("expenditure"))
    .reduce((s, [, v]) => s + v, 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <DollarSign size={22} className="text-green-600" />
          Finance Management
        </h2>
        {canEdit && (
          <Link to={`/projects/${projectId}/finance/add`}>
            <Button size="sm" className="flex items-center gap-1">
              <PlusCircle size={16} /> Add Entry
            </Button>
          </Link>
        )}
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-1">
            <TrendingUp size={16} /> Total Income
          </div>
          <p className="text-2xl font-bold text-green-800">
            ₹{totalIncome.toLocaleString()}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-700 text-sm font-medium mb-1">
            <TrendingDown size={16} /> Total Expense
          </div>
          <p className="text-2xl font-bold text-red-800">
            ₹{totalExpense.toLocaleString()}
          </p>
        </div>
        <div className={`border rounded-xl p-4 col-span-2 ${totalIncome - totalExpense >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}>
          <div className="text-sm font-medium mb-1 text-gray-600">Net Balance</div>
          <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? "text-blue-800" : "text-orange-800"}`}>
            ₹{(totalIncome - totalExpense).toLocaleString()}
          </p>
        </div>
        {Object.entries(summary).map(([key, val]) => (
          <div key={key} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1 truncate">{key}</div>
            <p className="text-lg font-bold text-gray-800">{Number(val).toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No finance entries yet.{" "}
          {canEdit && (
            <Link to={`/projects/${projectId}/finance/add`} className="text-blue-600 underline">
              Add the first entry
            </Link>
          )}
        </div>
      ) : (
        <DataTable columns={tableColumns} data={entries} />
      )}
    </div>
  );
}
