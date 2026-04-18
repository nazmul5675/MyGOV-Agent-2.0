import { PageMotion } from "@/components/common/page-motion";

export default function MarketingTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageMotion>{children}</PageMotion>;
}
