import { getAduById } from "@/data/aduCatalog";

export async function GET(request, { params }) {
  const { id } = await params;
  const adu = getAduById(id);

  if (!adu) {
    return Response.json({ error: "ADU not found" }, { status: 404 });
  }
  return Response.json({ adu });
}
