import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from "react";
export function FormField({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  const generatedId = useId();
  const control = Children.toArray(children)[0];
  const props = isValidElement(control)
    ? (control.props as { id?: string })
    : {};
  const id = props.id || generatedId;
  return (
    <div className="admin-field">
      <label htmlFor={id}>{label}</label>
      {isValidElement(control) ? (
        <>
          {cloneElement(control as ReactElement<Record<string, unknown>>, {
            id,
            ...(error
              ? { "aria-invalid": true, "aria-describedby": id + "-error" }
              : {}),
          })}
          {Children.toArray(children).slice(1)}
        </>
      ) : (
        children
      )}
      {error && (
        <p id={id + "-error"} className="admin-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
