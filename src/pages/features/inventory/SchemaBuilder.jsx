import {
  useState,
  useEffect,
} from "react";

import Button from "../../../components/ui/Button";

import {
  getFormulas,
  saveFormulas,
} from "../../../services/inventoryService";

import { useOrg } from "../../../hooks/useOrg";
import { useParams } from "react-router-dom";

export default function SchemaBuilder({
  columns = [],
}) {

  const { org } = useOrg();

  const { projectId } =
    useParams();

  const [schemas, setSchemas] =
  useState([]);

useEffect(() => {
  loadSchemas();
}, [org, projectId]);

async function loadSchemas() {
  if (!org) return;

  const formulas =
    await getFormulas(
      org.id,
      projectId
    );


  setSchemas(formulas);
}

function addSchema() {
  setSchemas((prev) => [
    ...prev,
    {
      id: Date.now(),
      leftColumn: "",
      operator: "-",
      rightColumn: "",
      resultColumn: "",
    },
  ]);
}

async function saveAllSchemas() {
  if (!org) return;

  await saveFormulas(
    org.id,
    projectId,
    schemas
  );

  alert(
    "Formula schemas saved successfully."
  );

  loadSchemas();
}


  return (
    <div className="space-y-4">

      <Button
  variant="success"
  onClick={addSchema}
>
  Build Column Schemas
</Button>

<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <h3 className="font-semibold">
    How Formula Schemas Work
  </h3>

  <ul className="list-disc ml-5 mt-2 text-sm">
    <li>
      First create columns using
      Add Column.
    </li>

    <li>
      Example:
      Quantity Received,
      Quantity Used,
      Quantity Remaining.
    </li>

    <li>
      Then create a formula.
    </li>

    <li>
      Example:
      Quantity Received
      -
      Quantity Used
      =
      Quantity Remaining
    </li>

    <li>
      The result column must
      already exist.
    </li>

    <li>
      Calculated values will
      auto-fill during entry.
    </li>

    <li>
      Users can later override
      the calculated value if needed.
    </li>
  </ul>
</div>

      {schemas.map((schema) => (
        <div
          key={schema.id}
          className="border rounded-lg p-4 space-y-3"
        >

          <select
            value={schema.leftColumn}
            onChange={(e) =>
              setSchemas((prev) =>
                prev.map((s) =>
                  s.id === schema.id
                    ? {
                        ...s,
                        leftColumn:
                          e.target.value,
                      }
                    : s
                )
              )
            }
            className="w-full border p-2 rounded"
          >
            <option value="">
              First Column
            </option>

            {columns.map((col) => (
              <option
                key={col.id}
                value={col.id}
              >
                {col.name}
              </option>
            ))}
          </select>

          <select
            value={schema.operator}
            onChange={(e) =>
              setSchemas((prev) =>
                prev.map((s) =>
                  s.id === schema.id
                    ? {
                        ...s,
                        operator:
                          e.target.value,
                      }
                    : s
                )
              )
            }
            className="w-full border p-2 rounded"
          >
            <option value="+">
              +
            </option>

            <option value="-">
              -
            </option>

            <option value="*">
              *
            </option>

            <option value="/">
              /
            </option>
          </select>

          <select
            value={schema.rightColumn}
            onChange={(e) =>
              setSchemas((prev) =>
                prev.map((s) =>
                  s.id === schema.id
                    ? {
                        ...s,
                        rightColumn:
                          e.target.value,
                      }
                    : s
                )
              )
            }
            className="w-full border p-2 rounded"
          >
            <option value="">
              Second Column
            </option>

            {columns.map((col) => (
              <option
                key={col.id}
                value={col.id}
              >
                {col.name}
              </option>
            ))}
          </select>

          <select
  value={schema.resultColumn}
  onChange={(e) =>
    setSchemas((prev) =>
      prev.map((s) =>
        s.id === schema.id
          ? {
              ...s,
              resultColumn:
                e.target.value,
            }
          : s
      )
    )
  }
  className="w-full border p-2 rounded"
>
  <option value="">
    Result Column
  </option>

  {columns.map((col) => (
    <option
      key={col.id}
      value={col.id}
    >
      {col.name}
    </option>
  ))}
</select>

        </div>
      ))}


    <Button
  variant="success"
  onClick={saveAllSchemas}
>
  Save Formula Schemas
</Button>

</div>
);
}
