import type { Request } from "express";

export type UploadedFile = {
  fieldName: string;
  filename: string;
  contentType: string;
  buffer: Buffer;
};

export type MultipartPayload = {
  fields: Record<string, string>;
  files: UploadedFile[];
};

function parseDisposition(value: string) {
  const parts = value.split(";").map((part) => part.trim());
  const params: Record<string, string> = {};

  for (const part of parts.slice(1)) {
    const [key, raw] = part.split("=");
    if (!key || !raw) continue;
    params[key] = raw.replace(/^"|"$/g, "");
  }

  return params;
}

function trimTrailingNewline(buffer: Buffer) {
  if (buffer.length >= 2 && buffer.at(-2) === 13 && buffer.at(-1) === 10) {
    return buffer.subarray(0, -2);
  }
  return buffer;
}

export async function parseMultipart(req: Request): Promise<MultipartPayload> {
  const contentType = req.headers["content-type"] ?? "";
  const boundary = /boundary=([^;]+)/i.exec(contentType)?.[1];

  if (!boundary) {
    throw new Error("Multipart boundary is missing.");
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks);
  const boundaryText = `--${boundary}`;
  const parts = body.toString("binary").split(boundaryText).slice(1, -1);
  const fields: Record<string, string> = {};
  const files: UploadedFile[] = [];

  for (const rawPart of parts) {
    const part = rawPart.replace(/^\r\n/, "");
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) continue;

    const rawHeaders = part.slice(0, headerEnd);
    const content = Buffer.from(part.slice(headerEnd + 4), "binary");
    const headers = Object.fromEntries(
      rawHeaders.split("\r\n").map((line) => {
        const idx = line.indexOf(":");
        return [line.slice(0, idx).toLowerCase(), line.slice(idx + 1).trim()];
      }),
    );

    const disposition = headers["content-disposition"];
    if (!disposition) continue;

    const params = parseDisposition(disposition);
    const fieldName = params.name;
    if (!fieldName) continue;

    const value = trimTrailingNewline(content);

    if (params.filename) {
      files.push({
        fieldName,
        filename: params.filename,
        contentType: headers["content-type"] || "application/octet-stream",
        buffer: value,
      });
      continue;
    }

    fields[fieldName] = value.toString("utf8");
  }

  return { fields, files };
}
