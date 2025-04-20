import { Link, useLocation } from "react-router-dom"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { registryCategories } from "@/registry/registry-categories"

export function BlocksNav() {
  const location = useLocation()

  return (
    <div className="relative overflow-hidden">
      <ScrollArea className="max-w-none">
        <div className="flex items-center space-x-2">
          <BlocksNavLink
            category={{ name: "Featured", slug: "", hidden: false }}
            isActive={location.pathname === "/blocks"}
          />
          {registryCategories.map((category) => (
            <BlocksNavLink
              key={category.slug}
              category={category}
              isActive={location.pathname === `/blocks/${category.slug}`}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  )
}

function BlocksNavLink({ category, isActive }) {
  if (category.hidden) return null

  return (
    <Link
      to={`/blocks/${category.slug}`}
      className={`flex h-7 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4 text-center text-sm font-medium transition-colors ${
        isActive
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {category.name}
    </Link>
  )
}
