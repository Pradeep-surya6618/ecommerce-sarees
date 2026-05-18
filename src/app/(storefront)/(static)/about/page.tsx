import Image from "next/image";
import { ProsePage } from "@/components/storefront/ProsePage";

export const metadata = { title: "Our story · Saree Store" };

export default function AboutPage() {
  return (
    <ProsePage
      title="Our story"
      description="Sarees, sourced directly from weavers across India."
      breadcrumb={[{ label: "Home", href: "/" }, { label: "Our story" }]}
    >
      <p>
        Saree Store began as a notebook of weavers. Over four years we have walked through
        Kanchipuram, Varanasi, Paithan, Pochampally, Maheshwar, and the Bengali looms — meeting the
        people behind the pieces, learning what makes each tradition specific, and building
        relationships that let us bring their work to a wider audience without losing the thread of
        the craft.
      </p>
      <div className="relative my-2 aspect-[16/9] overflow-hidden rounded-md">
        <Image
          src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=80"
          alt="Weaver at a handloom"
          fill
          sizes="(min-width: 768px) 700px, 100vw"
          className="object-cover"
        />
      </div>
      <h2>What we believe</h2>
      <p>
        Heritage isn&apos;t a marketing word. It is a record of decisions — fibre, dye, motif,
        proportion — that have survived because they worked. We try to honour those decisions and
        explain them clearly enough that customers can recognise them, too.
      </p>
      <h2>Who works on this</h2>
      <p>
        A small team across Bengaluru and Kanchipuram. We work with cooperatives that pay weavers
        above the regional floor; that pay arrives before our pieces ship. Photography is in-house.
        Customer service goes to humans, not bots.
      </p>
    </ProsePage>
  );
}
