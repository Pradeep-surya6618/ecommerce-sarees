import Image from "next/image";
import Link from "next/link";

interface Region {
  state: string;
  craft: string;
  href: string;
  imageUrl: string;
}

const REGIONS: Region[] = [
  {
    state: "Tamil Nadu",
    craft: "Kanjivaram silks",
    href: "/shop/kanjivaram",
    imageUrl:
      "https://images.unsplash.com/photo-1583391733981-86d0d2c0e9aa?auto=format&fit=crop&w=1200&q=80",
  },
  {
    state: "Uttar Pradesh",
    craft: "Banarasi brocades",
    href: "/shop/banarasi",
    imageUrl:
      "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    state: "Maharashtra",
    craft: "Paithani peacocks",
    href: "/shop?fabric=paithani",
    imageUrl:
      "https://images.unsplash.com/photo-1610030469973-e1b80fb95e36?auto=format&fit=crop&w=1200&q=80",
  },
  {
    state: "Karnataka",
    craft: "Mysore pure silk",
    href: "/shop?fabric=mysore",
    imageUrl:
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    state: "Andhra Pradesh",
    craft: "Pochampally ikat",
    href: "/shop?fabric=pochampally",
    imageUrl:
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    state: "Madhya Pradesh",
    craft: "Chanderi silk-cotton",
    href: "/shop?fabric=chanderi",
    imageUrl:
      "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?auto=format&fit=crop&w=1200&q=80",
  },
];

export function RegionTiles() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {REGIONS.map((r) => (
        <Link
          key={r.state}
          href={r.href}
          className="group relative block aspect-[4/3] overflow-hidden rounded-md bg-ink-900"
        >
          <Image
            src={r.imageUrl}
            alt={`${r.craft} from ${r.state}`}
            fill
            sizes="(min-width: 1024px) 33vw, 50vw"
            className="object-cover opacity-90 transition duration-500 group-hover:scale-[1.05] group-hover:opacity-100"
          />
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
