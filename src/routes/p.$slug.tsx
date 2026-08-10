import { createFileRoute, notFound } from "@tanstack/react-router";
import { SectionShell } from "@/components/site/SectionShell";
import { Reveal } from "@/components/site/GlitchText";
import { getCustomPage } from "@/lib/public.functions";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const page = await getCustomPage({ data: { slug: params.slug } });
    if (!page) throw notFound();
    return { page };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Page not found — BLACK HAT#0 '26" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.page.title} — BLACK HAT#0 '26`;
    const description =
      loaderData.page.seo_description ||
      loaderData.page.subtitle ||
      `${loaderData.page.title} at BLACK HAT ZERO '26.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: PageMissing,
  component: CustomPage,
});

function PageMissing() {
  return (
    <div className="pt-32 pb-24 text-center">
      <p className="font-mono text-[11px] tracking-[0.4em] text-primary">// 404</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-widest uppercase">
        Page not found
      </h1>
    </div>
  );
}

function CustomPage() {
  const { page } = Route.useLoaderData();
  return (
    <div className="pt-24">
      <SectionShell
        eyebrow={`// ${page.title.toUpperCase()}`}
        title={page.title}
        subtitle={page.subtitle ?? undefined}
      >
        {page.body ? (
          <Reveal>
            <div className="panel clip-notch space-y-4 p-6">
              {page.body.split(/\n{2,}/).map((para, i) => (
                <p key={i} className="text-sm whitespace-pre-line text-muted-foreground">
                  {para}
                </p>
              ))}
            </div>
          </Reveal>
        ) : null}
      </SectionShell>
    </div>
  );
}
