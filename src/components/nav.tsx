import Link from "next/link";
import {
  LayoutDashboard,
  PenLine,
  CheckCircle2,
  Target,
  Settings,
} from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: PenLine },
  { href: "/habits", label: "Habits", icon: CheckCircle2 },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Nav() {
  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 h-16">
        <span className="font-bold text-lg mr-auto tracking-tight">
          PersonalTrack
        </span>
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
