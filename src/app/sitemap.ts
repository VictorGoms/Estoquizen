import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/* /sitemap.xml (EQZ-47): só as páginas públicas que valem aparecer no Google */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`,            changeFrequency: "weekly",  priority: 1 },
    { url: `${SITE_URL}/register`,    changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/termos`,      changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE_URL}/privacidade`, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE_URL}/licencas`,    changeFrequency: "yearly",  priority: 0.1 },
  ];
}
