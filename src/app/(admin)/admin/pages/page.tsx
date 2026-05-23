import { contentPagesRepo } from "@/lib/db/repos/content-pages";
import { PagesListClient } from "@/components/admin/PagesListClient";

export const metadata = { title: "Pages · Admin" };

export default async function AdminPagesIndex() {
  const pages = await contentPagesRepo.list();
  return <PagesListClient pages={pages} />;
}
