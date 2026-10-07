import { Separator } from "@/shared/components/ui/separator"

const links = [
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Terms" },
  { href: "#", label: "Contact" },
]

export function Footer() {
  return (
    <footer className="border-t py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-sm font-semibold">Workspace</p>
          <nav className="flex flex-wrap gap-4" aria-label="Footer">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <Separator />
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Workspace. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
