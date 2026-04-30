export function formatPriceInfo(priceUsed: number | null, priceNew: number | null): string {
  if (priceUsed == null && priceNew == null) return "";
  const parts: string[] = [];
  if (priceUsed != null) parts.push(`中古: ¥${priceUsed.toLocaleString()}`);
  if (priceNew != null) parts.push(`未使用: ¥${priceNew.toLocaleString()}`);
  return `（${parts.join(" / ")}）`;
}