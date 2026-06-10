import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useOrg } from "../../hooks/useOrg";
import { getProjects } from "../../services/projectService";
import { getPendingJoinRequests, approveJoinRequest, denyJoinRequest } from "../../services/orgService";
import ShareOrgKey from "../../components/shared/ShareOrgKey";
import Badge from "../../components/ui/Badge";
import toast from "react-hot-toast";
import { formatDate } from "../../utils/dateHelpers";
import { Users, FolderOpen, PlusCircle, Bell, TrendingUp, ChevronRight } from "lucide-react";
import LogoutButton from '@/components/shared/LogoutButton'


export default function ManagerDashboard() {
  const { user } = useAuth();
  const {
  currentOrg: org,
  role: userRole
} = useOrg();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!org) return;

  let unsubscribe;

  async function loadData() {
    try {
      const p = await getProjects(org.id);
      setProjects(p || []);

      unsubscribe = getPendingJoinRequests(org.id, (requests) => {
        setPendingRequests(requests || []);
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  loadData();

  return () => {
    if (unsubscribe) unsubscribe();
  };
}, [org]);

  const handleApprove = async (userId) => {
    try {
      await approveJoinRequest(org.id, userId);
      setPendingRequests((r) => r.filter((req) => req.userId !== userId));
      toast.success("Member approved!");
    } catch {
      toast.error("Failed to approve");
    }
  };

  const handleDeny = async (userId) => {
    try {
      await denyJoinRequest(org.id, userId);
      setPendingRequests((r) => r.filter((req) => req.userId !== userId));
      toast.success("Request denied");
    } catch {
      toast.error("Failed to deny");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
<div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5">
  <h1 className="text-2xl font-bold text-white">
    {org?.name}
  </h1>

  <div className="flex items-center gap-2 mt-2">
    <Badge role={userRole} />
    <span className="text-sm text-slate-400">
      {user?.displayName ||
        user?.phoneNumber ||
        user?.email}
    </span>
  </div>
</div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="bg-violet-100 rounded-lg p-2">
  <FolderOpen className="text-violet-600 w-5 h-5" />
</div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
            <p className="text-xs text-gray-500">Projects</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="bg-blue-100 rounded-lg p-2"><Users className="text-blue-500 w-5 h-5" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
            <p className="text-xs text-gray-500">Pending Requests</p>
          </div>
        </div>
        <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition hover:scale-[1.02]" onClick={() => navigate("/reports")}>
          <div className="bg-white/20 rounded-lg p-2"><TrendingUp className="text-white w-5 h-5" /></div>
          <div>
            <p className="text-sm font-semibold text-white">Generate Report</p>
            <p className="text-xs text-green-100">
  PDF export
</p>
          </div>
        </div>
      </div>

      {/* Pending Join Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-xl border border-yellow-200 shadow-sm">
          <div className="flex items-center gap-2 p-4 border-b border-yellow-100">
            <Bell className="w-4 h-4 text-yellow-500" />
            <h2 className="font-semibold text-gray-800">Pending Join Requests</h2>
            <span className="ml-auto bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingRequests.map((req) => (
              <div key={req.userId} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-sm text-gray-800">{req.displayName || req.email || req.phoneNumber || req.userId}</p>
                  <p className="text-xs text-gray-400">{formatDate(req.requestedAt)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(req.userId)} className="px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 transition">Approve</button>
                  <button onClick={() => handleDeny(req.userId)} className="px-3 py-1.5 bg-red-100 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-200 transition">Deny</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Projects</h2>
          <button
  onClick={() => navigate("/projects/create")}
  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
>
            <PlusCircle className="w-4 h-4" /> New Project
          </button>
        </div>
        {projects.length === 0 ? (
          <div className="p-8 text-center">
            <FolderOpen className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No projects yet. Create your first project.</p>
            <button onClick={() => navigate("/projects/create")} className="mt-3 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition">
              Create Project
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {projects.map((project) => (
              <div key={project.id} onClick={() => navigate(`/projects/${project.id}`)} className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition">
                <div>
                  <p className="font-medium text-gray-800">{project.name}</p>
                  <p className="text-xs text-gray-400">{project.assignedEmployees?.length || 0} members · Created {formatDate(project.createdAt)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        )}
      </div>{/* Footer */}
<div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mt-8">

  <div className="mb-4 bg-slate-900 border border-slate-700 rounded-xl p-4">

  <p className="text-slate-400 text-xs mb-1">
    Organization Key
  </p>

  <p className="text-white font-semibold text-lg mb-3">
    {org?.uniqueKey}
  </p>

  <div className="flex gap-2">

    <button
      onClick={() => {
        navigator.clipboard.writeText(org?.uniqueKey)
        toast.success('Organization key copied')
      }}
      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 text-sm"
    >
      Copy Key
    </button>

    <button
      onClick={async () => {
        const text =
          `Join ${org?.name} on EasyTrack\n\nOrganization Key: ${org?.uniqueKey}`

        if (navigator.share) {
          await navigator.share({
            title: org?.name,
            text,
          })
        } else {
          navigator.clipboard.writeText(text)
          toast.success('Invite copied')
        }
      }}
      className="bg-surface-800 hover:bg-surface-700 text-white rounded-xl px-3 py-2 text-sm transition-colors"
    >
      Share Key
    </button>

  </div>

</div>

  <div className="grid md:grid-cols-3 gap-3">

    <button
      onClick={() => {
        localStorage.removeItem('et_orgId')
        window.location.reload()
      }}
      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3"
    >
      Switch Organization
    </button>

    <button
      onClick={() => navigate('/edit-org')}
      className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-3"
    >
      Edit Organization
    </button>

    <LogoutButton />
  </div>

</div>
    </div>
  );
}
