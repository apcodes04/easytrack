import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrg } from "../../../hooks/useOrg";
import { usePermissions } from "../../../hooks/usePermissions";
import {
  getInventoryColumns,
  getInventoryEntries,
  approveEntry,
  rejectEntry,
  deleteInventoryEntry,
} from "../../../services/inventoryService";
import DataTable from "../../../components/ui/DataTable";
import AlertBanner from "../../../components/ui/AlertBanner";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import LowStockAlert from "./LowStockAlert";
import { formatDate } from "../../../utils/dateHelpers";
import { computeDerivedColumns } from "../../../utils/columnOperations";
import toast from "react-hot-toast";
import {
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  Settings,
} from "lucide-react";

const STATUS_STYLES = {
  approved: "bg-green-50 text-green-700 border border-green-200",
  pending:  "bg-amber-50 text-amber-700 border border-amber-200",
  rejected: "bg-red-50 text-red-700 border border-red-200",
};

export default function InventoryTable() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { org } = useOrg();
  const { canApprove, canEdit } = usePermissions();

  const [columns, setColumns]         = useState([]);
  const [entries, setEntries]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [showLowStock, setShowLowStock]   = useState(false);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const scopeId = `${org?.id}_${projectId}`;

  const detectLowStock = (rows, cols) => {
    const alerts = [];
    cols.forEach((col) => {
      if (col.dataType === "number" && col.lowStockLimit != null) {
        rows.forEach((row) => {
          const val = parseFloat(row[col.id]);
          if (!isNaN(val) && val <= col.lowStockLimit) {
            alerts.push({
              material: row.materialName || row.material || "Item",
              column: col.name,
              value: val,
              limit: col.lowStockLimit,
              unit: col.unit || "",
            });
          }
        });
      }
    });
    return alerts;
  };

  const load = useCallback(async () => {
    if (!org) return;
    try {
      const [cols, rawEntries] = await Promise.all([
        getInventoryColumns(scopeId),
        getInventoryEntries(scopeId),
      ]);
      setColumns(cols);
      const enriched = rawEntries.map((e) => computeDerivedColumns(e, cols));
      setEntries(enriched);
      setLowStockItems(detectLowStock(enriched, cols));
    } catch {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [scopeId, org]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (entryId) => {
    setActionLoading((p) => ({ ...p, [entryId]: "approving" }));
    try {
      await approveEntry(scopeId, entryId);
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, status: "approved" } : e))
      );
      toast.success("Entry approved");
    } catch {
      toast.error("Approval failed");
    } finally {
      setActionLoading((p) => ({ ...p, [entryId]: null }));
    }
  };

  const handleReject = async (entryId) => {
    setActionLoading((p) => ({ ...p, [entryId]: "rejecting" }));
    try {
      await rejectEntry(scopeId, entryId);
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, status: "rejected" } : e))
      );
      toast.success("Entry rejected");
    } catch {
      toast.error("Rejection failed");
    } finally {
      setActionLoading((p) => ({ ...p, [entryId]: null }));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteInventoryEntry(scopeId, deleteTarget);
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget));
      toast.success("Entry deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  };

  const tableColumns = [
    {
      key: "date",
      label: "Date",
      render: (val) => <span className="text-gray-600 text-sm">{formatDate(val)}</span>,
    },
    ...columns.filter((c) => !c.isDerived).map((col) => ({
      key: col.id,
      label: col.name,
      render: (val) => {
        if (col.dataType === "number" && col.lowStockLimit != null) {
          const num = parseFloat(val);
          if (!isNaN(num) && num <= col.lowStockLimit) {
            return (
              <span className="flex items-center gap-1 text-red-600 font-semibold text-sm">
                <AlertTriangle className="w-3.5 h-3.5" />
                {val}{col.unit ? ` ${col.unit}` : ""}
              </span>
            );
          }
        }
        return (
          <span className="text-gray-700 text-sm">
            {val != null ? `${val}${col.unit ? " " + col.unit : ""}` : "—"}
          </span>
        );
      },
    })),
    ...columns.filter((c) => c.isDerived).map((col) => ({
      key: col.id,
      label: `${col.name} (calc)`,
      render: (val) => (
        <span className="text-blue-600 font-medium text-sm">{val != null ? val : "—"}</span>
      ),
    })),
    {
      key: "submittedBy",
      label: "Submitted By",
      render: (val) => <span className="text-gray-500 text-xs">{val || "—"}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (val) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[val] || STATUS_STYLES.pending}`}>
          {val || "pending"}
        </span>
      ),
    },
    ...(canApprove ? [
      {
        key: "approvedBy",
        label: "Actioned By",
        render: (val) => <span className="text-gray-400 text-xs">{val || "—"}</span>,
      },
      {
        key: "_actions",
        label: "Actions",
        render: (_, row) => {
          const busy = actionLoading[row.id];
          if (row.status === "approved" || row.status === "rejected") {
            return (
              <button onClick={() => setDeleteTarget(row.id)} className="p-1 text-red-400 hover:bg-red-50 rounded transition">
                <Trash2 className="w-4 h-4" />
              </button>
            );
          }
          return (
            <div className="flex items-center gap-1">
              <button onClick={() => handleApprove(row.id)} disabled={!!busy}
                className="p-1 text-green-500 hover:bg-green-50 rounded transition disabled:opacity-40" title="Approve">
                <CheckCircle className="w-4 h-4" />
              </button>
              <button onClick={() => handleReject(row.id)} disabled={!!busy}
                className="p-1 text-red-400 hover:bg-red-50 rounded transition disabled:opacity-40" title="Reject">
                <XCircle className="w-4 h-4" />
              </button>
              <button onClick={() => setDeleteTarget(row.id)}
                className="p-1 text-gray-400 hover:bg-gray-50 rounded transition" title="Delete">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        },
      },
    ] : []),
  ];

  return (
    <div className="px-4 py-6 space-y-4 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
            <p className="text-xs text-gray-400">{entries.length} total entries</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {lowStockItems.length > 0 && (
            <button
              onClick={() => setShowLowStock(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-200 hover:bg-red-100 transition"
            >
              <AlertTriangle className="w-4 h-4" />
              {lowStockItems.length} Low Stock
            </button>
          )}
          <button
            onClick={() => { setRefreshing(true); load(); }}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          {canEdit && (
            <>
              <Button variant="outline" onClick={() => navigate("material-profiles")}
                className="flex items-center gap-1.5 text-sm">
                <Settings className="w-4 h-4" /> Profiles
              </Button>
              <Button onClick={() => navigate("add-entry")} className="flex items-center gap-1.5 text-sm">
                <Plus className="w-4 h-4" /> Add Entry
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Banners */}
      {lowStockItems.length > 0 && (
        <AlertBanner type="error"
          message={`${lowStockItems.length} material(s) at or below low-stock threshold. Tap "Low Stock" to review.`} />
      )}
      {canApprove && entries.filter((e) => e.status === "pending").length > 0 && (
        <AlertBanner type="warning"
          message={`${entries.filter((e) => e.status === "pending").length} entr(ies) awaiting your approval.`} />
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No inventory entries yet.</p>
          {canEdit && (
            <Button onClick={() => navigate("add-entry")} className="mt-4 mx-auto flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add First Entry
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <DataTable columns={tableColumns} data={entries} />
        </div>
      )}

      {/* Low Stock Modal */}
      <Modal isOpen={showLowStock} onClose={() => setShowLowStock(false)} title="Low Stock Alerts">
        <LowStockAlert items={lowStockItems} onClose={() => setShowLowStock(false)} />
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Entry">
        <p className="text-gray-600 text-sm mb-5">
          Are you sure you want to delete this entry? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)}
            className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={handleDelete}
            className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition">
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
