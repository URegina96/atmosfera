import clsx from "clsx";
import { forwardRef, useId } from "react";

const control =
  "w-full rounded-xl border border-graphite/15 bg-white/80 px-4 text-[15px] text-graphite placeholder:text-mist transition focus:border-graphite/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-beige/60 aria-[invalid=true]:border-[#9a5543]";

export function Field({ label, error, hint, children, htmlFor }: { label: string; error?: string; hint?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[12px] font-medium uppercase tracking-[0.14em] text-taupe">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[13px] text-[#9a5543]" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-[13px] text-taupe">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string };
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, hint, className, id, ...rest }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  const el = <input ref={ref} id={inputId} aria-invalid={!!error} className={clsx(control, "h-12", className)} {...rest} />;
  return label ? <Field label={label} error={error} hint={hint} htmlFor={inputId}>{el}</Field> : el;
});

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string; hint?: string };
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, error, hint, className, id, ...rest }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  const el = <textarea ref={ref} id={inputId} aria-invalid={!!error} className={clsx(control, "min-h-[96px] py-3", className)} {...rest} />;
  return label ? <Field label={label} error={error} hint={hint} htmlFor={inputId}>{el}</Field> : el;
});

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string };
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, error, className, id, children, ...rest }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  const el = (
    <div className="relative">
      <select ref={ref} id={inputId} aria-invalid={!!error} className={clsx(control, "h-12 appearance-none pr-10", className)} {...rest}>
        {children}
      </select>
      <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-taupe" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6l4 4 4-4" /></svg>
    </div>
  );
  return label ? <Field label={label} error={error} htmlFor={inputId}>{el}</Field> : el;
});
