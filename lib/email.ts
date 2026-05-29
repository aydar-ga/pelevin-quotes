import { Resend } from "resend";

type SendArgs = { to: string; subject: string; html: string; text: string };

export async function sendEmail({ to, subject, html, text }: SendArgs) {
  if (process.env.E2E_TEST_MODE === "true") {
    return { id: null, mocked: true as const };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM ?? "onboarding@resend.dev";

  if (!apiKey) {
    console.warn(
      "[email] RESEND_API_KEY not set — magic link will not be delivered. " +
        "URL is still captured in memory and visible via /api/test/last-magic-link (when E2E_TEST_MODE=true).",
    );
    return { id: null, mocked: true as const };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text,
  });
  if (error) {
    if (process.env.E2E_TEST_MODE === "true") {
      console.warn(
        `[email] Resend failed in E2E mode (${error.message}) — magic link remains in memory.`,
      );
      return { id: null, mocked: true as const };
    }
    throw new Error(`Resend failed: ${error.message}`);
  }
  return { id: data?.id ?? null, mocked: false as const };
}

export function magicLinkEmail(url: string) {
  return {
    subject: "Вход в Цитатки из Пелевина",
    text: `Привет!\n\nПерейди по ссылке, чтобы войти:\n${url}\n\nЕсли ты не запрашивал вход — просто игнорируй это письмо.`,
    html: `
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.5; color: #111;">
        <h2 style="margin: 0 0 16px;">Цитатки из Пелевина</h2>
        <p>Привет! Жми кнопку, чтобы войти:</p>
        <p>
          <a href="${url}" style="display:inline-block;padding:12px 20px;background:#0a0a0a;color:#fff;border:2px solid #fbbf24;border-radius:6px;text-decoration:none;font-weight:600;">▶ Войти</a>
        </p>
        <p style="font-size:12px;color:#666;">Ссылка одноразовая и сгорает через 15 минут. Не запрашивал вход — просто проигнорируй.</p>
      </div>
    `,
  };
}
