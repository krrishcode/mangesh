import { useState, type FormEvent } from "react";
import { useAdminAuthStore } from "../../../../stores/adminAuthStore";
import { FormField } from "../ui/FormField";
export function AdminLoginView({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/account/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to sign in. Please try again.");
      if (result.data?.user?.role !== "admin" || !result.data.token)
        throw new Error("Use an administrator account to sign in.");
      useAdminAuthStore.getState().setAuth(result.data.user, result.data.token);
      onSuccess();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-login">
      <main className="admin-login-panel">
        <span className="admin-brand-mark">M</span>
        <h1>Store administration</h1>
        <p>Sign in to manage your store.</p>
        <form onSubmit={submit}>
          <fieldset disabled={busy} className="admin-modal-fields">
            <FormField label="Email address">
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </FormField>
            <FormField label="Password">
              <input
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </FormField>
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={visible}
                onChange={(event) => setVisible(event.target.checked)}
              />
              Show password
            </label>
            {error && (
              <p className="admin-error-notice" role="alert">
                {error}
              </p>
            )}
            <button className="admin-btn admin-btn-primary" type="submit">
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </fieldset>
        </form>
        <a href="/" className="admin-text-link">
          Return to storefront
        </a>
      </main>
    </div>
  );
}
