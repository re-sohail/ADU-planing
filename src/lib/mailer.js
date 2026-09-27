import "server-only";
import nodemailer from "nodemailer";
import { requireEnv } from "@/lib/env";
import { formatBedsBaths, getAduArea } from "@/data/aduCatalog";

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = requireEnv(
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS"
  );
  const port = Number(SMTP_PORT);

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

function describeAppointment(lead, adu) {
  return [
    `ADU model: ${adu.name} (${formatBedsBaths(adu)}, ${getAduArea(adu)} sq ft)`,
    `Property address: ${lead.address}`,
    `Appointment: ${lead.date} at ${lead.time}`,
    `Phone: ${lead.phone}`,
    `Email: ${lead.email}`,
  ].join("\n");
}

export async function sendLeadEmails(lead, adu) {
  const { MAIL_FROM, LEAD_NOTIFY_EMAIL } = requireEnv("MAIL_FROM", "LEAD_NOTIFY_EMAIL");
  const mailer = getTransporter();
  const details = describeAppointment(lead, adu);

  await Promise.all([
    mailer.sendMail({
      from: MAIL_FROM,
      to: lead.email,
      subject: "Your ADU consultation is booked",
      text: `Hi ${lead.name},\n\nThanks for booking a consultation. Here are your details:\n\n${details}\n\nWe will contact you before the appointment to confirm.\n\nPacific Manufactured Homes`,
    }),
    mailer.sendMail({
      from: MAIL_FROM,
      to: LEAD_NOTIFY_EMAIL,
      replyTo: lead.email,
      subject: `New ADU lead: ${lead.name}`,
      text: `New consultation request from ${lead.name}.\n\n${details}\n\nPlacement: ${lead.placement.lat.toFixed(6)}, ${lead.placement.lng.toFixed(6)}, rotated ${lead.placement.rotation}°`,
    }),
  ]);
}
