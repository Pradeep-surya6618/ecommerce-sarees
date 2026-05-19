import Image from "next/image";
import { siteSettingsRepo } from "@/lib/db/repos/site-settings";
import { ProsePage } from "@/components/storefront/ProsePage";

export async function generateMetadata() {
  const settings = await siteSettingsRepo.get();
  return { title: `${settings.about.title} · Saree Store` };
}

function paragraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default async function AboutPage() {
  const settings = await siteSettingsRepo.get();
  const a = settings.about;

  return (
    <ProsePage
      title={a.title}
      description={a.description}
      breadcrumb={[{ label: "Home", href: "/" }, { label: a.title }]}
    >
      {paragraphs(a.introBody).map((p, i) => (
        <p key={`intro-${i}`}>{p}</p>
      ))}

      {a.imageUrl && (
        <div className="relative my-2 aspect-[16/9] overflow-hidden rounded-md">
          <Image
            src={a.imageUrl}
            alt={a.imageAlt || a.title}
            fill
            sizes="(min-width: 768px) 700px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      {a.beliefHeading && <h2>{a.beliefHeading}</h2>}
      {paragraphs(a.beliefBody).map((p, i) => (
        <p key={`belief-${i}`}>{p}</p>
      ))}

      {a.teamHeading && <h2>{a.teamHeading}</h2>}
      {paragraphs(a.teamBody).map((p, i) => (
        <p key={`team-${i}`}>{p}</p>
      ))}
    </ProsePage>
  );
}
