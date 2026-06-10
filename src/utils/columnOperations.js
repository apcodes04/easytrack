// src/utils/columnOperations.js

// Supported operations between two numeric columns → produces a derived column
export const OPERATIONS = [
  { value: 'subtract', label: 'A − B  (e.g. Remaining = Received − Used)' },
  { value: 'add',      label: 'A + B  (e.g. Total = Qty1 + Qty2)' },
  { value: 'multiply', label: 'A × B  (e.g. Cost = Price × Qty)' },
  { value: 'divide',   label: 'A ÷ B  (e.g. Rate = Total ÷ Units)' },
]

export function applyOperation(op, a, b) {
  const numA = parseFloat(a) || 0
  const numB = parseFloat(b) || 0
  switch (op) {
    case 'subtract': return numA - numB
    case 'add':      return numA + numB
    case 'multiply': return numA * numB
    case 'divide':   return numB !== 0 ? +(numA / numB).toFixed(3) : 0
    default:         return 0
  }
}

// Given a list of column definitions and a row object, compute derived columns
export function computeDerivedColumns(columns, row) {
  const result = { ...row }
  columns
    .filter(c => c.dataType === 'derived' && c.operandA && c.operandB && c.operation)
    .forEach(c => {
      result[c.id] = applyOperation(c.operation, row[c.operandA], row[c.operandB])
    })
  return result
}

// Sum a numeric column across all rows
export function sumColumn(rows, colId) {
  return rows.reduce((acc, r) => acc + (parseFloat(r[colId]) || 0), 0)
}
