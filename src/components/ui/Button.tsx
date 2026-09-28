import clsx from "clsx";
import Link from "next/link";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "light" | "danger";
type Size = "sm" | "md" | "lg";

const styles: Record<Variant, string> = {
  primary: "bg-graphite text-ivory hover:bg-ink",
  secondary: "border border-graphite/20 text-graphite hover:border-graphite/50 bg-transparent",
  ghost: "text-graphite hover:bg-graphite/5",
  light: "bg-ivory text-graphite hover:bg-white",
  danger: "border border-[#8a4a3a]/30 text-[#7a3b2c] hover:bg-[#8a4a3a]/5",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-sm",
  lg: "h-14 px-8 text-[15px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return clsx(
    "inline-flex select-none items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-all duration-300 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    styles[variant],
    sizes[size],
    className,
  );
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean };

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button ref={ref} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  );
});

export function ButtonLink({ href, variant = "primary", size = "md", className, children, ...rest }: { href: string; variant?: Variant; size?: Size; className?: string; children: React.ReactNode } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
