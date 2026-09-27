import { fieldErrors, leadSchema } from "@/lib/leadSchema";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = leadSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: "Please fix the highlighted fields", fields: fieldErrors(result.error) },
      { status: 422 }
    );
  }

  const { company, aduId, ...lead } = result.data;
  if (company) {
    return Response.json({ ok: true }, { status: 201 });
  }

  try {
    await prisma.user.create({
      data: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        date: new Date(`${lead.date}T00:00:00Z`),
        time: lead.time,
        productID: aduId,
        placement: lead.placement,
      },
    });
  } catch (error) {
    console.error("Failed to save lead", error);
    return Response.json({ error: "We could not save your request. Please try again." }, { status: 500 });
  }

  return Response.json({ ok: true }, { status: 201 });
}
