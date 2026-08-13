import net from 'node:net';
import tls from 'node:tls';
import type { Socket } from 'node:net';

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  from?: string;
  replyTo?: string;
  draftId?: string;
}

export interface EmailDeliveryResult {
  success: true;
  provider: 'resend' | 'smtp';
  messageId: string;
  recipient: string;
  deliveredAt: string;
}

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function assertHeader(value: string, field: string): string {
  const clean = String(value || '').trim();
  if (!clean || /[\r\n]/.test(clean)) throw new Error(`invalid_${field}`);
  return clean;
}

function extractAddress(value: string): string {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] || value).trim();
}

function assertEmail(value: string, field: string): string {
  const clean = assertHeader(value, field);
  const address = extractAddress(clean);
  if (!EMAIL_RE.test(address)) throw new Error(`invalid_${field}`);
  return clean;
}

function encodeSubject(subject: string): string {
  return `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
}

async function sendViaResend(payload: EmailPayload): Promise<EmailDeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = payload.from || process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error('resend_not_configured');

  const to = assertEmail(payload.to, 'recipient_email');
  assertEmail(from, 'from_email');
  const subject = assertHeader(payload.subject, 'subject');
  const replyTo = payload.replyTo ? assertEmail(payload.replyTo, 'reply_to') : undefined;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [extractAddress(to)],
      subject,
      text: String(payload.body || ''),
      ...(replyTo ? { reply_to: extractAddress(replyTo) } : {})
    }),
    signal: AbortSignal.timeout(15000)
  });

  const data: any = await response.json().catch(() => ({}));
  if (!response.ok || !data?.id) {
    throw new Error(`resend_${response.status}_${String(data?.message || data?.error || 'send_failed')}`);
  }

  return {
    success: true,
    provider: 'resend',
    messageId: String(data.id),
    recipient: extractAddress(to),
    deliveredAt: new Date().toISOString()
  };
}

type SmtpSocket = Socket | tls.TLSSocket;

function connectPlain(host: string, port: number): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    socket.setTimeout(15000);
    socket.once('connect', () => resolve(socket));
    socket.once('error', reject);
    socket.once('timeout', () => reject(new Error('smtp_timeout')));
  });
}

function connectTls(host: string, port: number): Promise<tls.TLSSocket> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port, servername: host, minVersion: 'TLSv1.2' });
    socket.setTimeout(15000);
    socket.once('secureConnect', () => resolve(socket));
    socket.once('error', reject);
    socket.once('timeout', () => reject(new Error('smtp_timeout')));
  });
}

function upgradeTls(socket: Socket, host: string): Promise<tls.TLSSocket> {
  return new Promise((resolve, reject) => {
    const secure = tls.connect({ socket, servername: host, minVersion: 'TLSv1.2' });
    secure.setTimeout(15000);
    secure.once('secureConnect', () => resolve(secure));
    secure.once('error', reject);
    secure.once('timeout', () => reject(new Error('smtp_timeout')));
  });
}

function readReply(socket: SmtpSocket): Promise<{ code: number; text: string }> {
  return new Promise((resolve, reject) => {
    let accumulated = '';
    const lines: string[] = [];

    const cleanup = () => {
      socket.off('data', onData);
      socket.off('error', onError);
      socket.off('timeout', onTimeout);
    };
    const onError = (error: Error) => { cleanup(); reject(error); };
    const onTimeout = () => { cleanup(); reject(new Error('smtp_timeout')); };
    const onData = (chunk: Buffer) => {
      accumulated += chunk.toString('utf8');
      const parts = accumulated.split(/\r?\n/);
      accumulated = parts.pop() || '';
      for (const line of parts) {
        if (!line) continue;
        lines.push(line);
        const match = line.match(/^(\d{3}) ([\s\S]*)$/);
        if (match) {
          cleanup();
          resolve({ code: Number(match[1]), text: lines.join('\n') });
          return;
        }
      }
    };

    socket.on('data', onData);
    socket.once('error', onError);
    socket.once('timeout', onTimeout);
  });
}

async function command(socket: SmtpSocket, line: string, accepted: number[]): Promise<{ code: number; text: string }> {
  socket.write(`${line}\r\n`);
  const reply = await readReply(socket);
  if (!accepted.includes(reply.code)) throw new Error(`smtp_${reply.code}_${reply.text.slice(0, 160)}`);
  return reply;
}

async function sendViaSmtp(payload: EmailPayload): Promise<EmailDeliveryResult> {
  const host = String(process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const username = String(process.env.SMTP_USER || '').trim();
  const password = String(process.env.SMTP_PASS || '');
  const from = payload.from || process.env.SMTP_FROM || process.env.EMAIL_FROM || username;
  const implicitTls = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  const requireStartTls = !implicitTls && String(process.env.SMTP_STARTTLS || 'true').toLowerCase() !== 'false';

  if (!host || !from) throw new Error('smtp_not_configured');
  const to = assertEmail(payload.to, 'recipient_email');
  assertEmail(from, 'from_email');
  const subject = assertHeader(payload.subject, 'subject');
  const replyTo = payload.replyTo ? assertEmail(payload.replyTo, 'reply_to') : undefined;

  let socket: SmtpSocket = implicitTls ? await connectTls(host, port) : await connectPlain(host, port);

  try {
    const greeting = await readReply(socket);
    if (greeting.code !== 220) throw new Error(`smtp_${greeting.code}_greeting_failed`);

    const helo = String(process.env.SMTP_HELO || 'nyx.local').replace(/[^a-zA-Z0-9.-]/g, '') || 'nyx.local';
    await command(socket, `EHLO ${helo}`, [250]);

    if (requireStartTls) {
      await command(socket, 'STARTTLS', [220]);
      socket = await upgradeTls(socket as Socket, host);
      await command(socket, `EHLO ${helo}`, [250]);
    }

    if (username || password) {
      if (!username || !password) throw new Error('smtp_credentials_incomplete');
      await command(socket, 'AUTH LOGIN', [334]);
      await command(socket, Buffer.from(username).toString('base64'), [334]);
      await command(socket, Buffer.from(password).toString('base64'), [235]);
    }

    await command(socket, `MAIL FROM:<${extractAddress(from)}>`, [250]);
    await command(socket, `RCPT TO:<${extractAddress(to)}>`, [250, 251]);
    await command(socket, 'DATA', [354]);

    const localMessageId = `<nyx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@${helo}>`;
    const safeBody = String(payload.body || '').replace(/\r?\n\./g, '\r\n..').replace(/\r?\n/g, '\r\n');
    const headers = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${encodeSubject(subject)}`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: ${localMessageId}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      ...(replyTo ? [`Reply-To: ${replyTo}`] : [])
    ];

    socket.write(`${headers.join('\r\n')}\r\n\r\n${safeBody}\r\n.\r\n`);
    const queued = await readReply(socket);
    if (queued.code !== 250) throw new Error(`smtp_${queued.code}_${queued.text.slice(0, 160)}`);
    await command(socket, 'QUIT', [221]).catch(() => undefined);

    return {
      success: true,
      provider: 'smtp',
      messageId: localMessageId,
      recipient: extractAddress(to),
      deliveredAt: new Date().toISOString()
    };
  } finally {
    socket.end();
  }
}

export function getEmailProviderStatus() {
  if (process.env.RESEND_API_KEY && (process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM)) {
    return { configured: true, provider: 'resend' as const };
  }
  if (process.env.SMTP_HOST && (process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER)) {
    return { configured: true, provider: 'smtp' as const };
  }
  return { configured: false, provider: null };
}

export async function sendOutboundEmail(payload: EmailPayload): Promise<EmailDeliveryResult> {
  if (process.env.RESEND_API_KEY) return sendViaResend(payload);
  if (process.env.SMTP_HOST) return sendViaSmtp(payload);
  throw new Error('email_provider_not_configured');
}
