import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useOrg } from "../../../hooks/useOrg";
import { usePermissions } from "../../../hooks/usePermissions";
import {
  getEmployeeColumns,
  getEmployeeEntries,
  deleteEmployeeEntry,
} from "../../../services/employeeService";
import DataTable from "../../../components/ui/DataTable";
import Button from "../../../components/ui/Button";
import AlertBanner from "../../../components/ui/AlertBanner";
import { formatDate } from "../../../utils/dateHelpers";
import { Link } from "react-router-dom";
import { Users, PlusCircle, Trash2, UserCheck } from "lucide-react";

export default function EmployeeTable() {
  const { projectId } = useParams();
  const { org } = useOrg();
  const { canEdit, canApprove } = usePermissions();

  const [columns, setColumns] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!org?.id || !projectId) return;
    loadData();
  }, [org?.id, projectId]);

  async function loadData() {
    setLoading(true);
    try {
      const [cols, ents] = await Promise.all([
        getEmployeeColumns(org.id, projectId),
        getEmployeeEntries(org.id, projectId),
      ]);
      setColumns(cols);
      setEntries(ents);
    } catch {
      setError("Failed to load employee data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(entryId) {
    if (!window.confirm("Delete this record?")) return;
    try {
      await deleteEmployeeEntry(org.id, projectId, entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch {
      setError("Failed to delete record.");
    }
  }

  // Summary stats
  const approved = entries.filter((e) => e.status === "approved");
  const pending = entries.filter((e) => e.status === "pending");
  const totalLabour = approved.length;

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
    ...(canApprove
      ? [
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
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Users size={22} className="text-purple-600" />
          Employee Management
        </h2>
        {canEdit && (
          <Link to={`/projects/${projectId}/employees/add`}>
            <Button size="sm" className="flex items-center gap-1">
              <PlusCircle size={16} /> Add Record
            </Button>
          </Link>
        )}
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-purple-700 text-sm font-medium mb-1">
            <UserCheck size={16} /> Total Records
          </div>
          <p className="text-2xl font-bold text-purple-800">{totalLabour}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="text-yellow-700 text-sm font-medium mb-1">Pending Approval</div>
          <p className="text-2xl font-bold text-yellow-800">{pending.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="text-green-700 text-sm font-medium mb-1">Approved Entries</div>
          <p className="text-2xl font-bold text-green-800">{approved.length}</p>
        </div>
      </div>

      {/* Pending Approvals Section */}
      {canApprove && pending.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">
          <p className="text-yellow-800 font-semibold text-sm">
            ⏳ {pending.length} entries awaiting your approval
          </p>
          <Link
            to={`/projects/${projectId}/approvals`}
            className="text-yellow-700 underline text-sm mt-1 inline-block"
          >
            Review Approvals →
          </Link>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No employee records yet.{" "}
          {canEdit && (
            <Link
              to={`/projects/${projectId}/employees/add`}
              className="text-blue-600 underline"
            >
              Add the first record
            </Link>
          )}
        </div>
      ) : (
        <DataTable columns={tableColumns} data={entries} />
      )}
    </div>
  );
}
