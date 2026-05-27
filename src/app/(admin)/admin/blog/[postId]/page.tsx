import { notFound } from "next/navigation";
import { blogPostsRepo } from "@/lib/db/repos/blog-posts";
import { BlogPostForm } from "@/components/admin/BlogPostForm";

export const metadata = { title: "Edit journal post · Admin" };

interface PageProps {
  params: Promise<{ postId: string }>;
}

export default async function AdminBlogEditPage({ params }: PageProps) {
  const { postId } = await params;
  const post = await blogPostsRepo.getById(postId);
  if (!post) notFound();
  return <BlogPostForm mode="edit" initial={post} />;
}
