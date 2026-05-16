import Button from "@mui/material/Button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg-base text-ink-900">
      <section className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-6 py-24">
        <span className="text-xs uppercase tracking-widest text-accent-gold">Coming soon</span>
        <h1 className="font-display text-5xl md:text-6xl text-ink-900">
          Handpicked sarees, woven with care.
        </h1>
        <p className="max-w-prose text-ink-700">
          Phase 0 foundation is live. Tokens, theme, AWS clients, health check, and DynamoDB setup
          script are in place. The storefront is the next phase.
        </p>
        <Button variant="contained" color="primary" size="large">
          Explore the collection
        </Button>
      </section>
    </main>
  );
}
