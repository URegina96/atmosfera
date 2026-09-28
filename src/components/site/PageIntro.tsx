import { Reveal } from "./Reveal";

export function PageIntro({ eyebrow, title, text, children }: { eyebrow: string; title: React.ReactNode; text?: string; children?: React.ReactNode }) {
  return (
    <section className="container-x pb-10 pt-12 md:pb-16 md:pt-20">
      <Reveal>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl font-serif text-[48px] leading-[0.98] tracking-[-0.01em] sm:text-[72px]">{title}</h1>
        {text && <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-umber/80">{text}</p>}
        {children}
      </Reveal>
    </section>
  );
}
