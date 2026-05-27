import { blogPostsRepo } from "@/lib/db/repos/blog-posts";
import { BlogListClient } from "@/components/admin/BlogListClient";

export const metadata = { title: "Journal · Admin" };

export default async function AdminBlogIndex() {
  const posts = await blogPostsRepo.listAll();
  return <BlogListClient posts={posts} />;
}
