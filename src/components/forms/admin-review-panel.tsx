"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const actions = [
  "Approve",
  "Reject",
  "Request more documents",
  "Route to specialist desk",
  "Mark in progress",
  "Resolve",
];

export function AdminReviewPanel() {
  const [note, setNote] = useState(
    "Routing looks correct. A wider road photo will improve severity confidence before dispatch."
  );

  return (
    <Card className="surface-panel">
      <CardHeader>
        <CardTitle className="font-heading text-xl font-bold tracking-tight text-primary">
          Decision center
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          rows={6}
          className="rounded-3xl bg-white/70"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <div className="grid gap-3">
          {actions.map((action) => (
            <Button
              key={action}
              variant={action === "Approve" || action === "Resolve" ? "default" : "outline"}
              size="lg"
              className="justify-start rounded-2xl"
              onClick={() =>
                toast.success(action, {
                  description:
                    "This admin action is scaffolded and ready for Firestore mutation wiring.",
                })
              }
            >
              {action}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
