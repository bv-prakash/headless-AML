import { decodeHtmlEntities } from "./decodeHtmlEntities";

export function stripHtml(html: string): string {
  const decoded = decodeHtmlEntities(html);
  return decoded.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}
