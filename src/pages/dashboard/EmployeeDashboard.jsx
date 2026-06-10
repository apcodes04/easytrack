import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useOrg } from "../../hooks/useOrg";
import { getProjects } from "../../services/projectService";
import ShareOrgKey from "../../components/shared/ShareOrgKey";
import Badge from "../../components/ui/Badge";
import { FolderOpen, ChevronRight, MessageSquare } from "lucide-react";
import { formatDate } from "../../utils/dateHelpers";
import LogoutButton from '@/components/shared/LogoutButton'

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { org, userRole } = useOrg();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org) return;
    getProjects(org.id, user.uid).then((p) => {
      setProjects(p);
      setLoading(false);
    });
  }, [org, user]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">
      {org?.name}
    </h1>

    <div className="flex items-center gap-2 mt-1">
      <Badge role={userRole} />

      <span className="text-sm text-gray-500">
        {user?.displayName || user?.phoneNumber || "Employee"}
      </span>
    </div>
  </div>

  <div className="flex items-center gap-3">
    <ShareOrgKey
      orgKey={org?.uniqueKey}
      orgId={org?.id}
    />

    <LogoutButton />
  </div>
</div>

      {/* My Projects */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 p-4 border-b border-gray-100">
          <FolderOpen className="w-4 h-4 text-orange-500" />
          <h2 className="font-semibold text-gray-800">My Projects</h2>
        </div>

        {projects.length === 0 ? (
          <div className="p-8 text-center">
            <FolderOpen className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">You haven't been assigned to any projects yet.</p>
            <p className="text-gray-300 text-xs mt-1">Your manager will assign you to a project.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {projects.map((project) => (
              <div key={project.id} onClick={() => navigate(`/projects/${project.id}`)} className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition">
                <div>
                  <p className="font-medium text-gray-800">{project.name}</p>
                  <p className="text-xs text-gray-400">Created {formatDate(project.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MessageSquare className="w-3 h-3" /> Chat
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
        <p className="text-sm font-medium text-orange-700">Your Role: {userRole === "assistant_manager" ? "Assistant Manager" : "Employee"}</p>
        <p className="text-xs text-orange-500 mt-1">
          {userRole === "employee"
            ? "You can view inventory and submit update requests. Changes go live after manager approval."
            : "You have extended access granted by your manager."}
        </p>
      </div>
    </div>
  );
}
