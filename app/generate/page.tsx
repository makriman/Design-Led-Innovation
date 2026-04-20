import { GenerateJourney } from "@/components/GenerateJourney";
import { requireSessionUser } from "@/lib/server-auth";

export default async function GenerateLoaderPage() {
  await requireSessionUser();
  return <GenerateJourney />;
}
