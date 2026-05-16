import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { categoriesRepo } from "@/lib/db/repos/categories";
import { Container } from "@/components/ui/Container";
import { IconButton } from "@/components/ui/IconButton";

export async function Header() {
  const categories = await categoriesRepo.listTopLevel();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-500/10 bg-bg-base/90 backdrop-blur">
      <Container size="xl">
        <div className="flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-3 md:hidden">
            <IconButton aria-label="Open menu" size="sm">
              <Menu className="h-5 w-5" />
            </IconButton>
          </div>

          <Link href="/" className="font-display text-2xl text-ink-900">
            Saree Store
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {categories.slice(0, 5).map((c) => (
              <Link
                key={c.slug}
                href={`/shop/${c.slug}`}
                className="text-sm text-ink-700 transition hover:text-ink-900"
              >
                {c.name}
              </Link>
            ))}
            <Link
              href="/shop"
              className="text-sm font-medium text-accent-primary transition hover:text-accent-primary-hover"
            >
              All Sarees
            </Link>
          </nav>

          <div className="flex items-center gap-1">
            <IconButton aria-label="Search" size="sm">
              <Search className="h-5 w-5" />
            </IconButton>
            <IconButton aria-label="Wishlist" size="sm">
              <Heart className="h-5 w-5" />
            </IconButton>
            <IconButton aria-label="Account" size="sm">
              <User className="h-5 w-5" />
            </IconButton>
            <IconButton aria-label="Cart" size="sm">
              <ShoppingBag className="h-5 w-5" />
            </IconButton>
          </div>
        </div>
      </Container>
    </header>
  );
}
