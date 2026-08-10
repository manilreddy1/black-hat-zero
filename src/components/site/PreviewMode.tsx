import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { previewContentQuery, usePreviewMode } from "@/hooks/useSiteContent";
import { supabase } from "@/integrations/supabase/client";

/**
 * When ?preview=1 is present, staff see unpublished/hidden content live:
 * the preview payload replaces the cached public site content and refreshes
 * every few seconds so console edits appear without publishing.
 */
export function PreviewMode() {
  const preview = usePreviewMode();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Draft content is staff-only: without a session the server fn 401s, so
  // only fetch once we know a session exists.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(Boolean(session));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const { data, error, isFetching, dataUpdatedAt } = useQuery({
    ...previewContentQuery,
    enabled: preview && signedIn === true,
    refetchInterval: preview && signedIn === true ? 4000 : false,
  });


  useEffect(() => {
    if (preview && data) qc.setQueryData(["site-content"], data);
  }, [preview, data, dataUpdatedAt, qc]);

  useEffect(() => {
    if (!preview) return;
    document.body.classList.add("preview-bar");
    return () => {
      document.body.classList.remove("preview-bar");
    };
  }, [preview]);

  if (!preview) return null;

  const failed = Boolean(error);

  return (
    <div className="fixed inset-x-0 top-0 z-[100] border-b border-primary/60 bg-primary/15 backdrop-blur-md">
      <div className="mx-auto flex h-[34px] max-w-7xl items-center justify-between gap-3 px-4">
        <p className="truncate font-mono text-[10px] tracking-[0.25em] text-primary uppercase">
          {failed
            ? "// PREVIEW UNAVAILABLE — STAFF SIGN-IN REQUIRED"
            : `// PREVIEW MODE — DRAFT CONTENT VISIBLE${isFetching ? " · SYNCING" : ""}`}
        </p>
        <a
          href={pathname}
          className="shrink-0 border border-primary/60 px-2 py-0.5 font-mono text-[10px] tracking-[0.2em] text-primary uppercase hover:bg-primary hover:text-primary-foreground"
        >
          Exit
        </a>
      </div>
    </div>
  );
}
