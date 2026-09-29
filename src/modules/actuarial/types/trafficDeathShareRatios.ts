/**
 * TRAFFIC_DEATH pay oranları cetveli — motor çıktısı modeli.
 * Hesap motoru çalıştığında dönem satırları bu yapıda üretilecek.
 */

export interface TrafficDeathShareRatioPeriod {
  /** Dönem başlangıcı (ISO yyyy-MM-dd) */
  startDate: string;
  /** Dönem bitişi (ISO yyyy-MM-dd) */
  endDate: string;
  /** İsteğe bağlı dönem etiketi (ör. askerlik, evlilik) */
  label?: string;
  /** İşlemiş / işleyecek dönem ayrımı */
  periodType?: "PAST" | "FUTURE";
  /**
   * Pay dağılımı — kesir gösterimi ("2/6", "1/7", "(1+1)/7")
   */
  shares: Record<string, string>;
  /**
   * Yüzdesel pay dağılımı — "%25", "%16,67" vb.
   */
  percentages?: Record<string, string>;
}

export interface TrafficDeathShareRatioTableResult {
  periods: TrafficDeathShareRatioPeriod[];
}

/** Motor / API yanıtından pay oranları tablosunu okur. */
export function extractTrafficDeathShareRatioPeriods(
  source: unknown
): TrafficDeathShareRatioPeriod[] {
  if (!source || typeof source !== "object") return [];
  const obj = source as Record<string, unknown>;
  if (Array.isArray(obj.shareRatioPeriods)) {
    return obj.shareRatioPeriods as TrafficDeathShareRatioPeriod[];
  }
  if (obj.shareRatioTable && typeof obj.shareRatioTable === "object") {
    const table = obj.shareRatioTable as TrafficDeathShareRatioTableResult;
    if (Array.isArray(table.periods)) return table.periods;
  }
  return [];
}
