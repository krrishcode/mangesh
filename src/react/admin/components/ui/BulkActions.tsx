import { useState, type FormEvent } from "react";
import { fetchApi } from "../../../../lib/api";
import type { AdminRecordKind } from "../../../../lib/admin-records";
import type { LifecycleRecord } from "./RecordLifecycle";
import { AdminModal } from "./AdminModal";
import { FormField } from "./FormField";

type Operation = "archive" | "restore" | "delete" | "activate" | "deactivate" | "approve" | "reject";
const options: Record<AdminRecordKind, Operation[]> = {
  products: ["activate", "deactivate", "delete"],
  categories: ["delete"],
  orders: ["archive", "restore"],
  payments: ["archive", "restore"],
  customers: ["archive", "restore"],
  appointments: ["archive", "restore"],
  reviews: ["approve", "reject", "delete"],
};

export function BulkActions({ kind, rows, onFinished, onClear }: {
  kind: AdminRecordKind; rows: LifecycleRecord[]; onFinished: (ids: number[]) => void; onClear: () => void;
}) {
  const [operation, setOperation] = useState<Operation | "">("");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const needsReason = operation !== "approve" && operation !== "reject";
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!operation || busy || !rows.length || (needsReason && reason.trim().length < 5) || (operation === "delete" && confirmation !== "DELETE")) return;
    setBusy(true);
    setErrors([]);
    const succeeded: number[] = [];
    const failures: string[] = [];
    for (const row of rows) {
      try {
        if (operation === "approve" || operation === "reject") {
          await fetchApi(`/admin/reviews/${row.id}/status`, { method: "PATCH", body: JSON.stringify({ status: operation === "approve" ? "approved" : "rejected" }) });
        } else {
          await fetchApi(`/admin/records/${kind}/${row.id}${operation === "delete" ? "" : `/${operation}`}`, {
            method: operation === "delete" ? "DELETE" : "POST",
            body: JSON.stringify({ reason: reason.trim(), ...(operation === "delete" ? { confirmation } : {}) }),
          });
        }
        succeeded.push(row.id);
      } catch (error) {
        failures.push(`#${row.id}: ${error instanceof Error ? error.message : "Unable to complete this action."}`);
      }
    }
    setBusy(false);
    setOpen(false);
    setResult(`${succeeded.length} of ${rows.length} records updated.${failures.length ? ` ${failures.length} could not be updated and remain selected.` : ""}`);
    setErrors(failures);
    setReason("");
    setConfirmation("");
    onFinished(succeeded);
  }
  return <>
    {(result || errors.length > 0) && <div className={errors.length ? "admin-error-notice" : "admin-success-notice"} role="status"><div>{result}{errors.length > 0 && <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul>}</div><button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => { setResult(""); setErrors([]); }}>Dismiss</button></div>}
    {rows.length > 0 && <div className="admin-bulk-bar">
      <span aria-live="polite">{rows.length} selected</span>
      <select aria-label="Bulk action" value={operation} onChange={(event) => setOperation(event.target.value as Operation | "")}><option value="">Bulk actions</option>{options[kind].map((option) => <option key={option} value={option}>{option[0].toUpperCase() + option.slice(1)}</option>)}</select>
      <button type="button" className="admin-btn admin-btn-primary admin-btn-sm" disabled={!operation} onClick={() => { setResult(""); setErrors([]); setOpen(true); }}>Apply</button>
      <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={onClear}>Clear selection</button>
    </div>}
    <AdminModal title={`${operation ? operation[0].toUpperCase() + operation.slice(1) : "Update"} ${rows.length} selected ${kind}?`} isOpen={open} busy={busy} onClose={() => setOpen(false)}>
      <form onSubmit={submit} className="admin-record-confirmation">
        <p className="admin-record-explanation">{operation === "delete" ? "This permanently removes eligible records and cannot be undone." : "Each record is checked individually against the existing rules. Records that cannot be updated will remain selected."}</p>
        {needsReason && <FormField label="Reason"><textarea required minLength={5} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain this change for the activity record." /></FormField>}
        {operation === "delete" && <FormField label="Type DELETE to confirm"><input required pattern="DELETE" autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></FormField>}
        <div className="admin-page-actions"><button type="button" className="admin-btn admin-btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className={`admin-btn ${operation === "delete" ? "admin-btn-danger" : "admin-btn-primary"}`} disabled={busy || (needsReason && reason.trim().length < 5) || (operation === "delete" && confirmation !== "DELETE")}>{busy ? "Updating…" : "Confirm action"}</button></div>
      </form>
    </AdminModal>
  </>;
}
