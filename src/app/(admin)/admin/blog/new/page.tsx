import { BlogPostForm } from "@/components/admin/BlogPostForm";

export const metadata = { title: "New journal post · Admin" };

export default function AdminBlogNewPage() {
  return <BlogPostForm mode="create" initial={null} />;
}
