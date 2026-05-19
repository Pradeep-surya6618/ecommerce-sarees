import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/types/domain";

export function CategoryTile({ category }: { category: Category }) {
  return (
    <Link
      href={`/shop/${category.slug}`}
      className="group relative block aspect-[3/4] overflow-hidden rounded-md bg-ink-900"
    >
      <Image
        src={category.imageUrl}
        alt={category.name}
        fill
        sizes="(min-width: 1024px) 25vw, 50vw"
        className="object-cover opacity-90 transition duration-500 group-hover:scale-[1.05] group-hover:opacity-100"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-3 text-white sm:p-4">
        <span className="text-[10px] uppercase tracking-[0.2em] opacity-80 sm:text-xs">
          Collection
        </span>
        <h3 className="font-display text-base sm:text-lg md:text-xl">{category.name}</h3>
      </div>
    </Link>
  );
}
