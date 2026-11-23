import { Resend } from "resend";
import { isE2eTestModeEnabled } from "./dev-test-auth";
import { env, isProductionDeployment, requireEnv } from "./env";

type SendArgs = { to: string; subject: string; html: string; text: string };

export async function sendEmail({ to, subject, html, text }: SendArgs) {
  if (isE2eTestModeEnabled()) {
    return { id: null, mocked: true as const };
  }

  // Production fails closed: a sign-in email that silently never sends is
  // worse than a visible error.
  const production = isProductionDeployment();
  const apiKey = production
    ? requireEnv("RESEND_API_KEY")
    : env().RESEND_API_KEY;
  const from = production
    ? requireEnv("AUTH_EMAIL_FROM")
    : (env().AUTH_EMAIL_FROM ?? "onboarding@resend.dev");

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
    if (isE2eTestModeEnabled()) {
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
    subject: "Твой вход в Цитатки из Пелевина",
    text: `Привет.\n\nВот твой одноразовый вход:\n${url}\n\nСсылка живёт 15 минут. Если это был не ты — просто игнорируй письмо.`,
    html: `
      <div style="margin:0;padding:32px;background:#0a0a0a;color:#ededed;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5;">
        <div style="max-width:520px;margin:0 auto;border:1px solid #374151;border-radius:16px;background:#111216;padding:28px;">
          <div style="display:inline-block;margin-bottom:18px;border:1px solid #374151;border-radius:999px;padding:6px 10px;color:#9ca3af;font-size:12px;letter-spacing:.08em;text-transform:uppercase;">pelevin-like.app</div>
          <h1 style="margin:0 0 12px;color:#ffffff;font-size:28px;line-height:1.15;">Вход без пароля.</h1>
          <p style="margin:0 0 22px;color:#c7cbd1;font-size:15px;">Нажми кнопку — и ныряй обратно к цитаткам. Ссылка одноразовая, живёт 15 минут.</p>
          <a href="${url}" style="display:inline-block;border:1px solid #ffffff;border-radius:999px;background:#ffffff;color:#0a0a0a;padding:12px 18px;text-decoration:none;font-weight:700;">Нырнуть внутрь</a>
          <p style="margin:22px 0 0;color:#9ca3af;font-size:12px;">Если кнопку съел почтовый клиент, вот прямая ссылка:<br><a href="${url}" style="color:#ededed;word-break:break-all;">${url}</a></p>
          <p style="margin:22px 0 0;color:#6b7280;font-size:12px;">Не запрашивал вход? Значит, реальность опять шумит. Просто игнорируй письмо.</p>
        </div>
      </div>
    `,
  };
}
