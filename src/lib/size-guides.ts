import { supabase } from "@/integrations/supabase/client";

export interface SizeGuide {
  id: string;
  category_id: string | null;
  name: string;
  content_html: string | null;
  image_url: string | null;
  sort_order: number;
}

export async function fetchSizeGuides(): Promise<SizeGuide[]> {
  const { data, error } = await supabase
    .from("size_guides")
    .select("*")
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchSizeGuideForCategory(categoryId: string | null): Promise<SizeGuide | null> {
  const guides = await fetchSizeGuides();
  if (categoryId) {
    const match = guides.find((g) => g.category_id === categoryId);
    if (match) return match;
  }
  return guides.find((g) => g.category_id === null) ?? guides[0] ?? null;
}
