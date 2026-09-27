"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { usePlanner } from "@/context/PlannerContext";
import { BUSINESS_HOURS, fieldErrors, getHoursForDate, leadSchema, todayIso } from "@/lib/leadSchema";

const HOURS_SUMMARY = [
  { days: "Monday, Wednesday – Saturday", hours: "9:00 am – 5:00 pm" },
  { days: "Tuesday", hours: "11:00 am – 5:00 pm" },
  { days: "Sunday", hours: "Closed" },
];

export function LeadForm({ aduId, placement, defaultAddress }) {
  const router = useRouter();
  const { markSubmitted } = usePlanner();
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    address: defaultAddress ?? "",
    date: "",
    time: "",
    company: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hours = values.date ? getHoursForDate(values.date) : null;

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = { ...values, aduId, placement };
    const result = leadSchema.safeParse(payload);
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrors(data.fields ?? {});
        toast.error(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      markSubmitted();
      router.push("/adus/successful-submission");
    } catch {
      toast.error("Network error. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Book your free consultation</h1>
        <p className="text-sm text-muted">We will review your lot and ADU placement with you.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label="Full name" autoComplete="name" value={values.name} onChange={handleChange} error={errors.name} />
        <Field id="email" label="Email" type="email" autoComplete="email" value={values.email} onChange={handleChange} error={errors.email} />
        <Field id="phone" label="Phone" type="tel" autoComplete="tel" placeholder="(555) 123-4567" value={values.phone} onChange={handleChange} error={errors.phone} />
        <Field id="address" label="Property address" autoComplete="street-address" value={values.address} onChange={handleChange} error={errors.address} />
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Pick an appointment time</h2>
          <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-6">
            {HOURS_SUMMARY.map((row) => (
              <div key={row.days} className="contents">
                <dt className="text-muted">{row.days}</dt>
                <dd className="text-ink">{row.hours}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="date" label="Date" type="date" min={todayIso()} value={values.date} onChange={handleChange} error={errors.date} />
          <Field
            id="time"
            label="Time"
            type="time"
            step={900}
            min={hours?.open ?? BUSINESS_HOURS[0].open}
            max={hours?.close ?? BUSINESS_HOURS[0].close}
            value={values.time}
            onChange={handleChange}
            error={errors.time}
          />
        </div>
      </div>

      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" value={values.company} onChange={handleChange} />
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Link href="/adus" className={buttonStyles({ variant: "secondary" })}>
          <ArrowLeft className="size-4" /> Back to map
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? "Booking…" : "Book consultation"}
        </Button>
      </div>
    </form>
  );
}
