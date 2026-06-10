import { useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { updateOrganizationName } from "@/services/orgService";

export default function EditOrganization() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();

  const [name, setName] = useState(
  currentOrg?.name || ""
);

async function handleSave() {
  try {
    await updateOrganizationName(
      currentOrg.id,
      name
    );

    toast.success(
      "Organization updated"
    );
  } catch (err) {
    toast.error(
      "Failed to update organization"
    );
  }
}
  

  return (
  <div className="max-w-3xl mx-auto px-4 py-6">

    <button
      onClick={() => navigate("/")}
      className="flex items-center gap-2 mb-4 text-gray-600 hover:text-gray-900"
    >
      <ArrowLeft size={18} />
      Back
    </button>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">

        <h1 className="text-xl font-bold text-black mb-6">
          Edit Organization
        </h1>

        <div className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Organization Name
            </label>

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              className="w-full border rounded-lg px-4 py-3 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Organization Key
            </label>

            <input
              value={currentOrg?.uniqueKey || ""}
              disabled
              className="w-full border rounded-lg px-4 py-3 bg-gray-100 text-black"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg"
          >
            Save Changes
          </button>

          <button
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Trash2 size={18} />
            Delete Organization
          </button>

        </div>
      </div>
    </div>
  );
}