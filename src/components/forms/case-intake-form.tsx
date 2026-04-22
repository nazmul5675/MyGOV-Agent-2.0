"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  CheckCircle2,
  FileAudio2,
  FileText,
  ImagePlus,
  LoaderCircle,
  Mic,
  Trash2,
  Sparkles,
  Upload,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createCaseAction } from "@/lib/actions/cases";
import { useFileUploads } from "@/hooks/use-file-uploads";
import { createCaseSchema } from "@/lib/validation/cases";
import { AssistantPanel } from "@/components/common/assistant-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type FormValues = z.infer<typeof createCaseSchema>;

interface CaseIntakeFormProps {
  userId: string;
}

export function CaseIntakeForm({ userId }: CaseIntakeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    uploads,
    queueFiles,
    removeQueuedUpload,
    uploadForCase,
    cleanupUploadedFiles,
    resetUploads,
  } = useFileUploads();
  const form = useForm<FormValues>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      title: "",
      caseType: "public_complaint",
      location: "",
      description: "",
    },
  });

  const uploadCountLabel = useMemo(
    () => `${uploads.length} files attached`,
    [uploads.length]
  );
  const caseTypeValue = useWatch({
    control: form.control,
    name: "caseType",
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      let uploadedEvidence: Awaited<ReturnType<typeof uploadForCase>> = [];

      try {
        const caseId = crypto.randomUUID();
        uploadedEvidence = await uploadForCase(caseId, userId);
        const created = await createCaseAction({
          ...values,
          caseId,
          files: uploadedEvidence.map((item) => ({
            id: item.id,
            gridFsFileId: item.gridFsFileId,
            name: item.name,
            kind: item.kind,
            size: item.sizeBytes || 0,
            downloadUrl: item.downloadUrl,
            contentType: item.contentType,
          })),
        });

        toast.success("Case submitted", {
          description: `${values.title} was saved and routed successfully.`,
        });
        resetUploads();
        router.push(`/cases/${created.caseId}?submitted=1`);
        router.refresh();
      } catch (error) {
        if (uploadedEvidence.length) {
          await cleanupUploadedFiles(uploadedEvidence);
        }
        toast.error(error instanceof Error ? error.message : "Unable to submit case");
      }
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]"
    >
      <div className="space-y-6">
        <Card className="surface-panel">
          <CardHeader>
            <CardTitle className="font-heading text-2xl font-bold tracking-tight text-primary">
              Multimodal citizen intake
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="title">Case title</Label>
              <Input
                id="title"
                className="h-12 rounded-2xl bg-white/70"
                placeholder="Briefly name the issue or request"
                {...form.register("title")}
              />
              <p className="text-sm text-destructive">
                {form.formState.errors.title?.message}
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Case type</Label>
              <Select
                value={caseTypeValue}
                onValueChange={(value) =>
                  form.setValue("caseType", value as FormValues["caseType"], {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger className="h-12 rounded-2xl bg-white/70">
                  <SelectValue placeholder="Select case type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flood_relief">Flood relief</SelectItem>
                  <SelectItem value="public_complaint">Public complaint</SelectItem>
                  <SelectItem value="reminder_renewal">Reminder / renewal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                className="h-12 rounded-2xl bg-white/70"
                placeholder="Where is this happening?"
                {...form.register("location")}
              />
              <p className="text-sm text-destructive">
                {form.formState.errors.location?.message}
              </p>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="description">Tell us what happened</Label>
              <Textarea
                id="description"
                rows={7}
                className="rounded-3xl bg-white/70"
                placeholder="Explain what happened, what support you need, and any urgency we should know about."
                {...form.register("description")}
              />
              <p className="text-sm text-destructive">
                {form.formState.errors.description?.message}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="surface-panel overflow-hidden">
          <CardHeader className="flex flex-col items-start justify-between gap-4 md:flex-row">
            <div className="min-w-0">
              <CardTitle className="font-heading text-xl font-bold tracking-tight text-primary">
                Evidence and uploads
              </CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Photos, documents, and voice notes upload through the protected MyGOV backend into MongoDB GridFS, with metadata saved against the case.
              </p>
            </div>
            <div className="self-start rounded-full bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {uploadCountLabel}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-[28px] border border-dashed border-primary/20 bg-white/60 px-6 py-12 text-center transition-colors hover:border-primary/40 hover:bg-white">
              <div className="flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Upload className="size-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Drop files or browse from device
                </p>
                <p className="text-sm text-muted-foreground">
                  JPG, PDF, and M4A supported
                </p>
              </div>
              <Input
                id="evidence-files"
                type="file"
                multiple
                accept="image/*,application/pdf,audio/*"
                className="hidden"
                onChange={(event) => {
                  queueFiles(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { label: "Photo proof", icon: ImagePlus },
                { label: "Document", icon: FileText },
                { label: "Voice note", icon: FileAudio2 },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="rounded-[24px] bg-muted/80 p-5">
                    <Icon className="size-5 text-primary" />
                    <p className="mt-3 font-semibold text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Uploaded files generate metadata, progress state, and
                      evidence records for the case timeline.
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              {uploads.map((item) => (
                <div key={item.id} className="rounded-[24px] bg-white/80 p-4">
                  <div className="mb-3 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-all font-semibold text-foreground">{item.name}</p>
                      <p className="text-muted-foreground">
                        {`${item.kind.replace("_", " ")} · ${(
                          item.size /
                          1024 /
                          1024
                        ).toFixed(2)} MB`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {item.progress === 100 ? (
                        <CheckCircle2 className="size-4 text-[#1d7d49]" />
                      ) : null}
                      {item.status === "error" ? (
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-destructive">
                          Failed
                        </span>
                      ) : null}
                      <span className="font-semibold text-primary">{item.progress}%</span>
                      {item.status === "queued" ? (
                        <button
                          type="button"
                          onClick={() => removeQueuedUpload(item.id)}
                          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <Progress value={item.progress} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="surface-panel">
          <CardHeader>
            <CardTitle className="font-heading text-xl font-bold tracking-tight text-primary">
              Submission path
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {[
              "Describe the issue in plain language so AI and staff can read the same summary.",
              "Upload the strongest supporting file first, then add any extra proof or voice note.",
              "Submit once the checklist is covered and track the live timeline immediately after.",
            ].map((item, index) => (
              <div key={item} className="rounded-[22px] bg-muted/75 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold">
                    {index + 1}
                  </span>
                  <ArrowRight className="size-4" />
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <AssistantPanel
          initialMessages={[]}
          title="Guided AI helper"
          subtitle="Use the assistant while you prepare your submission. It can explain what files to add, help tighten your case summary, and check whether anything important is missing."
        />

        <Card className="hero-gradient rounded-[32px] border-none text-primary-foreground shadow-[0_24px_60px_rgba(0,30,64,0.28)]">
          <CardContent className="space-y-4 p-7">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-white/10">
                <Mic className="size-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/70">
                  Guided intake
                </p>
                <p className="font-heading text-2xl font-bold tracking-tight">
                  Structured case packet
                </p>
              </div>
            </div>
            <p className="text-sm leading-7 text-primary-foreground/80">
              Structured intake, summaries, urgency, and missing-document hints
              stay attached to the case so the assistant can respond with relevant guidance throughout the case flow.
            </p>
          </CardContent>
        </Card>

        <Card className="surface-panel">
          <CardHeader>
            <CardTitle className="font-heading text-xl font-bold tracking-tight text-primary">
              Submission checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "Clear location and public-facing description",
              "At least one supporting file where possible",
              "Citizen-friendly summary for follow-up notifications",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-[20px] bg-muted/70 p-4">
                <Sparkles className="mt-0.5 size-4 text-primary" />
                <p className="text-sm leading-6 text-muted-foreground">{item}</p>
              </div>
            ))}
            <div className="rounded-[20px] bg-accent/65 p-4 text-sm leading-6 text-accent-foreground">
              Submitting uploads evidence first, then creates the case packet,
              writes the initial timeline, and keeps file metadata ready for citizen and admin review.
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-2xl"
              disabled={isPending}
            >
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Submit case
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
