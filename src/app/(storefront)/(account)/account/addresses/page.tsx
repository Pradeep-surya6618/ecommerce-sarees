import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { addressesRepo } from "@/lib/db/repos/addresses";
import { AddressesPageClient } from "./client";

export const metadata = { title: "Addresses · Saree Store" };

export default async function AddressesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?next=/account/addresses");
  const addresses = await addressesRepo.listByUser(user.id);
  return <AddressesPageClient addresses={addresses} />;
}
