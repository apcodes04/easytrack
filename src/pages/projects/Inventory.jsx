import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Package
} from "lucide-react";

import DynamicTable from "../../components/ui/DynamicTable";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";

import InventoryEntryForm from "../features/inventory/InventoryEntryForm";

import { useOrg } from "../../hooks/useOrg";

import {
  getColumns,
  saveColumns,
  subscribeToEntries,
  deleteColumn,
  updateColumn,
} from "../../services/inventoryService";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

import SchemaBuilder from "../features/inventory/SchemaBuilder";


export default function Inventory() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { org } = useOrg();

  const [columns, setColumns] = useState([]);
  const [entries, setEntries] = useState([]);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [projectName, setProjectName] = useState("");

const [
  showSchemaBuilder,
  setShowSchemaBuilder,
] = useState(false);

const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!org) return;

    loadColumns();
    loadProjectName();

console.log("SUBSCRIBING WITH:", {
  orgId: org.id,
  projectId,
});

console.log("SUBSCRIBING:", org.id, projectId);

    const unsub = subscribeToEntries(
      org.id,
      projectId,
      (data) => {
        console.log(
  "LAST ENTRY:",
  JSON.stringify(
    data?.[data.length - 1],
    null,
    2
  )
);
        //console.log("LIVE ENTRIES LENGTH:", data?.length);
        setEntries(
  [...(data || [])].sort((a, b) => {
    const dateA = a.date || "";
    const dateB = b.date || "";

    if (dateA !== dateB) {
      return new Date(dateB) - new Date(dateA);
    }

    return (
      (b.createdAt?.seconds || 0) -
      (a.createdAt?.seconds || 0)
    );
  })
);
      }
    );

    return () => unsub && unsub();
  }, [org, projectId]);

  async function loadColumns() {
  const cols = await getColumns(org.id, projectId);

  const uniqueCols = cols.filter(
    (col, index, self) =>
      index === self.findIndex((c) => c.id === col.id)
  );

  console.log("LOADED COLUMNS:", uniqueCols);

  setColumns(uniqueCols);
}

async function loadProjectName() {
  try {
    const snap = await getDoc(
      doc(db, "projects", projectId)
    );

    if (snap.exists()) {
      setProjectName(
        snap.data().name || ""
      );
    }
  } catch (err) {
    console.error(
      "PROJECT LOAD ERROR:",
      err
    );
  }
}

async function handleDeleteColumn(columnId) {

  console.log(
    "Inventory.jsx received:",
    columnId
  );

  await deleteColumn(
    org.id,
    projectId,
    columnId
  );

  console.log(
    "Firestore delete completed"
  );

  loadColumns();
}

async function handleUpdateColumn(
  columnId,
  updates
) {
  await updateColumn(
    org.id,
    projectId,
    columnId,
    updates
  );

  loadColumns();
}

  async function handleAddColumn(newColumn) {
    const updated = [...columns, newColumn];

    await saveColumns(
      org.id,
      projectId,
      updated
    );

    setColumns(updated);
  }

  return (
    <div className="max-w-7xl mx-auto p-6 text-gray-900">

      <button
  onClick={() => navigate(`/projects/${projectId}`)}
  className="flex items-center gap-2 mb-6 text-gray-500 hover:text-gray-800"
>
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="flex items-center justify-between mb-6">

  <div className="flex items-center gap-4 bg-yellow-100 border border-yellow-300 px-5 py-3 rounded-xl">

    <Package
      size={32}
      className="text-yellow-700"
    />

    <div>
      <h1 className="text-3xl font-bold text-black">
        INVENTORY
      </h1>

      <p className="text-sm font-medium text-gray-700">
        PROJECT: {projectName?.toUpperCase()}
      </p>
    </div>

  </div>

  <div className="flex gap-2">

    <Button
      onClick={() =>
        setShowSchemaBuilder(true)
      }
    >
      Build Column Schemas
    </Button>

    <Button
      variant="success"
      onClick={() => setShowEntryModal(true)}
      className="flex items-center gap-2"
    >
      <Plus size={16} />
      Add Entry
    </Button>

    <Button
      variant={
        isEditing
          ? "success"
          : "danger"
      }
      onClick={() =>
        setIsEditing((prev) => !prev)
      }
    >
      {isEditing
        ? "Done Editing"
        : "Edit Entries"}
    </Button>

  </div>

</div>

      <DynamicTable
  columns={[
    {
      id: "date",
      name: "DATE",
    },
    {
      id: "name",
      name: "NAME",
    },
    ...columns.filter(
      (c) =>
        c.id !== "date" &&
        c.id !== "name"
    ),
  ]}
  data={entries}
  onAddColumn={handleAddColumn}
  onDelete={(deletedId) => {
    setEntries((prev) =>
      prev.filter((entry) => entry.id !== deletedId)
    );
  }}
  onDeleteColumn={handleDeleteColumn}
  onUpdateColumn={handleUpdateColumn}
  projectId={projectId}
  editMode={isEditing}
/>

      <Modal
  isOpen={showEntryModal}
  onClose={() => setShowEntryModal(false)}
  title="Add Inventory Entry"
  size="lg"
>
  <InventoryEntryForm
    onSaved={() => {
      setShowEntryModal(false);
    }}
  />
</Modal>

<Modal
  isOpen={showSchemaBuilder}
  onClose={() =>
    setShowSchemaBuilder(false)
  }
  title="Build Column Schemas"
  size="lg"
>
  <SchemaBuilder
    columns={columns}
  />
</Modal>

    </div>
  );
}