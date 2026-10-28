import { useId, useState, type FormEvent } from "react";
import { fetchApi } from "../../../../lib/api";
import {
  ADMIN_RECORDS,
  type AdminRecordKind,
  type AdminRecordAction,
  type RecordLifecycle,
} from "../../../../lib/admin-records";
import { AdminError, useAdminAction } from "../../useAdminData";
import { AdminModal } from "./AdminModal";
import { FormField } from "./FormField";

export interface LifecycleRecord {
  id: number;
  lifecycle?: RecordLifecycle;
  isActive?: boolean;
}

export function useRecordLifecycle(kind: AdminRecordKind, reload: () => void) {
  const action = useAdminAction();
  const hintId = useId();
  const [view, setView] = useState("current");
  const [selected, setSelected] = useState<{
    row: LifecycleRecord;
    label: string;
    action: AdminRecordAction;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const noun = ADMIN_RECORDS[kind];
  const permanent = selected?.action === "delete";
  const operation = selected?.action ?? "archive";
  const operationLabel = operation.charAt(0).toUpperCase() + operation.slice(1);
  const blocked =
    selected?.action === "delete"
      ? selected.row.lifecycle?.deleteBlocked
      : selected?.action === "archive"
        ? selected.row.lifecycle?.archiveBlocked
        : null;
  function open(
    row: LifecycleRecord,
    label: string,
    operation: AdminRecordAction,
  ) {
    action.clearError();
    setMessage("");
    setReason("");
    setConfirmation("");
    setSelected({ row, label, action: operation });
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected || blocked) return;
    await action.run(async () => {
      await fetchApi(
        `/admin/records/${kind}/${selected.row.id}${permanent ? "" : "/" + selected.action}`,
        {
          method: permanent ? "DELETE" : "POST",
          body: JSON.stringify({
            reason: reason.trim(),
            ...(permanent ? { confirmation } : {}),
          }),
        },
      );
      setMessage(
        `${selected.label} ${selected.action === "archive" ? "archived" : selected.action === "restore" ? "restored" : selected.action === "delete" ? "deleted" : selected.action === "activate" ? "activated" : "deactivated"}.`,
      );
      setSelected(null);
      reload();
    });
  }
  return {
    setView,
    matches: (row: LifecycleRecord) =>
      view === "all" ||
      (view === "archived") === Boolean(row.lifecycle?.archivedAt),
    filter: (
      <select
        aria-label="Record visibility"
        value={view}
        onChange={(event) => setView(event.target.value)}
      >
        <option value="current">Current records</option>
        <option value="archived">Archived records</option>
        <option value="all">All records</option>
      </select>
    ),
    notice: message ? (
      <p className="admin-success-notice" role="status">
        {message}
      </p>
    ) : null,
    marker: (row: LifecycleRecord) =>
      row.lifecycle?.archivedAt ? (
        <small className="admin-cell-secondary">Archived</small>
      ) : null,
    actions: (row: LifecycleRecord, label: string) =>
      row.lifecycle ? (
        <>
          {kind === "products" && (
            <button
              type="button"
              className="admin-btn admin-btn-ghost admin-btn-sm"
              onClick={() =>
                open(row, label, row.isActive ? "deactivate" : "activate")
              }
            >
              {row.isActive ? "Deactivate" : "Activate"}
            </button>
          )}
          {row.lifecycle.supportsArchive && (
            <button
              type="button"
              className="admin-btn admin-btn-ghost admin-btn-sm"
              aria-label={`${row.lifecycle.archivedAt ? "Restore" : "Archive"} ${label}`}
              onClick={() =>
                open(
                  row,
                  label,
                  row.lifecycle!.archivedAt ? "restore" : "archive",
                )
              }
            >
              {row.lifecycle.archivedAt ? "Restore" : "Archive"}
            </button>
          )}
          {row.lifecycle.supportsDelete && (
            <button
              type="button"
              className="admin-btn admin-btn-danger admin-btn-sm"
              aria-label={`Delete ${label}`}
              onClick={() => open(row, label, "delete")}
            >
              Delete
            </button>
          )}
        </>
      ) : null,
    dialog: (
      <AdminModal
        title={`${operationLabel} ${noun}?`}
        isOpen={Boolean(selected)}
        busy={action.busy}
        onClose={() => setSelected(null)}
      >
        <form onSubmit={submit} className="admin-record-confirmation">
          <p className="admin-strong">{selected?.label}</p>
          {blocked ? (
            <p className="admin-record-explanation">{blocked}</p>
          ) : (
            <>
              <p className="admin-record-explanation" id={hintId}>
                {permanent
                  ? "This permanently removes the record and cannot be undone."
                  : operation === "activate"
                    ? "This product will become available in the storefront."
                    : operation === "deactivate"
                      ? "This product will be hidden from the storefront and cannot be purchased. Existing orders and wishlists are retained."
                      : operation === "restore"
                        ? "This record will return to the current admin list."
                        : kind === "customers"
                          ? "This customer will move to the admin archive. Their account stays active and their purchase history is retained."
                          : "This record will move to the admin archive. Customer history, accounting totals and related records are retained. You can restore it later."}
              </p>
              <FormField label="Reason">
                <textarea
                  required
                  minLength={5}
                  maxLength={500}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  aria-describedby={hintId}
                  placeholder="Briefly explain this change for the activity record."
                />
              </FormField>
              {permanent && (
                <FormField label="Type DELETE to confirm">
                  <input
                    required
                    autoComplete="off"
                    spellCheck={false}
                    pattern="DELETE"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                  />
                </FormField>
              )}
            </>
          )}
          {action.error && <AdminError message={action.error} />}
          <div className="admin-page-actions">
            <button
              type="button"
              autoFocus
              className="admin-btn admin-btn-secondary"
              onClick={() => setSelected(null)}
            >
              {blocked ? "Close" : "Keep unchanged"}
            </button>
            {!blocked && (
              <button
                type="submit"
                className={`admin-btn ${permanent ? "admin-btn-danger" : "admin-btn-primary"}`}
                disabled={
                  action.busy ||
                  reason.trim().length < 5 ||
                  (permanent && confirmation !== "DELETE")
                }
              >
                {action.busy ? "Saving…" : `${operationLabel} ${noun}`}
              </button>
            )}
          </div>
        </form>
      </AdminModal>
    ),
  };
}
