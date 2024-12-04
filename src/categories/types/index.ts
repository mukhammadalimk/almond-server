export type Translations = Array<{ lang: string; name: string }>;

export interface UpdateOrCreateCategoryRequestBody {
  translations: Translations;
  slug: string;
  parent_category_id: string;
}

// Define the response structure
export interface CustomizedCategoryResponse {
  id: string;
  legacy_id: number;
  slug: string;
  full_slug: string;
  name: string;
}
