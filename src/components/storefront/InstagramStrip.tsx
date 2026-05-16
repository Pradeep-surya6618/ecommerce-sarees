import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const INSTAGRAM_TILES = [
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1583391733981-86d0d2c0e9aa?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1610030469973-e1b80fb95e36?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1581338834647-b0fb40704e21?auto=format&fit=crop&w=600&q=80",
];

export function InstagramStrip() {
  return (
    <section className="py-20">
      <Container size="xl">
        <SectionHeading
          eyebrow="@saree.store"
          title="From the gram"
          align="center"
          className="mb-10"
        />
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {INSTAGRAM_TILES.map((url, idx) => (
            <Link
              key={url}
              href="https://instagram.com"
              className="group relative aspect-square overflow-hidden"
            >
              <Image
                src={url}
                alt={`Instagram tile ${idx + 1}`}
                fill
                sizes="(min-width: 768px) 16vw, 33vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
