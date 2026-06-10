import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { useOrg } from "../../../hooks/useOrg";
import { useAuth } from "../../../hooks/useAuth";

import StepForm from "../../../components/ui/StepForm";

import {
  getColumns,
  addEntry,
  updateEntry,
  getExistingItemNames,
  getExistingUnits,
  getFormulas,
} from "../../../services/inventoryService";


export default function InventoryEntryForm({ onSaved, editingEntry = null, }) {
  const { projectId } = useParams();

  const { org, isManager, isAsstManager } = useOrg();
  const { user } = useAuth();

  const [steps, setSteps] = useState([]);
  const [formulas, setFormulas] =
  useState([]);

  useEffect(() => {
    if (!org) return;

    
    load();
  }, [org, projectId]);

  async function load() {
  const cols = await getColumns(
    org.id,
    projectId
  );

  const savedFormulas =
    await getFormulas(
      org.id,
      projectId
    );

  setFormulas(savedFormulas);


  const names = [
    ...new Set(
      (
        await getExistingItemNames(
          org.id,
          projectId
        )
      )
        .filter(Boolean)
        .map((n) =>
          n.trim().toUpperCase()
        )
    ),
  ];


  const dynamicSteps = [
    {
      title: "Date",
      field: "date",
      type: "date",
      required: true,
    },

    {
      title: "Name",
      field: "name",
      type: "dropdown",
      required: true,
      options: names,
    },

    ...cols
  .filter(
    (c) =>
      c.id !== "date" &&
      c.id !== "name"
  )
  .map((c) => ({
  title: c.name,
  field: c.id,
  required: false,

  type:
    c.dataType === "numeric"
      ? "number_with_unit"
      : "text",

  hint: formulas.some(
    (f) =>
      f.resultColumn === c.id
  )
    ? "Auto calculated. You may override if needed."
    : "",
})),
  ];

  console.log("Columns:", cols);
  console.log(
    "NAMES ARRAY:",
    JSON.stringify(names)
  );

  setSteps(dynamicSteps);
}

  async function handleSubmit(values) {

  const finalValues = {
    ...values,
    name: values.name
      ?.trim()
      .toUpperCase(),
  };

  formulas.forEach((formula) => {

  if (
    !formula.leftColumn ||
    !formula.rightColumn ||
    !formula.resultColumn
  ) {
    return;
  }

  const left =
    Number(
      finalValues[
        formula.leftColumn
      ] || 0
    );

  const right =
    Number(
      finalValues[
        formula.rightColumn
      ] || 0
    );

  let result = 0;

  if (formula.operator === "+")
    result = left + right;

  if (formula.operator === "-")
    result = left - right;

  if (formula.operator === "*")
    result = left * right;

  if (formula.operator === "/")
    result =
      right === 0
        ? 0
        : left / right;

  finalValues[
    formula.resultColumn
  ] = result;

  finalValues[
    `${formula.resultColumn}_unit`
  ] =
    finalValues[
      `${formula.leftColumn}_unit`
    ] || "";

});

console.log(
  editingEntry
    ? "Updating Entry:"
    : "Saving Entry:",
  finalValues
);

Object.keys(finalValues).forEach((key) => {
  if (key.endsWith("_unit")) {
    finalValues[key] =
      finalValues[key]
        ?.trim()
        .toUpperCase() || "";
  }
});
  console.log(
    "FINAL VALUES WITH FORMULAS:",
    finalValues
  );

  if (editingEntry) {

    await updateEntry(
      editingEntry.id,
      finalValues
    );

  } else {

    await addEntry(
      org.id,
      projectId,
      finalValues,
      user.uid,
      isManager || isAsstManager
    );
  }

  if (onSaved) {
    onSaved();
  }
}

  if (steps.length === 0) {
  return (
    <div className="p-6 text-center text-gray-500">
      Loading form...
    </div>
  );
}

return (
  <StepForm
  steps={steps}
  orgId={org.id}
  projectId={projectId}
  initialValues={editingEntry || {}}
  submitLabel={
    editingEntry
      ? "Update Entry"
      : "Save Entry"
  }
  onComplete={handleSubmit}
/>
);
}