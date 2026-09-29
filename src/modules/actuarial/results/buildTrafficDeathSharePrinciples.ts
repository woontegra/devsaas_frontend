import type { Beneficiary, TrafficDeathDraft } from "../types/calculationDraft";
import type { TrafficDeathShareRatioPeriod } from "../types/trafficDeathShareRatios";
import type { TrafficDeathPersonLife } from "../types/trafficDeathSupportPeriods";
import { formatDateIso } from "../utils/formatDisplay";

const INTRO =
  "Yargıtay 17. Hukuk Dairesinin yerleşik içtihatları doğrultusunda, desteğin vefatından sonra geride kalan eş, anne, baba ve çocuklar yönünden destek payları hesaplanmaktadır. Bu yöntemde desteğin gelirinden 2 payın kendisine, 2 payın sağ kalan eşe, anne, baba ve çocukların her birine ise 1’er pay ayrılması esas alınmaktadır. Destek görenlerden birinin destek süresinin sona ermesi halinde pay dağılımı yeniden yapılmakta ve sonraki dönem için yeni destek oranları belirlenmektedir.";

const PROBABLE_SPOUSE_KEY = "PROBABLE_SPOUSE";
const PROBABLE_CHILD_1_KEY = "PROBABLE_CHILD_1";
const PROBABLE_CHILD_2_KEY = "PROBABLE_CHILD_2";
const DECEASED_KEY = "deceased";

export interface SharePrinciplesPeriodNote {
  startDate: string;
  endDate: string;
  rangeLabel: string;
  text: string;
}

export interface TrafficDeathSharePrinciplesContent {
  intro: string;
  paragraphs: string[];
  periodNotes: SharePrinciplesPeriodNote[];
}

function nameOf(b: Beneficiary | undefined, fallback: string): string {
  const n = b?.fullName?.trim();
  return n || fallback;
}

