import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";

import { useOrg } from "../../hooks/useOrg";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

import FinanceEntryForm from "../features/finance/FinanceEntryForm";

import {
  subscribeToTransactions,
  getFinanceSummary,
  deleteTransaction,
} from "../../services/financeService";

export default function Finance() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] =
  useState(false);

const [transactionToDelete, setTransactionToDelete] =
  useState(null);

  const { org } = useOrg();

  const [projectName, setProjectName] =
    useState("");

  const [showAddModal, setShowAddModal] =
    useState(false);

    const [showEditModal, setShowEditModal] =
  useState(false);

const [editingTransaction, setEditingTransaction] =
  useState(null);

const [editMode, setEditMode] =
  useState(false);

  const [transactions, setTransactions] =
    useState([]);

  const [summary, setSummary] =
    useState({
      income: 0,
      expense: 0,
      balance: 0,
    });

    const [search, setSearch] =
  useState("");

const [typeFilter, setTypeFilter] =
  useState("ALL");

const [categoryFilter, setCategoryFilter] =
  useState("ALL");

const [fromDate, setFromDate] =
  useState("");

const [toDate, setToDate] =
  useState("");

  useEffect(() => {
    loadProject();
  }, [projectId]);

  async function loadProject() {
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
      console.error(err);
    }
  }

  useEffect(() => {
    if (!org?.id || !projectId) return;

    const unsub =
      subscribeToTransactions(
        org.id,
        projectId,
        (data) => {
          setTransactions(data);
        }
      );

    return unsub;
  }, [org?.id, projectId]);

  useEffect(() => {
    if (!org?.id || !projectId) return;

    async function loadSummary() {
      const data =
        await getFinanceSummary(
          org.id,
          projectId
        );

      setSummary(data);
    }

    loadSummary();
  }, [
    transactions,
    org?.id,
    projectId,
  ]);

  async function handleDeleteTransaction() {
  try {
    await deleteTransaction(
      transactionToDelete.id
    );

    setShowDeleteModal(false);
    setTransactionToDelete(null);

  } catch (err) {
    console.error(err);
  }
}

