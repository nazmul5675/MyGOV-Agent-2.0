import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  statusCode: number;
  expose: boolean;

  constructor(message: string, statusCode = 500, expose = true) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.expose = expose;
  }
}

export function unauthorized(message = "Unauthorized") {
  return new AppError(message, 401);
}

export function forbidden(message = "Forbidden") {
  return new AppError(message, 403);
}

export function notFoundError(message = "Not found") {
  return new AppError(message, 404);
}

export function badRequest(message = "Invalid request") {
  return new AppError(message, 400);
}

export function handleRouteError(error: unknown, fallbackMessage: string) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: error.issues[0]?.message || fallbackMessage },
      { status: 400 }
    );
  }

  if (error instanceof Error && error.message === "NEXT_REDIRECT") {
    throw error;
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.expose ? error.message : fallbackMessage },
      { status: error.statusCode }
    );
  }

  return NextResponse.json(
    { error: error instanceof Error ? error.message : fallbackMessage },
    { status: 500 }
  );
}
