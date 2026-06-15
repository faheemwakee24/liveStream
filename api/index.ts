import { IncomingMessage } from 'node:http';

// Import the pre-built SSR handler (Node.js ESM bundle produced by `npm run vercel-build`)
// Do NOT import from ../src/server — that requires a Nitro/Cloudflare build context.
import serverEntry from '../dist/server/server.js';

function getFullUrl(req: IncomingMessage) {
  const host = req.headers.host ?? 'localhost';
  const protocol = req.headers['x-forwarded-proto'] ?? 'https';
  return new URL(req.url ?? '', `${protocol}://${host}`).toString();
}

async function readBody(req: IncomingMessage) {
  const chunks: Uint8Array[] = [];

  for await (const chunk of req) {
    if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk));
    } else {
      chunks.push(chunk);
    }
  }

  return Buffer.concat(chunks);
}

export default async function handler(req: IncomingMessage, res: any) {
  const url = getFullUrl(req);
  const body = await readBody(req);

  const request = new Request(url, {
    method: req.method,
    headers: req.headers as Record<string, string>,
    body: body.length ? body : undefined,
  });

  const response = await serverEntry.fetch(request, {}, {});

  res.statusCode = response.status;
  response.headers.forEach((value: string, key: string) => {
    res.setHeader(key, value);
  });

  const responseBody = await response.arrayBuffer();
  res.end(Buffer.from(responseBody));
}
