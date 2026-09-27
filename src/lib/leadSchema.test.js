import { describe, expect, it } from "vitest";
import { fieldErrors, leadSchema } from "./leadSchema";

const base = {
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "(555) 123-4567",
  address: "1400 Young St, Dallas, TX",
  aduId: "studio-400",
  placement: { lat: 32.7, lng: -96.7, rotation: 90, flipped: false },
};

function nextWeekday(day) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 7 + ((day - date.getUTCDay() + 7) % 7));
  return date.toISOString().slice(0, 10);
}

function errorsFor(values) {
  const result = leadSchema.safeParse({ ...base, ...values });
  return result.success ? {} : fieldErrors(result.error);
}

describe("leadSchema", () => {
  it("accepts a valid lead and normalizes the phone number", () => {
    const result = leadSchema.parse({ ...base, date: nextWeekday(1), time: "09:00" });
    expect(result.phone).toBe("5551234567");
  });

  it("rejects Sundays", () => {
    expect(errorsFor({ date: nextWeekday(0), time: "10:00" }).date).toMatch(/Sunday/);
  });

  it("uses the later opening time on Tuesdays", () => {
    expect(errorsFor({ date: nextWeekday(2), time: "10:00" }).time).toMatch(/11:00/);
    expect(errorsFor({ date: nextWeekday(2), time: "11:00" })).toEqual({});
  });

  it("rejects closing time and past dates", () => {
    expect(errorsFor({ date: nextWeekday(3), time: "17:00" }).time).toBeDefined();
    expect(errorsFor({ date: "2020-01-06", time: "10:00" }).date).toMatch(/future/);
  });

  it("rejects unknown ADU models and missing placement", () => {
    const errors = errorsFor({ date: nextWeekday(4), time: "10:00", aduId: "unknown", placement: undefined });
    expect(errors.aduId).toBeDefined();
    expect(errors.placement).toBeDefined();
  });
});
