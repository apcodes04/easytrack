import { useState } from "react";
import { Trash2 } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import { useParams } from "react-router-dom";

import InventoryEntryForm from "../../pages/features/inventory/InventoryEntryForm";

import {
  deleteEntry,
  updateEntry,
} from "../../services/inventoryService";

import { useOrg } from "../../hooks/useOrg";

export default function DynamicTable({
  columns = [],
  data = [],
  onAddColumn,
  onDelete,
  onDeleteColumn,
  onUpdateColumn,
  projectId,
  editMode = false,
}) {

  const [columnName, setColumnName] = useState("");
  const [columnType, setColumnType] = useState("string");

const [confirmDelete, setConfirmDelete] = useState(null);
const [confirmEdit, setConfirmEdit] = useState(null);
const [confirmColumnDelete, setConfirmColumnDelete] = useState(null);

const [editColumn, setEditColumn] = useState(null);
const [editedColumnName, setEditedColumnName] =
  useState("");

  const { org } = useOrg();

const { projectId: routeProjectId } = useParams();

const activeProjectId =
  projectId || routeProjectId;

  return (
    <div className="space-y-4 text-gray-900">

      {editMode && ( 
        <div className="bg-white border rounded-xl p-4">
        <div className="flex gap-2">

          <input
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            placeholder="Column Name"
            className="border rounded px-3 py-2 flex-1 text-gray-900"
          />

          <select
            value={columnType}
            onChange={(e) => setColumnType(e.target.value)}
            className="border rounded px-3 py-2 text-gray-900"
          >
            <option value="string">Text</option>
            <option value="numeric">Number</option>
          </select>

          <button
            onClick={() => {
              if (!columnName) return;

              const normalizedName =
  columnName.trim().toUpperCase();

onAddColumn({
  id: normalizedName
    .toLowerCase()
    .replaceAll(" ", "_"),
  name: normalizedName,
  dataType: columnType,
});

              setColumnName("");
            }}
            className="bg-orange-500 text-white px-4 rounded"
          >
            Add Column
          </button>

        </div>
      </div>
      )}

      <div className="overflow-auto bg-white border rounded-xl">
        <table className="w-full">

          <thead>
            <tr>

              {columns.map((col) => (
                <th
                  key={col.id}
                  className="border-b px-4 py-3 text-left text-gray-900"
                >
                  <div className="flex items-center justify-between">

  <span>{col.name}</span>

{editMode && (

  <div className="flex items-center gap-2">

    <button
      className="text-blue-500 mr-2"
      onClick={() => {
        if (
          col.id === "name" ||
          col.id === "date"
        ) {
          return;
        }

        setEditColumn(col);
        setEditedColumnName(col.name);
      }}
    >
      Edit
    </button>

    <button
      className="text-red-500"
      onClick={() => {
        if (
          col.id === "name" ||
          col.id === "date"
        ) {
          return;
        }

        setConfirmColumnDelete(col);
      }}
    >
      <Trash2 size={14} />
    </button>

  </div>

)}

</div>
                </th>
              ))}

              {editMode && (
  <th className="px-4 py-3 text-left">
    Actions
  </th>
)}

            </tr>
          </thead>

          <tbody>

            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={
  editMode
    ? columns.length + 1
    : columns.length
}
                  className="text-center py-8 text-gray-500"
                >
                  No entries yet.
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex}>

                  {columns.map((col) => {

  if (
    col.name?.includes("Quantity") ||
    col.id?.includes("quantity")
  ) {

  }

  return (
    <td
      key={col.id}
      className="border-b px-4 py-3 text-gray-900"
    >
      {(() => {

        if (
          col.id === "date" &&
          row[col.id]
        ) {
          return row[col.id]
            .split("-")
            .reverse()
            .join("-");
        }

        if (
          col.id === "quantity_remaining_" ||
          col.name === "Quantity Remaining"
        ) {
          return `${row.quantity_remaining_ || 0} ${
            row.quantity_remaining__unit || ""
          }`;
        }

        if (
          row[col.id] !== undefined &&
          row[col.id] !== null
        ) {
          return `${row[col.id]} ${
            row[`${col.id}_unit`] || ""
          }`;
        }

        return "-";
      })()}
    </td>
  );
})}

                  {editMode && (
  <td className="border-b px-4 py-3 relative z-50">

    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setConfirmEdit(row);
      }}
      className="text-blue-600 mr-3 cursor-pointer"
    >
      Edit
    </button>

    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setConfirmDelete(row);
      }}
      className="text-red-600 cursor-pointer"
    >
      Delete
    </button>

  </td>
)}

                </tr>
              ))
            )}

          </tbody>

        </table>
      </div>

      {/* DELETE CONFIRMATION */}

      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Entry"
      >
        <p>
          Are you sure you want to delete
          <strong> {confirmDelete?.name}</strong> ?
        </p>

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={() => setConfirmDelete(null)}>
            No
          </Button>

          <Button
  variant="danger"
  onClick={async () => {
    try {
      await deleteEntry(confirmDelete.id);

      if (onDelete) {
        onDelete(confirmDelete.id);
      }

      setConfirmDelete(null);
    } catch (err) {
      console.error("DELETE ERROR:", err);
      alert("Failed to delete entry.");
    }
  }}
>
  Yes
</Button>
        </div>
      </Modal>

      {/* COLUMN DELETE CONFIRMATION */}

<Modal
  isOpen={!!confirmColumnDelete}
  onClose={() => setConfirmColumnDelete(null)}
  title="Delete Column"
>
  <p>
    Are you sure you want to delete
    <strong>
      {" "}
      {confirmColumnDelete?.name}
    </strong>
    ?
  </p>

  <div className="flex justify-end gap-2 mt-4">
    <Button
      onClick={() =>
        setConfirmColumnDelete(null)
      }
    >
      No
    </Button>

    <Button
  variant="danger"
  onClick={async () => {
    try {

      await onDeleteColumn(
        confirmColumnDelete.id
      );

      setConfirmColumnDelete(null);

    } catch (err) {
      console.error(
        "COLUMN DELETE ERROR:",
        err
      );

      alert("Failed to delete column.");
    }
  }}
>
  Yes
</Button>
  </div>
</Modal>

            {/* EDIT CONFIRMATION */}

      <Modal
        isOpen={!!confirmEdit}
        onClose={() => setConfirmEdit(null)}
        title="Edit Entry"
        size="lg"
      >
        <InventoryEntryForm
          editingEntry={confirmEdit}
          onSaved={() => {
            setConfirmEdit(null);
          }}
        />
      </Modal>

      {/* COLUMN EDIT CONFIRMATION */}

      <Modal
        isOpen={!!editColumn}
        onClose={() => setEditColumn(null)}
        title="Edit Column"
      >
        <div className="space-y-3">
  <p>
    Rename column
    <strong> {editColumn?.name}</strong>
  </p>

  <input
    type="text"
    value={editedColumnName}
    onChange={(e) =>
      setEditedColumnName(e.target.value)
    }
    className="w-full border rounded px-3 py-2"
    placeholder="Enter new column name"
  />
</div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            onClick={() => setEditColumn(null)}
          >
            No
          </Button>

          <Button
  onClick={async () => {
    try {
      await onUpdateColumn(
  editColumn.id,
  {
    name: editedColumnName
      .trim()
      .toUpperCase(),
  }
);

      setEditColumn(null);
      setEditedColumnName("");

    } catch (err) {
      console.error(
        "COLUMN EDIT ERROR:",
        err
      );

      alert(
        "Failed to update column."
      );
    }
  }}
>
  Yes
</Button>
        </div>
      </Modal>

    </div>
  );
}