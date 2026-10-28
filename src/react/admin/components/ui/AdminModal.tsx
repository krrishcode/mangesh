import { useRef, type ReactNode } from "react";
import { Dialog } from "radix-ui";
import { AdminIcon } from "./AdminIcon";
import { useAdminTheme } from "./admin-theme-context";
interface AdminModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string | number;
  busy?: boolean;
  variant?: "dialog" | "sheet";
  side?: "left" | "right";
  description?: string;
}
export function AdminModal({
  title,
  isOpen,
  onClose,
  children,
  footer,
  maxWidth,
  busy = false,
  variant = "dialog",
  side = "right",
  description,
}: AdminModalProps) {
  const { portal } = useAdminTheme();
  const previousFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Dialog.Portal container={portal}>
        <Dialog.Overlay className="admin-modal-overlay" />
        <Dialog.Content
          className={`admin-modal ${variant === "sheet" ? `admin-sheet ${side === "left" ? "admin-sheet-left" : ""}` : ""}`}
          style={maxWidth ? { width: maxWidth } : undefined}
          aria-busy={busy}
          {...(!description ? { "aria-describedby": undefined } : {})}
          onOpenAutoFocus={() => {
            previousFocus.current = document.activeElement as HTMLElement;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (previousFocus.current?.isConnected)
              previousFocus.current.focus({ preventScroll: true });
          }}
          onEscapeKeyDown={(event) => {
            if (busy) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <header className="admin-modal-header">
            <div>
              <Dialog.Title asChild>
                <h2>{title}</h2>
              </Dialog.Title>
              {description && (
                <Dialog.Description className="admin-helper">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="admin-icon-button"
                aria-label="Close dialog"
                disabled={busy}
              >
                <AdminIcon name="close" />
              </button>
            </Dialog.Close>
          </header>
          <fieldset className="admin-modal-fields" disabled={busy}>
            <div className="admin-modal-body">{children}</div>
            {footer && <footer className="admin-modal-footer">{footer}</footer>}
          </fieldset>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
