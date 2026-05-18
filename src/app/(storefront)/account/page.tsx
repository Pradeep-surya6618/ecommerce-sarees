import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { logoutAction } from "@/server/actions/auth";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";

export const metadata = { title: "Account · Saree Store" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/account");

  return (
    <Container size="lg" className="py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Account" }]} />
      <header className="mt-6 flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-accent-gold">Welcome back</span>
        <h1 className="font-display text-3xl text-ink-900 md:text-5xl">{user.fullName}</h1>
        <p className="text-ink-700">{user.email}</p>
      </header>
      <section className="mt-10 rounded-md border border-ink-500/10 bg-bg-elevated p-6">
        <h2 className="mb-3 font-display text-2xl text-ink-900">Your account</h2>
        <p className="text-sm text-ink-700">
          Orders, addresses, profile editing, and the wishlist land in the next phase. For now, you
          can browse the shop and your cart will follow you on sign-in.
        </p>
        <form action={logoutAction} className="mt-6">
          <button
            type="submit"
            className="rounded-sm border border-ink-500/30 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-900 hover:text-ink-900"
          >
            Sign out
          </button>
        </form>
      </section>
    </Container>
  );
}
