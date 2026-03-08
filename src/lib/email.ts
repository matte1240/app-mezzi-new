import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
});

export async function sendDeadlineReminder({
  to,
  vehiclePlate,
  deadlineType,
  dueDate,
  daysRemaining,
}: {
  to: string;
  vehiclePlate: string;
  deadlineType: string;
  dueDate: Date;
  daysRemaining: number;
}) {
  const formattedDate = dueDate.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const subject =
    daysRemaining <= 0
      ? `⚠️ SCADUTA: ${deadlineType} — ${vehiclePlate}`
      : `🔔 Promemoria: ${deadlineType} — ${vehiclePlate} tra ${daysRemaining}gg`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${daysRemaining <= 0 ? "#dc2626" : "#f59e0b"}; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">${daysRemaining <= 0 ? "Scadenza superata" : "Promemoria scadenza"}</h2>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Mezzo</td>
            <td style="padding: 8px 0;">${vehiclePlate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Tipo</td>
            <td style="padding: 8px 0;">${deadlineType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Data scadenza</td>
            <td style="padding: 8px 0;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Giorni rimanenti</td>
            <td style="padding: 8px 0; color: ${daysRemaining <= 0 ? "#dc2626" : daysRemaining <= 7 ? "#f59e0b" : "#16a34a"}; font-weight: bold;">
              ${daysRemaining <= 0 ? `Scaduta da ${Math.abs(daysRemaining)} giorni` : `${daysRemaining} giorni`}
            </td>
          </tr>
        </table>
        <p style="margin-top: 16px; color: #6b7280; font-size: 13px;">
          Questo messaggio è stato inviato automaticamente dal sistema Gestione Mezzi.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "noreply@mezzi.local",
    to,
    subject,
    html,
  });
}