const filteredTransactions =
  [...transactions]

    .filter((t) => {

      const searchMatch =
        !search ||
        t.name
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const typeMatch =
        typeFilter === "ALL" ||
        t.type === typeFilter;

      const categoryMatch =
        categoryFilter === "ALL" ||
        t.category ===
          categoryFilter;

      const fromMatch =
        !fromDate ||
        t.date >= fromDate;

      const toMatch =
        !toDate ||
        t.date <= toDate;

      return (
        searchMatch &&
        typeMatch &&
        categoryMatch &&
        fromMatch &&
        toMatch
      );
    });

  return (
    <div className="max-w-7xl mx-auto p-6 text-gray-900">

      <button
        onClick={() =>
          navigate(`/projects/${projectId}`)
        }
        className="flex items-center gap-2 mb-6 text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="flex items-center justify-between mb-6">

        <div className="flex items-center gap-4 bg-green-100 border border-green-300 px-5 py-3 rounded-xl">

          <DollarSign
            size={32}
            className="text-green-700"
          />

          <div>
            <h1 className="text-3xl font-bold text-black">
              FINANCE
            </h1>

            <p className="text-sm font-medium text-gray-700">
              PROJECT:{" "}
              {projectName?.toUpperCase()}
            </p>
          </div>

        </div>


        <div className="flex gap-2">

  <Button
    variant="secondary"
    onClick={() =>
      setEditMode(!editMode)
    }
  >
    {editMode
      ? "Done Editing"
      : "Edit Entries"}
  </Button>

  <Button
    variant="success"
    onClick={() =>
      setShowAddModal(true)
    }
    className="flex items-center gap-2"
  >
    <Plus size={16} />
    Add Transaction
  </Button>

</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Income
          </p>

          <h2 className="text-2xl font-bold text-green-600 mt-2">
            ₹
            {summary.income.toLocaleString()}
          </h2>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Expense
          </p>

          <h2 className="text-2xl font-bold text-red-600 mt-2">
            ₹
            {summary.expense.toLocaleString()}
          </h2>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Current Balance
          </p>

          <h2 className="text-2xl font-bold text-blue-600 mt-2">
            ₹
            {summary.balance.toLocaleString()}
          </h2>
        </div>

      </div>

      <div className="bg-white border rounded-xl p-4 mb-4">

  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

    <input
      type="text"
      placeholder="Search Transaction"
      value={search}
      onChange={(e) =>
        setSearch(e.target.value)
      }
      className="border rounded-lg px-3 py-2"
    />

    <select
      value={typeFilter}
      onChange={(e) =>
        setTypeFilter(
          e.target.value
        )
      }
      className="border rounded-lg px-3 py-2"
    >
      <option value="ALL">
        All Types
      </option>

      <option value="INCOME">
        Income
      </option>

      <option value="EXPENSE">
        Expense
      </option>

    </select>

    <select
      value={categoryFilter}
      onChange={(e) =>
        setCategoryFilter(
          e.target.value
        )
      }
      className="border rounded-lg px-3 py-2"
    >

      <option value="ALL">
        All Categories
      </option>

      <option value="MATERIAL">
        Material
      </option>

      <option value="LABOUR">
        Labour
      </option>

      <option value="TRANSPORT">
        Transport
      </option>

      <option value="EQUIPMENT">
        Equipment
      </option>

      <option value="RENT">
        Rent
      </option>

      <option value="UTILITY">
        Utility
      </option>

      <option value="MAINTENANCE">
        Maintenance
      </option>

      <option value="OTHER">
        Other
      </option>

    </select>

    <input
      type="date"
      value={fromDate}
      onChange={(e) =>
        setFromDate(
          e.target.value
        )
      }
      className="border rounded-lg px-3 py-2"
    />

    <input
      type="date"
      value={toDate}
      onChange={(e) =>
        setToDate(
          e.target.value
        )
      }
      className="border rounded-lg px-3 py-2"
    />

  </div>

</div>

      <div className="bg-white border rounded-xl overflow-hidden">

        <table className="w-full">

          <thead className="bg-gray-50">

            <tr>
              <th className="p-3 text-left">
                Date
              </th>

              <th className="p-3 text-left">
                Name
              </th>

              <th className="p-3 text-left">
                Category
              </th>

              <th className="p-3 text-left">
                Type
              </th>

              <th className="p-3 text-right">
  Amount
</th>

<th className="p-3 text-center">
  Actions
</th>

{editMode && (
  <th className="p-3 text-center">
    Actions
  </th>
)}
            </tr>

          </thead>

          <tbody>

  {filteredTransactions.length === 0 && (
    <tr>
      <td
        colSpan="6"
        className="p-8 text-center text-gray-400"
      >
        No transactions found
      </td>
    </tr>
  )}

  {[...filteredTransactions]
    .sort((a, b) => {

      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);

      if (dateB.getTime() !== dateA.getTime()) {
        return dateB - dateA;
      }

      const createdA =
        a.submittedAt?.seconds || 0;

      const createdB =
        b.submittedAt?.seconds || 0;

      return createdB - createdA;
    })
    .map((t) => (

      <tr
        key={t.id}
        className="border-t"
      >

        <td className="p-3">
          {t.date
            ? (() => {
                const [year, month, day] =
                  t.date.split("-");

                return `${day}-${month}-${year}`;
              })()
            : "-"}
        </td>

        <td className="p-3">
          {t.name}
        </td>

        <td className="p-3">
          {t.category}
        </td>

        <td className="p-3">
          <span
            className={
              t.type === "INCOME"
                ? "text-green-600 font-medium"
                : "text-red-600 font-medium"
            }
          >
            {t.type}
          </span>
        </td>

        <td className="p-3 text-right font-semibold">
          ₹{Number(
            t.amount || 0
          ).toLocaleString()}
        </td>

        <td className="p-3">
          {/* Edit/Delete buttons */}
        </td>

      </tr>

    ))}

</tbody>

        </table>

      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() =>
          setShowAddModal(false)
        }
        title="Add Transaction"
        size="lg"
      >
        <FinanceEntryForm
          onSaved={() => {
            setShowAddModal(false);
          }}
        />
      </Modal>

      <Modal
  isOpen={showEditModal}
  onClose={() => {
    setShowEditModal(false);
    setEditingTransaction(null);
  }}
  title="Edit Transaction"
  size="lg"
>
  <FinanceEntryForm
    editingTransaction={
      editingTransaction
    }
    onSaved={() => {
      setShowEditModal(false);
      setEditingTransaction(null);
    }}
  />
</Modal>
<Modal
  isOpen={showDeleteModal}
  onClose={() =>
    setShowDeleteModal(false)
  }
  title="Delete Transaction"
>

  <div className="space-y-5">

    <p className="text-gray-700">
      Are you sure you want to delete
      <strong>
        {" "}
        {transactionToDelete?.name}
      </strong>
      ?
    </p>

    <div className="flex justify-end gap-3">

      <Button
        variant="secondary"
        onClick={() =>
          setShowDeleteModal(false)
        }
      >
        No
      </Button>

      <Button
        variant="danger"
        onClick={
          handleDeleteTransaction
        }
      >
        Yes
      </Button>

    </div>

  </div>

</Modal>

    </div>
  );
}
