"use server";

import { productsRepo } from "@/lib/db/repos/products";
import type { Product } from "@/types/domain";

export async function searchProductsAction(query: string): Promise<Product[]> {
  const q = query.trim();
  if (q.length === 0) return [];
  const result = await productsRepo.search({ q, pageSize: 8 });
  return result.items;
}
