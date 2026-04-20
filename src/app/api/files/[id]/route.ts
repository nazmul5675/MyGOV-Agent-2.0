import { NextResponse } from "next/server";
import { Readable } from "node:stream";

import { readSession } from "@/lib/auth/session";
import { getFileById } from "@/lib/repositories/files";
import { openEvidenceDownloadStreamByGridFsId } from "@/lib/storage/gridfs";
import { handleRouteError, notFoundError, unauthorized } from "@/lib/security/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await readSession();
    if (!session) throw unauthorized();

    const { id } = await context.params;
    const file = await getFileById(id);
    if (!file) throw notFoundError("File not found.");

    const isOwner = file.ownerUid === session.uid;
    const isAdmin = session.role === "admin";
    if (!isOwner && !isAdmin) {
      throw unauthorized("You do not have access to this file.");
    }

    if (!file.gridFsFileId) {
      throw notFoundError("This file does not have an attached GridFS blob.");
    }

    const stream = await openEvidenceDownloadStreamByGridFsId(file.gridFsFileId);
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename)}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return handleRouteError(error, "Unable to load this file.");
  }
}
