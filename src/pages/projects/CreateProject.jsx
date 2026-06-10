import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrg } from "../../hooks/useOrg";
import { useAuth } from "../../hooks/useAuth";
import { createProject } from "../../services/projectService";
import Button from "../../components/ui/Button";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

export default function CreateProject() {
  const { org } = useOrg();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Project name is required");
    setLoading(true);
    try {
      const project = await createProject(org.id, { name: name.trim(), description, createdBy: user.uid });
      toast.success("Project created!");
      navigate(`/projects/${project.id}`);
    } catch (error) {
  console.error("CREATE PROJECT ERROR:", error);
  toast.error(error?.message || "Failed to create project");
} finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm mb-5 transition">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-sm text-gray-400 mt-0.5">Projects help you track inventory, finances, and team activity.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Highway Bridge Construction"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this project..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
        </div>

        <Button onClick={handleCreate} loading={loading} className="w-full">
          Create Project
        </Button>
      </div>
    </div>
  );
}
