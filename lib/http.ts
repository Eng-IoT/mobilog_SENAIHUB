import { NextResponse } from "next/server";
import { AccessError } from "./access";
import { ProductionError } from "./production";
export function json(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store, max-age=0", "Pragma": "no-cache", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" } });
}
export function failure(error: unknown) {
  if (error instanceof AccessError || error instanceof ProductionError) return json({ error: error.message }, error.status);
  console.error("MobiLog request failed", error instanceof Error ? error.name : "unknown");
  return json({ error: "Não foi possível concluir a operação. Tente novamente; registros pendentes continuam no aparelho." }, 503);
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || origin && new URL(origin).origin !== new URL(request.url).origin) throw new AccessError("Origem da solicitação não permitida.");
}
export async function readBody(request: Request, max = 20000): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (text.length > max) throw new AccessError("Registro muito grande.", 413);
  try { const data = JSON.parse(text); if (!data || typeof data !== "object" || Array.isArray(data)) throw 0; return data; }
  catch { throw new AccessError("Solicitação inválida.", 400); }
}
export function requiredText(value: unknown, name: string, min = 2, max = 100) {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) throw new AccessError("Confira o campo " + name + ".", 422);
  return value.trim();
}
export function password(value: unknown) {
  const result = requiredText(value, "senha", 10, 128);
  if (!/[A-Za-z]/.test(result) || !/[0-9]/.test(result)) throw new AccessError("Use uma senha com pelo menos 10 caracteres, letras e números.", 422);
  return result;
}
export function email(value: unknown) {
  const result = requiredText(value, "e-mail", 5, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new AccessError("Informe um e-mail válido.", 422);
  return result;
}
