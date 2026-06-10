import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrg } from "../../hooks/useOrg";
import { useAuth } from "../../hooks/useAuth";
import { usePermissions } from "../../hooks/usePermissions";
import { getProject, assignEmployee, removeEmployee } from "../../services/projectService";
import { getOrgMembers } from "../../services/orgService";
import Badge from "../../components/ui/Badge";
import toast from "react-hot-toast";
import {
  ArrowLeft, Package, DollarSign, Users, MessageSquare,
  PlusCircle, Trash2, Settings, ChevronRight
} from "lucide-react";

const FEATURE_TABS = [
  { key: "inventory", label: "Inventory", icon: Package, color: "bg-blue-100 text-blue-600" },
  { key: "finance", label: "Finance", icon: DollarSign, color: "bg-green-100 text-green-600" },
  { key: "employees", label: "Team", icon: Users, color: "bg-purple-100 text-purple-600" },
  { key: "chat", label: "Group Chat", icon: MessageSquare, color: "bg-orange-100 text-orange-600" },
];

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { org } = useOrg();
  const { user } = useAuth();
  const { canManage, userRole } = usePermissions();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [showAssign, setShowAssign] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org) return;
    Promise.all([
      getProject(projectId),
      getOrgMembers(org.id),
    ]).then(([p, m]) => {
      setProject(p);
      setMembers(m.filter((m) => m.role === "employee" || m.role === "assistant_manager"));
      setLoading(false);
    });
  }, [projectId, org]);

  const handleAssign = async (uid) => {
    try {
      await assignEmployee(projectId, uid);
      setProject((p) => ({ ...p, assignedEmployees: [...(p.assignedEmployees || []), uid] }));
      toast.success("Employee assigned!");
    } catch { toast.error("Failed to assign"); }
  };

  const handleRemove = async (uid) => {
    try {
      await removeEmployee(projectId, uid);
      setProject((p) => ({ ...p, assignedEmployees: (p.assignedEmployees || []).filter((e) => e !== uid) }));
      toast.success("Removed from project");
    } catch { toast.error("Failed to remove"); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
    </div>
  );

  const assigned = project?.assignedEmployees || [];
  const assignedMembers = members.filter((m) => assigned.includes(m.userId));
  const unassignedMembers = members.filter((m) => !assigned.includes(m.userId));

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
     <button
  onClick={() => navigate('/')}
  className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm transition"
>
  <ArrowLeft className="w-4 h-4" />
  Back to Dashboard
</button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{project?.name}</h1>
            {project?.description && <p className="text-sm text-gray-400 mt-1">{project.description}</p>}
          </div>
          {canManage && (
            <button className="p-2 rounded-lg hover:bg-gray-100 transition">
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 gap-3">
        {FEATURE_TABS.map(({ key, label, icon: Icon, color }) => (
          <div
            key={key}
            onClick={() => navigate(`/projects/${projectId}/${key}`)}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition"
          >
            <div className={`rounded-lg p-2 ${color}`}><Icon className="w-5 h-5" /></div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{label}</p>
              <p className="text-xs text-gray-400">View & manage</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
          </div>
        ))}
      </div>

      {/* Team Management (manager only) */}
      {canManage && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Assigned Team</h2>
            <button onClick={() => setShowAssign(!showAssign)} className="flex items-center gap-1 text-sm text-orange-500 font-medium hover:underline">
              <PlusCircle className="w-4 h-4" /> Assign
            </button>
          </div>

          {showAssign && unassignedMembers.length > 0 && (
            <div className="p-3 bg-orange-50 border-b border-orange-100">
              <p className="text-xs font-medium text-orange-700 mb-2">Select members to assign:</p>
              <div className="space-y-1">
                {unassignedMembers.map((m) => (
                  <div key={m.userId} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{m.displayName || m.email || m.userId}</p>
                      <Badge role={m.role} small />
                    </div>
                    <button onClick={() => handleAssign(m.userId)} className="text-xs bg-orange-500 text-white px-2 py-1 rounded-lg hover:bg-orange-600 transition">Assign</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-50">
            {assignedMembers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No team members assigned yet.</p>
            ) : (
              assignedMembers.map((m) => (
                <div key={m.userId} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{m.displayName || m.email || m.userId}</p>
                    <Badge role={m.role} small />
                  </div>
                  <button onClick={() => handleRemove(m.userId)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
