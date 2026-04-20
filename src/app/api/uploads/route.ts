import { NextResponse } from "next/server";

import { readSession } from "@/lib/auth/session";
import { assertRole } from "@/lib/services/auth";
import { handleRouteError, unauthorized } from "@/lib/security/api";
import { deleteUploadedEvidenceBlobs, uploadEvidenceBlob } from "@/lib/storage/gridfs";

export async function POST(request: Request) {
  try {
    const session = await readSession();
    if (!session) throw unauthorized();
    assertRole(session, "citizen");

    const formData = await request.formData();
    const caseId = String(formData.get("caseId") || "").trim();
    const file = formData.get("file");

    if (!caseId) {
      return NextResponse.json({ error: "A case id is required for file uploads." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A file upload is required." }, { status: 400 });
    }

    const uploaded = await uploadEvidenceBlob({
      file,
      caseId,
      userUid: session.uid,
    });

    return NextResponse.json({ file: uploaded });
  } catch (error) {
    return handleRouteError(error, "Unable to upload the selected file.");
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await readSession();
    if (!session) throw unauthorized();
    assertRole(session, "citizen");

    const body = (await request.json().catch(() => null)) as
      | { fileIds?: string[] }
      | null;

    await deleteUploadedEvidenceBlobs(
      Array.isArray(body?.fileIds)
        ? body.fileIds.filter((fileId): fileId is string => Boolean(fileId))
        : [],
      session.uid
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error, "Unable to clean up uploaded files.");
  }
}
