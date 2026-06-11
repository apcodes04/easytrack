import { useMemo, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import StepForm from "../../../components/ui/StepForm";

import { useOrg } from "../../../hooks/useOrg";
import { useAuth } from "../../../hooks/useAuth";

import {
  addTransaction,
  updateTransaction,
  getExistingTransactionNames,
} from "../../../services/financeService";


export default function FinanceEntryForm({
  onSaved,
  editingTransaction = null,
}) {
  const { projectId } = useParams();


    const [nameSuggestions, setNameSuggestions] =
  useState([]);
  

  const { org, isManager, isAsstManager } =
  useOrg();

const { user } = useAuth();

useEffect(() => {

  async function loadNames() {

    if (!org?.id || !projectId) return;

    const names =
      await getExistingTransactionNames(
        org.id,
        projectId
      );

    setNameSuggestions(names);
  }

  loadNames();

}, [org?.id, projectId]);

const steps = useMemo(
    () => [
      {
        title: "Date",
        field: "date",
        type: "date",
        required: true,
      },

     {
  title: "Transaction Name",
  field: "name",
  type: "dropdown",
  required: true,
  options: nameSuggestions,
  placeholder:
    "Sender's Name / Reciever's Name",
},

      {
        title: "Category",
        field: "category",
        type: "dropdown",
        required: true,
        options: [
          "MATERIAL",
          "LABOUR",
          "TRANSPORT",
          "EQUIPMENT",
          "RENT",
          "UTILITY",
          "MAINTENANCE",
          "OTHER",
        ],
      },

      {
  title: "Type",
  field: "type",
  type: "select",
  required: true,
  options: [
    {
      label: "Expense",
      value: "EXPENSE",
    },
    {
      label: "Income",
      value: "INCOME",
    },
  ],
},

      {
        title: "Amount",
        field: "amount",
        type: "number",
        required: true,
      },

      {
        title: "Vendor / Party",
        field: "vendor",
        type: "text",
        required: false,
      },

      {
        title: "Notes",
        field: "notes",
        type: "textarea",
        required: false,
      },
    ],
    [nameSuggestions]
  );



  async function handleSubmit(values) {

  console.log(
    "ORG:",
    org
  );

  console.log(
    "PROJECT:",
    projectId
  );

  console.log(
    "USER:",
    user
  );

  console.log(
    "VALUES:",
    values
  );

  console.log(
    "FINANCE SUBMIT FIRED"
  );

  const finalData = {
      ...values,

      name:
        values.name
          ?.trim()
          .toUpperCase() || "",

      category:
        values.category
          ?.trim()
          .toUpperCase() || "",

      type:
        values.type
          ?.trim()
          .toUpperCase() || "",

      vendor:
        values.vendor
          ?.trim()
          .toUpperCase() || "",

      amount: Number(
        values.amount || 0
      ),
    };

    try {
      if (editingTransaction) {
        await updateTransaction(
          editingTransaction.id,
          finalData
        );
      } else {
        await addTransaction(
          org.id,
          projectId,
          finalData,
          user.uid,
          isManager || isAsstManager
        );
      }

      console.log(
        "FINANCE SAVE SUCCESS"
      );

      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      console.error(
        "FINANCE SAVE ERROR:",
        err
      );

      alert(
        err.message ||
          "Failed to save transaction."
      );
    }
  }

  return (
    <StepForm
      steps={steps}
      orgId={org?.id}
      projectId={projectId}
      initialValues={
        editingTransaction || {}
      }
      submitLabel={
        editingTransaction
          ? "Update Transaction"
          : "Save Transaction"
      }
      onComplete={handleSubmit}
    />
  );
}