import net from 'node:net';
import tls from 'node:tls';
import type { EmailJob, EmailProvider, EmailProviderResult } from './types.js';

function encode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64');
}

function dotStuff(value: string): string {
  return value.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..');
}

function message(job: EmailJob, from: string): string {
  const body = job.text || job.html || '';
  const contentType = job.html ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8';
  return [
    `From: ${job.from || from}`,
    `To: ${job.to}`,
    `Subject: ${job.subject}`,
    job.replyTo ? `Reply-To: ${job.replyTo}` : '',
    'MIME-Version: 1.0',
    `Content-Type: ${contentType}`,
    'Content-Transfer-Encoding: 8bit',
    '',
    dotStuff(body)
  ].filter(Boolean).join('\r\n');
}

async function readReply(socket: net.Socket | tls.TLSSocket): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const last = lines[lines.length - 1] || '';
      if (/^\d{3} /.test(last)) cleanup(() => resolve(buffer));
    };
    const onError = (error: Error) => cleanup(() => reject(error));
    const cleanup = (done: () => void) => {
      socket.off('data', onData);
      socket.off('error', onError);
      done();
    };
    socket.on('data', onData);
    socket.on('error', onError);
  });
}

function assertCode(reply: string, expected: number | number[]): void {
  const code = Number(reply.slice(0, 3));
  const allowed = Array.isArray(expected) ? expected : [expected];
  if (!allowed.includes(code)) throw new Error(`smtp_${code || 'invalid'}: ${reply.trim().slice(0, 300)}`);
}

async function command(socket: net.Socket | tls.TLSSocket, text: string, expected: number | number[]): Promise<string> {
  socket.write(`${text}\r\n`);
  const reply = await readReply(socket);
  assertCode(reply, expected);
  return reply;
}

export class SmtpEmailProvider implements EmailProvider {
  readonly name = 'smtp';

  isConfigured(): boolean {
    return Boolean(process.env.NYX_SMTP_HOST && process.env.NYX_SMTP_PORT && process.env.NYX_SMTP_FROM);
  }

  async send(job: EmailJob): Promise<EmailProviderResult> {
    const host = process.env.NYX_SMTP_HOST || '';
    const port = Number(process.env.NYX_SMTP_PORT || 0);
    const username = process.env.NYX_SMTP_USERNAME || '';
    const password = process.env.NYX_SMTP_PASSWORD || '';
    const from = process.env.NYX_SMTP_FROM || '';
    const secure = String(process.env.NYX_SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
    if (!host || !port || !from) throw new Error('smtp_not_configured');

    const socket: net.Socket | tls.TLSSocket = secure
      ? tls.connect({ host, port, servername: host })
      : net.connect({ host, port });

    socket.setTimeout(15_000, () => socket.destroy(new Error('smtp_timeout')));
    await new Promise<void>((resolve, reject) => {
      socket.once('error', reject);
      if (secure) (socket as tls.TLSSocket).once('secureConnect', () => resolve());
      else socket.once('connect', () => resolve());
    });

    try {
      assertCode(await readReply(socket), 220);
      let ehlo = await command(socket, `EHLO ${process.env.NYX_SMTP_HELO || 'nyx.local'}`, 250);

      if (!secure && /STARTTLS/i.test(ehlo) && String(process.env.NYX_SMTP_STARTTLS || 'true').toLowerCase() !== 'false') {
        await command(socket, 'STARTTLS', 220);
        const upgraded = tls.connect({ socket, servername: host });
        await new Promise<void>((resolve, reject) => {
          upgraded.once('secureConnect', () => resolve());
          upgraded.once('error', reject);
        });
        return this.sendOverSocket(upgraded, job, from, username, password, true);
      }

      return await this.sendOverSocket(socket, job, from, username, password, false, ehlo);
    } finally {
      if (!socket.destroyed) socket.end();
    }
  }

  private async sendOverSocket(socket: net.Socket | tls.TLSSocket, job: EmailJob, from: string, username: string, password: string, greeted = false, priorEhlo?: string): Promise<EmailProviderResult> {
    if (!greeted && !priorEhlo) await command(socket, `EHLO ${process.env.NYX_SMTP_HELO || 'nyx.local'}`, 250);
    if (greeted) await command(socket, `EHLO ${process.env.NYX_SMTP_HELO || 'nyx.local'}`, 250);

    if (username && password) {
      await command(socket, 'AUTH LOGIN', 334);
      await command(socket, encode(username), 334);
      await command(socket, encode(password), 235);
    }

    await command(socket, `MAIL FROM:<${from}>`, 250);
    await command(socket, `RCPT TO:<${job.to}>`, [250, 251]);
    await command(socket, 'DATA', 354);
    socket.write(`${message(job, from)}\r\n.\r\n`);
    const result = await readReply(socket);
    assertCode(result, 250);
    await command(socket, 'QUIT', 221).catch(() => undefined);
    return { id: `smtp-${Date.now()}` };
  }
}
