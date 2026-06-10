import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrg } from "../../../hooks/useOrg";
import { useAuth } from "../../../hooks/useAuth";
import { usePermissions } from "../../../hooks/usePermissions";
import {
  getEmployeeColumns,
  addEmployeeEntry,
  addEmployeeColumn,
} from "../../../services/employeeService";
import {
  getOrgMembers,
  promoteUser,
  demoteUser,
  removeUserFromOrg,
} from "../../../services/orgService";
import StepForm from "../../../components/ui/StepForm";
import Button from "../../../components/ui/Button";
import AlertBanner from "../../../components/ui/AlertBanner";
import Badge from "../../../components/ui/Badge";
import { Users, PlusCircle, Settings, Shield, ChevronUp, ChevronDown, UserX } from "lucide-react";

export default function ManageEmployees() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { org } = useOrg();
  const { user } = useAuth();
  const { canApprove, role } = usePermissions();

  const [tab, setTab] = useState("add"); // "add" | "members"
  const [columns, setColumns] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newCol, setNewCol] = useState({ name: "", dataType: "string" });

  useEffect(() => {
    if (!org?.id) return;
    loadAll();
  }, [org?.id, projectId]);

  async function loadAll() {
    setLoading(true);
    try {
      const [cols, mems] = await Promise.all([
        getEmployeeColumns(org.id, projectId),
        getOrgMembers(org.id),
      ]);
      if (cols.length === 0) {
        await Promise.all([
          addEmployeeColumn(org.id, projectId, { name: "Employee Name", dataType: "string" }),
          addEmployeeColumn(org.id, projectId, { name: "Role / Trade", dataType: "string" }),
          addEmployeeColumn(org.id, projectId, { name: "Daily Wage", dataType: "numeric" }),
          addEmployeeColumn(org.id, projectId, { name: "Days Present", dataType: "numeric" }),
          addEmployeeColumn(org.id, projectId, { name: "Remarks", dataType: "string" }),
        ]);
        const refreshed = await getEmployeeColumns(org.id, projectId);
        setColumns(refreshed);
      } else {
        setColumns(cols);
      }
      setMembers(mems);
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddColumn() {
    if (!newCol.name.trim()) return;
    try {
      await addEmployeeColumn(org.id, projectId, newCol);
      setShowAddColumn(false);
      setNewCol({ name: "", dataType: "string" });
      loadAll();
    } catch {
      setError("Failed to add column.");
    }
  }

  async function handleSubmit(formData) {
    setSubmitting(true);
    setError("");
    try {
      const status = canApprove ? "approved" : "pending";
      await addEmployeeEntry(org.id, projectId, {
        ...formData,
        submittedBy: user?.displayName || user?.phoneNumber || user?.email || user?.uid,
        status,
        approvedBy: canApprove ? (user?.displayName || user?.uid) : null,
      });
      navigate(`/projects/${projectId}/employees`);
    } catch {
      setError("Failed to submit entry.");
      setSubmitting(false);
    }
  }

  async function handlePromote(memberId, currentRole) {
    try {
      const nextRole = currentRole === "employee" ? "asst_manager" : "manager";
      if (nextRole === "manager" && role !== "manager") {
        setError("Only a Manager can promote to Manager.");
        return;
      }
      await promoteUser(org.id, memberId, nextRole);
      loadAll();
    } catch {
      setError("Failed to promote.");
    }
  }

  async function handleDemote(memberId, currentRole) {
    try {
      const prevRole = currentRole === "manager" ? "asst_manager" : "employee";
      await demoteUser(org.id, memberId, prevRole);
      loadAll();
    } catch {
      setError("Failed to demote.");
    }
  }

  async function handleRemove(memberId) {
    if (!window.confirm("Remove this member from the organization?")) return;
    try {
      await removeUserFromOrg(org.id, memberId);
      loadAll();
    } catch {
      setError("Failed to remove member.");
    }
  }

  const steps = [
    {
      title: "Date",
      description: "Date of this record",
      field: { id: "date", label: "Date", type: "date", required: true },
    },
    ...columns.map((col) => ({
      title: col.name,
      description: `Enter ${col.name}`,
      field: {
        id: col.id,
        label: col.name,
        type: col.dataType === "numeric" ? "number" : col.dataType === "date" ? "date" : "text",
        required: false,
        placeholder: `Enter ${col.name}...`,
      },
    })),
  ];

  const roleOrder = { manager: 3, asst_manager: 2, employee: 1 };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Users size={22} className="text-purple-600" />
          Employee Management
        </h2>
        {canApprove && (
          <div className="flex gap-2">
            <button
              onClick={() => setTab("add")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${tab === "add" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Add Record
            </button>
            <button
              onClick={() => setTab("members")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${tab === "members" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Org Members
            </button>
          </div>
        )}
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {tab === "add" && (
        <>
          {!canApprove && (
            <AlertBanner
              type="info"
              message="Your entry will be submitted for approval."
            />
          )}

          {/* Add Column Panel */}
          {canApprove && (
            <div>
              <button
                onClick={() => setShowAddColumn(!showAddColumn)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 transition"
              >
                <Settings size={14} /> Manage Columns
              </button>
              {showAddColumn && (
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    placeholder="Column name (e.g. Department)"
                    value={newCol.name}
                    onChange={(e) => setNewCol({ ...newCol, name: e.target.value })}
                  />
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={newCol.dataType}
                    onChange={(e) => setNewCol({ ...newCol, dataType: e.target.value })}
                  >
                    <option value="string">Text / String</option>
                    <option value="numeric">Numeric</option>
                    <option value="date">Date</option>
                  </select>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddColumn}>Add</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddColumn(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <StepForm steps={steps} onSubmit={handleSubmit} submitting={submitting} />
        </>
      )}

      {tab === "members" && canApprove && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Manage organization members, roles, and permissions.</p>
          {members.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No members found.</div>
          ) : (
            members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
              >
                <div>
                  <p className="font-semibold text-gray-800">{member.displayName || member.userId}</p>
                  <p className="text-xs text-gray-400">{member.email || member.phone || ""}</p>
                  <Badge role={member.role} />
                </div>
                {member.userId !== user?.uid && (
                  <div className="flex items-center gap-2">
                    {/* Promote */}
                    {(role === "manager" || (role === "asst_manager" && member.role === "employee")) &&
                      member.role !== "manager" && (
                        <button
                          onClick={() => handlePromote(member.userId, member.role)}
                          className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 transition"
                        >
                          <ChevronUp size={12} /> Promote
                        </button>
                      )}
                    {/* Demote */}
                    {role === "manager" && member.role !== "employee" && (
                      <button
                        onClick={() => handleDemote(member.userId, member.role)}
                        className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-lg hover:bg-yellow-200 transition"
                      >
                        <ChevronDown size={12} /> Demote
                      </button>
                    )}
                    {/* Remove */}
                    {role === "manager" && (
                      <button
                        onClick={() => handleRemove(member.userId)}
                        className="flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg hover:bg-red-200 transition"
                      >
                        <UserX size={12} /> Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
