import { NextResponse } from "next/server";

import { readSession } from "@/lib/auth/session";
import {
  addEvidenceToCase,
  buildEvidenceFile,
  getCitizenCaseById,
} from "@/lib/repositories/cases";
import { evidenceMetadataSchema } from "@/lib/validation/cases";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const existing = await getCitizenCaseById(session.uid, id);
  if (!existing) {
    return NextResponse.json({ error: "Case not found." }, { status: 404 });
  }
  const body = evidenceMetadataSchema.parse(await request.json());

  await addEvidenceToCase(
    id,
    body.files.map((item) =>
      buildEvidenceFile({
        id: item.id,
        name: item.name,
        kind: item.kind,
        size: item.size,
        downloadUrl: item.downloadUrl,
        storagePath: item.storagePath,
        contentType: item.contentType,
      })
    )
  );

  return NextResponse.json({ ok: true });
}
