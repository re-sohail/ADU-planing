import { ADU_CATALOG } from "@/data/aduCatalog";

export function GET() {
  return Response.json({ adus: ADU_CATALOG });
}
