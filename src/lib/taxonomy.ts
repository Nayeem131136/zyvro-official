import { supabase } from "@/integrations/supabase/client";

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}
export interface Collection {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}
export interface Color {
  id: string;
  name: string;
  hex: string;
  sort_order: number;
}
export interface Size {
  id: string;
  name: string;
  sort_order: number;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,sort_order")
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return data ?? [];
}
export async function fetchCollections(): Promise<Collection[]> {
  const { data, error } = await supabase
    .from("collections")
    .select("id,name,slug,sort_order")
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return data ?? [];
}
export async function fetchColors(): Promise<Color[]> {
  const { data, error } = await supabase
    .from("colors")
    .select("id,name,hex,sort_order")
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return data ?? [];
}
export async function fetchSizes(): Promise<Size[]> {
  const { data, error } = await supabase
    .from("sizes")
    .select("id,name,sort_order")
    .order("sort_order")
    .order("name");
  if (error) throw error;
  return data ?? [];
}
