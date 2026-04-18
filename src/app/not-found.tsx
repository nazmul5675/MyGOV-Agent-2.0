import Link from "next/link";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="container-shell flex min-h-screen items-center justify-center py-20">
      <EmptyState
        icon={<Search className="size-6" />}
        title="We couldn't find that page"
        description="The route may not exist yet, or the case record may no longer be available."
        action={
          <Link href="/" className={cn(buttonVariants({ size: "lg" }), "rounded-full px-5")}>
            Return home
          </Link>
        }
      />
    </div>
  );
}
