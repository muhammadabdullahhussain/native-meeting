export default async function sitemap() {
  const site =
    process.env.NEXT_PUBLIC_SITE_URL || "https://interesta.vercel.app";
  const now = new Date();
  const routes = ["", "about", "help", "join", "legal", "pricing", "safety"];
  return routes.map((r) => ({
    url: `${site}/${r}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: r === "" ? 1 : 0.7,
  }));
}