function compareIso(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function activeShareKeys(period: TrafficDeathShareRatioPeriod): Set<string> {
  return new Set(
    Object.entries(period.shares ?? {})
      .filter(([, v]) => typeof v === "string" && v.trim() && v.trim() !== "0")
      .map(([k]) => k)
  );
}

function personLabel(
  key: string,
  beneficiariesById: Map<string, Beneficiary>,
  livesById: Map<string, TrafficDeathPersonLife>
): string {
  if (key === DECEASED_KEY) return "müteveffa";
  if (key === PROBABLE_SPOUSE_KEY) return "muhtemel eş";
  if (key === PROBABLE_CHILD_1_KEY) return "farazi 1. çocuk";
  if (key === PROBABLE_CHILD_2_KEY) return "farazi 2. çocuk";

  const ben = beneficiariesById.get(key);
  if (ben) {
    const nm = nameOf(ben, "hak sahibi");
    if (ben.relation === "spouse") return `eş ${nm}`;
    if (ben.relation === "mother") return `anne ${nm}`;
    if (ben.relation === "father") return `baba ${nm}`;
    if (ben.relation === "child") return `çocuk ${nm}`;
    return nm;
  }

  const life = livesById.get(key);
  if (life) {
    if (life.role === "SPOUSE") return "eş";
    if (life.role === "MOTHER") return "anne";
    if (life.role === "FATHER") return "baba";
    if (life.role === "CHILD") return "çocuk";
  }
  return "hak sahibi";
}

function listTurkish(parts: string[]): string {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!;
  if (parts.length === 2) return `${parts[0]} ile ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")} ile ${parts[parts.length - 1]}`;
}

function buildConcreteFileParagraph(draft: TrafficDeathDraft): string | null {
  const spouse = draft.beneficiaries.find((b) => b.relation === "spouse");
  const children = draft.beneficiaries.filter((b) => b.relation === "child");
  const mother = draft.beneficiaries.find((b) => b.relation === "mother");
  const father = draft.beneficiaries.find((b) => b.relation === "father");

  if (!spouse && children.length === 0 && !mother && !father) return null;

  const parts: string[] = ["müteveffanın gelirinin 2 payını kendisine"];

  if (spouse) {
    parts.push(`2 payını sağ kalan eş ${nameOf(spouse, "eş")}’e`);
  }
  if (children.length === 1) {
    parts.push(`1 payını çocuk ${nameOf(children[0], "çocuk")}’a`);
  } else if (children.length > 1) {
    const named = children.map((c, i) => `${nameOf(c, `${i + 1}. çocuk`)}`);
    parts.push(`1’er payını çocuklar ${listTurkish(named)}’a`);
  }
  if (mother && father) {
    parts.push(
      `1’er payını da anne ${nameOf(mother, "anne")} ile baba ${nameOf(father, "baba")}’a`
    );
  } else if (mother) {
    parts.push(`1 payını da anne ${nameOf(mother, "anne")}’e`);
  } else if (father) {
    parts.push(`1 payını da baba ${nameOf(father, "baba")}’a`);
  }

  if (parts.length <= 1) return null;
  const body =
    parts.length === 2
      ? `${parts[0]} ve ${parts[1]}`
      : `${parts.slice(0, -1).join(", ")} ve ${parts[parts.length - 1]}`;
  return `Somut dosyada ${body} ayıracağı kabul edilmiştir.`;
}

function buildParentTransferParagraph(
  draft: TrafficDeathDraft,
  lives: TrafficDeathPersonLife[],
  periods: TrafficDeathShareRatioPeriod[]
): string | null {
  const mother = draft.beneficiaries.find((b) => b.relation === "mother");
  const father = draft.beneficiaries.find((b) => b.relation === "father");
  if (!mother || !father) return null;

  const motherLife = lives.find((p) => p.personId === mother.id);
  const fatherLife = lives.find((p) => p.personId === father.id);
  const motherEnd = motherLife?.effectiveSupportEndDate || motherLife?.supportEndDate || null;
  const fatherEnd = fatherLife?.effectiveSupportEndDate || fatherLife?.supportEndDate || null;
  if (!motherEnd || !fatherEnd) return null;

  // Transfer only if one ends before the other
  if (motherEnd === fatherEnd) return null;

  const fatherFirst = compareIso(fatherEnd, motherEnd) < 0;
  const exited = fatherFirst ? father : mother;
  const remaining = fatherFirst ? mother : father;
  const exitDate = fatherFirst ? fatherEnd : motherEnd;
  const remainingId = remaining.id;

  // Confirm transfer appears in shares after exit
  const after = periods.find(
    (p) =>
      compareIso(p.startDate, exitDate) >= 0 &&
      typeof p.shares?.[remainingId] === "string" &&
      (p.shares[remainingId]!.includes("+") || p.shares[remainingId]!.startsWith("("))
  );
  if (!after) {
    // Still explain if remaining parent continues after exit even without (1+1) display
    const remainingContinues = periods.some(
      (p) =>
        compareIso(p.startDate, exitDate) >= 0 &&
        typeof p.shares?.[remainingId] === "string" &&
        p.shares[remainingId]!.trim() &&
        p.shares[remainingId]!.trim() !== "0"
    );
    if (!remainingContinues) return null;
  }

  const exitedRole = fatherFirst ? "Baba" : "Anne";
  const remainingRole = fatherFirst ? "anne" : "baba";
  return (
    `${exitedRole} ${nameOf(exited, exitedRole.toLowerCase())}’ın destek süresinin ` +
    `${formatDateIso(exitDate)} tarihinde sona ermesi üzerine kendisine ait 1 pay, ` +
    `${remainingRole} ${nameOf(remaining, remainingRole)}’in payına eklenmiş ve ` +
    `${remainingRole} yönünden pay 1+1 olarak değerlendirilmiştir. ` +
    `Ancak anne veya babadan tek kalan kişinin toplam destek oranı %25’i aşmayacak şekilde sınırlandırılmıştır.`
  );
}

function buildChildSupportParagraphs(
  draft: TrafficDeathDraft,
  lives: TrafficDeathPersonLife[]
): string[] {
  const out: string[] = [];
  const deceasedLife = lives.find((p) => p.role === "DECEASED" || p.personId === "deceased");
  const deceasedEnd = deceasedLife?.probableLifeEndDate || null;
  const children = draft.beneficiaries.filter((b) => b.relation === "child");
  for (const child of children) {
    const life = lives.find((p) => p.personId === child.id);
    const ownSupportEnd = life?.supportEndDate || null;
    const effectiveEnd = life?.effectiveSupportEndDate || null;
    if (!ownSupportEnd && !effectiveEnd) continue;

    const gender = child.gender === "female" ? "female" : "male";
    const ageRule =
      gender === "female"
        ? "kız çocuk olması nedeniyle normal şartlarda 22 yaşına kadar destekten yararlanabilecek olmakla birlikte"
        : "erkek çocuk olması nedeniyle normal şartlarda 18 yaşına kadar destekten yararlanabilecek olmakla birlikte";

    if (
      deceasedEnd &&
      ownSupportEnd &&
      effectiveEnd &&
      ownSupportEnd > deceasedEnd &&
      effectiveEnd === deceasedEnd
    ) {
      out.push(
        `Çocuk ${nameOf(child, "çocuk")} ${ageRule}, ` +
          `desteğin muhtemel ömür sonu olan ${formatDateIso(deceasedEnd)} tarihi hesabın nihai sınırı olduğundan ` +
          `destek hesabı bu tarihte sona erdirilmiştir.`
      );
    } else if (effectiveEnd) {
      if (gender === "female") {
        out.push(
          `Çocuk ${nameOf(child, "çocuk")} kız çocuk olması nedeniyle 22 yaşını tamamladığı ` +
            `${formatDateIso(effectiveEnd)} tarihine kadar destekten yararlanacak kabul edilmiştir.`
        );
      } else {
        out.push(
          `Çocuk ${nameOf(child, "çocuk")} erkek çocuk olması nedeniyle 18 yaşını tamamladığı ` +
            `${formatDateIso(effectiveEnd)} tarihine kadar destekten yararlanacak kabul edilmiştir.`
        );
      }
    }
  }
  return out;
}

function buildRemarriageParagraph(draft: TrafficDeathDraft): string | null {
  const spouse = draft.beneficiaries.find((b) => b.relation === "spouse");
  if (!spouse?.remarried || !spouse.remarriageDate) return null;
  return (
    `Sağ kalan eş ${nameOf(spouse, "eş")}, yeniden evlendiği ${formatDateIso(spouse.remarriageDate)} ` +
    `tarihinden itibaren destekten çıkmış kabul edilmiş ve bu tarihten sonraki pay dağılımı ` +
    `eş dışarıda bırakılarak yeniden yapılmıştır.`
  );
}

function buildRearingParagraph(periods: TrafficDeathShareRatioPeriod[]): string | null {
  const rearing = periods.filter((p) => p.label === "Yetiştirme Dönemi");
  if (rearing.length === 0) return null;
  const start = rearing[0]!.startDate;
  const end = rearing[rearing.length - 1]!.endDate;
  return (
    `Müteveffanın yetiştirme/eğitim dönemi devam ettiği süre içinde gelir elde etmeyeceği kabul edildiğinden ` +
    `${formatDateIso(start)} – ${formatDateIso(end)} tarihleri arasında destek payı hesaplanmamıştır.`
  );
}

function buildMilitaryParagraph(
  draft: TrafficDeathDraft,
  periods: TrafficDeathShareRatioPeriod[]
): string | null {
  const military = periods.filter((p) => p.label === "Askerlik Dönemi");
  if (military.length === 0) return null;
  const start =
    draft.deceasedFamilyInfo.militaryServiceStartDate || military[0]!.startDate;
  const end = military[military.length - 1]!.endDate;
  return (
    `Askerlik süresince müteveffanın gelir elde etmeyeceği ve ailesine destek sağlayamayacağı kabul edildiğinden ` +
    `${formatDateIso(start)} – ${formatDateIso(end)} tarihleri arasındaki askerlik döneminde destek payı hesaplanmamıştır.`
  );
}

function buildProbableFamilyParagraphs(periods: TrafficDeathShareRatioPeriod[]): string[] {
  const out: string[] = [];
  let spouseStart: string | null = null;
  let child1Start: string | null = null;
  let child2Start: string | null = null;

  for (const p of periods) {
    const keys = activeShareKeys(p);
    if (!spouseStart && keys.has(PROBABLE_SPOUSE_KEY)) spouseStart = p.startDate;
    if (!child1Start && keys.has(PROBABLE_CHILD_1_KEY)) child1Start = p.startDate;
    if (!child2Start && keys.has(PROBABLE_CHILD_2_KEY)) child2Start = p.startDate;
  }

  if (spouseStart) {
    out.push(
      `Müteveffanın varsayımsal yaşam akışı kapsamında ${formatDateIso(spouseStart)} tarihinde ` +
        `evleneceği kabul edilmiş; bu tarihten itibaren muhtemel eş 2 pay ile hesaba dahil edilmiştir.`
    );
  }

  if (child1Start || child2Start) {
    const bits: string[] = [];
    if (child1Start) bits.push(`farazi 1. çocuk ${formatDateIso(child1Start)} tarihinde`);
    if (child2Start) bits.push(`farazi 2. çocuk ${formatDateIso(child2Start)} tarihinde`);
    out.push(
      `${bits.join(", ")} pay hesabına dahil edilmiş; her birine 1’er pay verilmiş ve ` +
        `her birinin destek süresi 20 yaş ile sınırlandırılmıştır.`
    );
  }

  return out;
}

function describeActiveParticipants(
  keys: Set<string>,
  beneficiariesById: Map<string, Beneficiary>,
  livesById: Map<string, TrafficDeathPersonLife>
): string {
  const labels: string[] = [];
  const orderHint = (k: string): number => {
    if (k === DECEASED_KEY) return 0;
    const b = beneficiariesById.get(k);
    if (b?.relation === "spouse") return 1;
    if (b?.relation === "child") return 2;
    if (b?.relation === "mother") return 3;
    if (b?.relation === "father") return 4;
    if (k === PROBABLE_SPOUSE_KEY) return 5;
    if (k.startsWith("PROBABLE_CHILD")) return 6;
    return 9;
  };

  const sorted = [...keys].filter((k) => k !== DECEASED_KEY).sort((a, b) => orderHint(a) - orderHint(b));
  for (const k of sorted) {
    labels.push(personLabel(k, beneficiariesById, livesById));
  }
  if (labels.length === 0) return "yalnız müteveffa payı";
  return `${listTurkish(labels)} birlikte destek hesabındadır`;
}

function explainTransition(
  prev: TrafficDeathShareRatioPeriod | null,
  curr: TrafficDeathShareRatioPeriod,
  beneficiariesById: Map<string, Beneficiary>,
  livesById: Map<string, TrafficDeathPersonLife>,
  isFirstActive: boolean
): string {
  if (curr.label === "Yetiştirme Dönemi") {
    return "Müteveffanın yetiştirme/eğitim dönemi nedeniyle bu aralıkta destek payı hesaplanmamıştır.";
  }
  if (curr.label === "Askerlik Dönemi") {
    return "Askerlik dönemi nedeniyle bu aralıkta destek payı hesaplanmamıştır.";
  }

  const currKeys = activeShareKeys(curr);
  if (currKeys.size === 0) {
    return "Bu dönemde destek payı hesaplanmamıştır.";
  }

  if (isFirstActive || !prev) {
    return `Başlangıç dönemi: ${describeActiveParticipants(currKeys, beneficiariesById, livesById)}.`;
  }

  const prevKeys = activeShareKeys(prev);
  const removed = [...prevKeys].filter((k) => !currKeys.has(k) && k !== DECEASED_KEY);
  const added = [...currKeys].filter((k) => !prevKeys.has(k) && k !== DECEASED_KEY);

  const parts: string[] = [];

  for (const k of removed) {
    const label = personLabel(k, beneficiariesById, livesById);
    const ben = beneficiariesById.get(k);
    const life = livesById.get(k);
    if (ben?.relation === "father" || life?.role === "FATHER") {
      parts.push(
        `Babanın muhtemel yaşam/destek süresinin sona ermesi nedeniyle baba hesaptan çıkarılmış, payı anneye aktarılmıştır.`
      );
    } else if (ben?.relation === "mother" || life?.role === "MOTHER") {
      parts.push(
        `Annenin destek süresinin sona ermesi nedeniyle anne hesaptan çıkarılmış ve kalan kişiler yönünden pay dağılımı yeniden yapılmıştır.`
      );
    } else if (ben?.relation === "child" || life?.role === "CHILD") {
      const childName = ben ? nameOf(ben, "çocuk") : "çocuk";
      parts.push(
        `Çocuk ${childName} destek yaşını tamamladığı için destek hesabından çıkmıştır.`
      );
    } else if (ben?.relation === "spouse" || life?.role === "SPOUSE" || k === PROBABLE_SPOUSE_KEY) {
      parts.push(`${label} destekten çıkmıştır.`);
    } else if (k.startsWith("PROBABLE_CHILD")) {
      parts.push(`${label} destek süresini tamamladığı için hesaptan çıkmıştır.`);
    } else {
      parts.push(`${label} destek hesabından çıkmıştır.`);
    }
  }

  for (const k of added) {
    if (k === PROBABLE_SPOUSE_KEY) {
      parts.push("Muhtemel eş pay hesabına dahil edilmiştir.");
    } else if (k === PROBABLE_CHILD_1_KEY || k === PROBABLE_CHILD_2_KEY) {
      parts.push("Farazi çocuk pay hesabına dahil edilmiştir.");
    } else {
      parts.push(`${personLabel(k, beneficiariesById, livesById)} pay hesabına dahil edilmiştir.`);
    }
  }

  // Parent share transfer display without key removal already covered
  if (parts.length === 0) {
    if (curr.periodType === "FUTURE" && prev.periodType === "PAST") {
      return "Hesap tarihi sonrası işleyecek dönem; kalan kişiler yönünden pay dağılımı devam etmektedir.";
    }
    return `Pay dağılımı yeniden düzenlenmiştir; ${describeActiveParticipants(currKeys, beneficiariesById, livesById)}.`;
  }

  // Deduplicate similar father/mother messages
  return [...new Set(parts)].join(" ");
}

function buildPeriodNotes(
  periods: TrafficDeathShareRatioPeriod[],
  beneficiariesById: Map<string, Beneficiary>,
  livesById: Map<string, TrafficDeathPersonLife>
): SharePrinciplesPeriodNote[] {
  const notes: SharePrinciplesPeriodNote[] = [];
  let prevActive: TrafficDeathShareRatioPeriod | null = null;
  let sawActive = false;

  for (const period of periods) {
    const keys = activeShareKeys(period);
    const isInactive = Boolean(period.label) || keys.size === 0;
    const isFirstActive = !sawActive && !isInactive;

    const text = explainTransition(
      prevActive,
      period,
      beneficiariesById,
      livesById,
      isFirstActive
    );

    notes.push({
      startDate: period.startDate,
      endDate: period.endDate,
      rangeLabel: `${formatDateIso(period.startDate)} – ${formatDateIso(period.endDate)}`,
      text,
    });

    if (!isInactive) {
      sawActive = true;
      prevActive = period;
    }
  }

  return notes;
}

/**
 * TRAFFIC_DEATH sonuç ekranı — Paylaştırma Esasları metnini mevcut motor çıktısından üretir.
 * Pay motoruna dokunmaz; sahte kişi/tarih üretmez.
 * deceasedProbableLifeEndDate sonrası dönem geçişi / olay yazılmaz.
 */
export function buildTrafficDeathSharePrinciples(params: {
  draft: TrafficDeathDraft;
  shareRatioPeriods: TrafficDeathShareRatioPeriod[];
  personLives: TrafficDeathPersonLife[];
  deceasedProbableLifeEndDate?: string | null;
}): TrafficDeathSharePrinciplesContent | null {
  const { draft, personLives } = params;
  const deceasedEnd =
    params.deceasedProbableLifeEndDate ||
    personLives.find((p) => p.role === "DECEASED" || p.personId === "deceased")
      ?.probableLifeEndDate ||
    null;

  const shareRatioPeriods =
    deceasedEnd
      ? params.shareRatioPeriods.filter((p) => compareIso(p.startDate, deceasedEnd) <= 0).map((p) => ({
          ...p,
          endDate:
            compareIso(p.endDate, deceasedEnd) > 0 ? deceasedEnd : p.endDate,
        }))
      : params.shareRatioPeriods;

  if (!shareRatioPeriods.length && personLives.length === 0) return null;

  const beneficiariesById = new Map(draft.beneficiaries.map((b) => [b.id, b]));
  const livesById = new Map(personLives.map((p) => [p.personId, p]));

  const paragraphs: string[] = [];

  const concrete = buildConcreteFileParagraph(draft);
  if (concrete) paragraphs.push(concrete);

  const parentTransfer = buildParentTransferParagraph(draft, personLives, shareRatioPeriods);
  if (
    parentTransfer &&
    (!deceasedEnd ||
      (() => {
        const mother = draft.beneficiaries.find((b) => b.relation === "mother");
        const father = draft.beneficiaries.find((b) => b.relation === "father");
        const motherEnd =
          personLives.find((p) => p.personId === mother?.id)?.effectiveSupportEndDate ||
          personLives.find((p) => p.personId === mother?.id)?.supportEndDate;
        const fatherEnd =
          personLives.find((p) => p.personId === father?.id)?.effectiveSupportEndDate ||
          personLives.find((p) => p.personId === father?.id)?.supportEndDate;
        if (!motherEnd || !fatherEnd) return true;
        const exitDate = compareIso(fatherEnd, motherEnd) < 0 ? fatherEnd : motherEnd;
        return compareIso(exitDate, deceasedEnd) <= 0;
      })())
  ) {
    paragraphs.push(parentTransfer);
  }

  paragraphs.push(...buildChildSupportParagraphs(draft, personLives));

  const remarriage = buildRemarriageParagraph(draft);
  if (
    remarriage &&
    (!deceasedEnd ||
      !draft.beneficiaries.find((b) => b.relation === "spouse")?.remarriageDate ||
      compareIso(
        draft.beneficiaries.find((b) => b.relation === "spouse")!.remarriageDate!,
        deceasedEnd
      ) <= 0)
  ) {
    paragraphs.push(remarriage);
  }

  const rearing = buildRearingParagraph(shareRatioPeriods);
  if (rearing) paragraphs.push(rearing);

  const military = buildMilitaryParagraph(draft, shareRatioPeriods);
  if (military) paragraphs.push(military);

  paragraphs.push(...buildProbableFamilyParagraphs(shareRatioPeriods));

  if (deceasedEnd) {
    paragraphs.push(
      `Müteveffanın muhtemel ömür sonu olan ${formatDateIso(deceasedEnd)} tarihinde destek hesabı sona ermiştir.`
    );
  }

  // Deduplicate near-identical farazi child lines
  const uniqueParagraphs = [...new Set(paragraphs)];

  const periodNotes = shareRatioPeriods.length
    ? buildPeriodNotes(shareRatioPeriods, beneficiariesById, livesById).filter((note) => {
        if (!deceasedEnd) return true;
        return compareIso(note.startDate, deceasedEnd) <= 0;
      })
    : [];

  return {
    intro: INTRO,
    paragraphs: uniqueParagraphs,
    periodNotes,
  };
}
