import { z } from "zod";
import { getAduById } from "@/data/aduCatalog";

export const BUSINESS_HOURS = [
  { label: "Monday", day: 1, open: "09:00", close: "17:00" },
  { label: "Tuesday", day: 2, open: "11:00", close: "17:00" },
  { label: "Wednesday", day: 3, open: "09:00", close: "17:00" },
  { label: "Thursday", day: 4, open: "09:00", close: "17:00" },
  { label: "Friday", day: 5, open: "09:00", close: "17:00" },
  { label: "Saturday", day: 6, open: "09:00", close: "17:00" },
];

export function getHoursForDate(date) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return BUSINESS_HOURS.find((hours) => hours.day === day) ?? null;
}

export function todayIso() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function yesterdayIso() {
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10);
}

export const placementSchema = z.object(
  {
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    rotation: z.number().min(0).max(360),
    flipped: z.boolean(),
  },
  { error: "Place your ADU on the map first" }
);

export const leadSchema = z
  .object({
    name: z.string({ error: "Enter your full name" }).trim().min(2, "Enter your full name").max(100),
    email: z.email({ error: "Enter a valid email address" }).max(200),
    phone: z
      .string({ error: "Enter a valid phone number" })
      .transform((value) => value.replace(/[^\d+]/g, ""))
      .pipe(z.string().regex(/^\+?\d{10,15}$/, "Enter a valid phone number")),
    address: z.string({ error: "Enter the property address" }).trim().min(5, "Enter the property address").max(200),
    date: z.iso.date({ error: "Choose a date" }),
    time: z.string({ error: "Choose a time" }).regex(/^\d{2}:\d{2}$/, "Choose a time"),
    aduId: z.string({ error: "Choose an ADU model" }).refine((id) => getAduById(id) !== null, "Choose an ADU model"),
    placement: placementSchema,
    company: z.string().optional(),
  })
  .superRefine(({ date, time }, ctx) => {
    if (date < yesterdayIso()) {
      ctx.addIssue({ code: "custom", path: ["date"], message: "Choose a future date" });
      return;
    }

    const hours = getHoursForDate(date);
    if (!hours) {
      ctx.addIssue({ code: "custom", path: ["date"], message: "We are closed on Sundays" });
      return;
    }

    if (time < hours.open || time >= hours.close) {
      ctx.addIssue({
        code: "custom",
        path: ["time"],
        message: `Choose a time between ${hours.open} and ${hours.close}`,
      });
    }
  });

export function fieldErrors(error) {
  const errors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}
