import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrg } from "../../hooks/useOrg";
import { useAuth } from "../../hooks/useAuth";
import { getProjects } from "../../services/projectService";
import { usePermissions } from "../../hooks/usePermissions";
import { FolderOpen, PlusCircle, ChevronRight, Users } from "lucide-react";
import { formatDate } from "../../utils/dateHelpers";

export default function ProjectList() {
  const { org } = useOrg();
  const { user } = useAuth();
  const { canManage } = usePermissions();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org) return;
    getProjects(org.id, canManage ? null : user.uid).then((p) => {
      setProjects(p);
      setLoading(false);
    });
  }, [org]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Projects</h1>
        {canManage && (
          <button onClick={() => navigate("/projects/create")} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
            <PlusCircle className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center shadow-sm">
          <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No projects found</p>
          {canManage && (
            <button onClick={() => navigate("/projects/create")} className="mt-4 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition">
              Create First Project
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between hover:shadow-md cursor-pointer transition">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 rounded-lg p-2">
                  <FolderOpen className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{p.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <Users className="w-3 h-3" />
                    <span>{p.assignedEmployees?.length || 0} members</span>
                    <span>·</span>
                    <span>{formatDate(p.createdAt)}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
