import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { fetchApi } from "../../../../lib/api";
import { AdminError } from "../../useAdminData";
import { startAdminRead } from "../../adminRead";
import { AdminPage } from "../ui/AdminPage";
import { FormField } from "../ui/FormField";
type Policy = { currency: string; codEnabled: boolean };
export function SettingsView() {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const retire = useRef<(() => void) | null>(null);
  const load = useCallback(() => {
    retire.current?.();
    setLoading(true);
    setError("");
    retire.current = startAdminRead<{
      data: { settingKey: string; value: string }[];
      policy: Policy;
    }>("/admin/settings", {
      success: (result) => {
        const values = Object.fromEntries(
          result.data.map((item) => [item.settingKey, item.value]),
        );
        setSettings(values);
        setSaved(values);
        setPolicy(result.policy);
      },
      error: (reason) =>
        setError(
          reason instanceof Error ? reason.message : "Unable to load settings.",
        ),
      settled: () => setLoading(false),
    });
  }, []);
  useEffect(() => {
    load();
    return () => retire.current?.();
  }, [load]);
  const dirty = Object.fromEntries(
    Object.entries(settings ?? {}).filter(
      ([key, value]) => value !== saved[key],
    ),
  );
  const change = (key: string, value: string) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setSuccess("");
  };
  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving || !Object.keys(dirty).length) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await fetchApi("/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ settings: dirty }),
      });
      setSaved({ ...settings });
      setSuccess("Settings saved.");
      window.dispatchEvent(new Event("admin-settings-updated"));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to save settings.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <form onSubmit={save}>
      <AdminPage
        title="Settings"
        description="Store details, delivery charges and inventory alerts."
        actions={
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={loading || saving || !Object.keys(dirty).length}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        }
      >
        {error && (
          <AdminError message={error} retry={!settings ? load : undefined} />
        )}
        {success && (
          <p className="admin-success-notice" role="status">
            {success}
          </p>
        )}
        {loading ? (
          <p role="status" className="admin-muted">
            Loading store settings…
          </p>
        ) : (
          settings && (
            <fieldset
              disabled={saving}
              className="admin-settings-form admin-modal-fields"
            >
              <section className="admin-card">
                <h2>Store profile</h2>
                <div className="admin-form-grid">
                  {[
                    {
                      key: "store_name",
                      label: "Store name",
                      type: "text",
                      max: 120,
                    },
                    {
                      key: "brand_tagline",
                      label: "Tagline (optional)",
                      type: "text",
                      max: 180,
                    },
                    {
                      key: "support_email",
                      label: "Customer care email",
                      type: "email",
                      max: 255,
                    },
                    {
                      key: "support_phone",
                      label: "Customer care phone",
                      type: "tel",
                      max: 32,
                    },
                  ].map((field) => (
                    <FormField key={field.key} label={field.label}>
                      <input
                        type={field.type}
                        maxLength={field.max}
                        value={settings[field.key] ?? ""}
                        onChange={(event) =>
                          change(field.key, event.target.value)
                        }
                      />
                    </FormField>
                  ))}
                </div>
              </section>
              <section className="admin-card">
                <h2>Delivery & inventory</h2>
                <p className="admin-helper">
                  Home delivery uses these charges. Store collection has no
                  delivery fee.
                </p>
                <div className="admin-form-grid">
                  <FormField label="Delivery fee (INR)">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={settings.shipping_flat_rate ?? ""}
                      onChange={(event) =>
                        change("shipping_flat_rate", event.target.value)
                      }
                    />
                    <small>Leave blank for no delivery fee.</small>
                  </FormField>
                  <FormField label="Free delivery from (INR)">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={settings.free_shipping_threshold ?? ""}
                      onChange={(event) =>
                        change("free_shipping_threshold", event.target.value)
                      }
                    />
                    <small>
                      Leave blank to apply the fee to all home deliveries.
                    </small>
                  </FormField>
                  <FormField label="Low stock threshold">
                    <input
                      required
                      type="number"
                      min="0"
                      max="100000"
                      step="1"
                      value={settings.low_stock_threshold ?? ""}
                      onChange={(event) =>
                        change("low_stock_threshold", event.target.value)
                      }
                    />
                    <small>
                      Products at or below this quantity appear in overview
                      alerts.
                    </small>
                  </FormField>
                </div>
                <div className="admin-policy">
                  <span>Currency: {policy?.currency}</span>
                  <span>
                    Payments:{" "}
                    {policy?.codEnabled
                      ? "Cash on delivery / collection"
                      : "COD unavailable"}
                  </span>
                </div>
              </section>
            </fieldset>
          )
        )}
      </AdminPage>
    </form>
  );
}
