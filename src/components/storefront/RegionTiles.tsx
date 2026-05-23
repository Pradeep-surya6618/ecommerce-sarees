import Image from "next/image";
import Link from "next/link";
import type { Region } from "@/types/domain";

export interface RegionTilesProps {
  regions: Region[];
}

export function RegionTiles({ regions }: RegionTilesProps) {
  if (regions.length === 0) return null;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {regions.map((r) => (
        <Link
          key={r.id}
          href={r.href}
          className="group relative block aspect-[4/3] overflow-hidden rounded-md bg-ink-900"
        >
          {r.imageUrl ? (
            <Image
              src={r.imageUrl}
              alt={`${r.craft} from ${r.state}`}
              fill
              sizes="(min-width: 1024px) 33vw, 50vw"
              className="object-cover opacity-90 transition duration-500 group-hover:scale-[1.05] group-hover:opacity-100"
            />
          ) : (
            <div
              aria-hidden
              className="h-full w-full bg-gradient-to-br from-accent-primary-hover via-accent-primary to-ink-900"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5 text-white">
            <span className="text-xs uppercase tracking-[0.2em] opacity-80">{r.state}</span>
            <h3 className="font-display text-xl">{r.craft}</h3>
          </div>
        </Link>
      ))}
    </div>
  );
}
