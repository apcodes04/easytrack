import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useOrg } from "../../../hooks/useOrg";
import {
  getMaterialProfiles,
  addMaterialProfile,
  deleteMaterialProfile,
} from "../../../services/inventoryService";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import toast from "react-hot-toast";
import { Plus, Trash2, Package } from "lucide-react";

export default function MaterialProfiles() {
  const { projectId } = useParams();
  const { org } = useOrg();
  const [profiles, setProfiles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", unit: "" });
  const [loading, setLoading] = useState(false);

  const scopeId = `${org?.id}_${projectId}`;

  useEffect(() => {
    if (!org) return;
    getMaterialProfiles(scopeId).then(setProfiles);
  }, [scopeId]);

  const handleAdd = async () => {
    if (!form.name.trim()) return toast.error("Material name required");
    setLoading(true);
    try {
      const p = await addMaterialProfile(scopeId, form);
      setProfiles((prev) => [...prev, p]);
      setForm({ name: "", unit: "" });
      setShowModal(false);
      toast.success("Material profile added!");
    } catch {
      toast.error("Failed to add profile");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMaterialProfile(scopeId, id);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      toast.success("Profile deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Material Profiles</h1>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Material
        </Button>
      </div>

      <p className="text-sm text-gray-500">
        Material profiles appear as dropdown options when adding inventory entries.
      </p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {profiles.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No material profiles yet.</p>
          </div>
        ) : (
          profiles.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-gray-800">{p.name}</p>
                {p.unit && <p className="text-xs text-gray-400">Unit: {p.unit}</p>}
              </div>
              <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Material Profile">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Cement, Steel Pipes, Sand"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="e.g. kg, bags, pieces, liters"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
            <Button onClick={handleAdd} loading={loading} className="flex-1">Add Profile</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
