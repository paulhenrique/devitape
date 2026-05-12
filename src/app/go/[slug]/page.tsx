import { redirect } from "next/navigation";
import fs from "fs";
import path from "path";
import RedirectCountdown from "@/components/RedirectCountdown";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function RedirectPage({ params }: PageProps) {
  const { slug } = await params;
  
  const linksPath = path.join(process.cwd(), "content/links.json");
  let links: Record<string, string> = {};

  try {
    if (fs.existsSync(linksPath)) {
      const fileContents = fs.readFileSync(linksPath, "utf8");
      links = JSON.parse(fileContents);
    }
  } catch (error) {
    console.error("Erro ao carregar links.json:", error);
  }

  const targetUrl = links[slug];

  if (!targetUrl) {
    redirect("/");
  }

  return <RedirectCountdown targetUrl={targetUrl} />;
}
