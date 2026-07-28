import { useQuery } from "@tanstack/react-query";
import { X, Ruler } from "lucide-react";
import { fetchSizeGuideForCategory } from "@/lib/size-guides";

export function SizeGuideButton({ categoryId, className = "" }: { categoryId: string | null; className?: string }) {
  const { data: guide } = useQuery({
    queryKey: ["size-guide", categoryId],
    queryFn: () => fetchSizeGuideForCategory(categoryId),
  });
  const has = !!guide;

  const dialogId = "size-guide-dialog";
  if (!has) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => (document.getElementById(dialogId) as HTMLDialogElement)?.showModal()}
        className={`inline-flex items-center gap-2 text-xs tracked-wide text-muted-foreground hover:text-[color:var(--gold-bright)] underline underline-offset-4 ${className}`}
      >
        <Ruler className="h-3.5 w-3.5" />
        Size Guide
      </button>
      <dialog
        id={dialogId}
        className="p-0 bg-transparent backdrop:bg-black/80 backdrop:backdrop-blur-sm"
        onClick={(e) => {
          const el = e.currentTarget;
          const r = el.getBoundingClientRect();
          if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) el.close();
        }}
      >
        <div className="w-[min(720px,92vw)] max-h-[85vh] overflow-y-auto bg-card border border-[color:var(--gold)]/30 text-foreground">
          <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-card">
            <h3 className="font-display text-xl tracked-wide gold-gradient-text">
              {guide?.name || "Size Guide"}
            </h3>
            <button
              onClick={() => (document.getElementById(dialogId) as HTMLDialogElement)?.close()}
              className="h-8 w-8 grid place-items-center hover:bg-white/5"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-6 space-y-6">
            {guide?.image_url && (
              <img src={guide.image_url} alt="Size chart" className="w-full border border-white/10" />
            )}
            {guide?.content_html && (
              <div
                className="prose prose-invert prose-sm max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: guide.content_html }}
              />
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
