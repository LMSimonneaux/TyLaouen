import Link from "next/link";

const tabs = [
  { href: "/", label: "Maisons", key: "maisons" as const },
  { href: "/voitures", label: "Voitures", key: "voitures" as const },
];

export function SiteNav({ active }: { active: "maisons" | "voitures" }) {
  return (
    <nav className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={active === t.key ? "page" : undefined}
          className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition ${
            active === t.key
              ? "bg-accent text-white"
              : "text-muted hover:text-text"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
