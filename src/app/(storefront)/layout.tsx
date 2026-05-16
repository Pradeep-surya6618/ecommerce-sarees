import { MarketingShell } from "@/components/shared/MarketingShell";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
