/**
 * TRH-2010 yaşam tablosu — kullanıcının verdiği tabloya göre (0–99 yaş).
 * Her yaş için bakiye ömür: { year, month, day }.
 * ERKEK ve KADIN için verdiğiniz değerler kullanıldı; ara yaşlar bu noktalar arasında interpolasyonla dolduruldu.
 */

export interface Trh2010LifeEntry {
  year: number;
  month: number;
  day: number;
}

export type Trh2010Table = Record<number, Trh2010LifeEntry>;

/** Verdiğiniz görseldeki TRH-2010 ERKEK değerleri (yaş → yıl, ay, gün) */
const TRH2010_ERKEK_VERILEN: Record<number, [number, number, number]> = {
  0:[71,11,5],
1:[72,4,6],
2:[71,5,1],
3:[70,5,19],
4:[69,6,7],
5:[68,6,25],
6:[67,7,6],
7:[66,7,17],
8:[65,7,28],
9:[64,8,5],
10:[63,8,12],
11:[62,8,19],
12:[61,8,26],
13:[60,9,4],
14:[59,9,11],
15:[58,9,18],
16:[57,10,2],
17:[56,10,13],
18:[55,10,28],
19:[54,11,12],
20:[53,11,26],
21:[53,0,14],
22:[52,1,2],
23:[51,1,20],
24:[50,2,8],
25:[49,2,26],
26:[48,3,11],
27:[47,3,29],
28:[46,4,13],
29:[45,4,28],
30:[44,5,12],
31:[43,5,27],
32:[42,6,14],
33:[41,6,29],
34:[40,7,13],
35:[39,8,1],
36:[38,8,19],
37:[37,9,7],
38:[36,9,22],
39:[35,10,13],
40:[34,11,5],
41:[33,11,26],
42:[33,0,18],
43:[32,1,13],
44:[31,2,8],
45:[30,3,7],
46:[29,4,10],
47:[28,5,16],
48:[27,6,22],
49:[26,8,1],
50:[25,9,14],
51:[24,11,5],
52:[24,0,22],
53:[23,2,16],
54:[22,4,13],
55:[21,6,14],
56:[20,8,26],
57:[19,11,8],
58:[19,1,24],
59:[18,4,17],
60:[17,7,13],
61:[16,10,17],
62:[16,1,20],
63:[15,5,1],
64:[14,8,19],
65:[14,0,14],
66:[13,4,13],
67:[12,8,19],
68:[12,0,29],
69:[11,5,19],
70:[10,10,13],
71:[10,3,14],
72:[9,8,23],
73:[9,2,12],
74:[8,8,5],
75:[8,2,1],
76:[7,8,8],
77:[7,2,26],
78:[6,9,22],
79:[6,4,24],
80:[5,11,26],
81:[5,7,2],
82:[5,2,23],
83:[4,10,24],
84:[4,6,25],
85:[4,3,0],
86:[3,11,5],
87:[3,7,20],
88:[3,4,13],
89:[3,1,13],
90:[2,10,24],
91:[2,7,28],
92:[2,4,20],
93:[2,1,6],
94:[1,9,18],
95:[1,6,18],
96:[1,4,24],
97:[1,2,23],
98:[1,0,16],
99:[0,6,0]

};

/** Verdiğiniz görseldeki TRH-2010 KADIN değerleri (yaş → yıl, ay, gün) */
const TRH2010_KADIN_VERILEN: Record<number, [number, number, number]> = {
  0:[78,0,7],
1:[77,7,28],
2:[76,8,5],
3:[75,8,12],
4:[74,8,19],
5:[73,8,23],
6:[72,8,26],
7:[71,9,0],
8:[70,9,4],
9:[69,9,4],
10:[68,9,7],
11:[67,9,11],
12:[66,9,11],
13:[65,9,14],
14:[64,9,18],
15:[63,9,18],
16:[62,9,22],
17:[61,9,25],
18:[60,9,29],
19:[59,10,2],
20:[58,10,6],
21:[57,10,10],
22:[56,10,17],
23:[55,10,20],
24:[54,10,24],
25:[53,11,1],
26:[52,11,5],
27:[51,11,12],
28:[50,11,19],
29:[49,11,23],
30:[49,0,0],
31:[48,0,7],
32:[47,0,14],
33:[46,0,21],
34:[45,0,28],
35:[44,1,6],
36:[43,1,13],
37:[42,1,20],
38:[41,1,27],
39:[40,2,5],
40:[39,2,12],
41:[38,2,20],
42:[37,3,18],
43:[36,4,10],
44:[35,5,6],
45:[34,6,4],
46:[33,7,6],
47:[32,8,10],
48:[31,9,18],
49:[30,8,1],
50:[29,8,26],
51:[28,10,5],
52:[27,11,18],
53:[27,1,6],
54:[26,3,0],
55:[25,5,0],
56:[24,7,7],
57:[23,9,20],
58:[22,11,29],
59:[22,2,24],
60:[21,5,23],
61:[20,8,26],
62:[20,0,18],
63:[19,3,16],
64:[18,6,25],
65:[17,10,11],
66:[17,1,18],
67:[16,4,28],
68:[15,8,20],
69:[15,0,24],
70:[14,5,12],
71:[13,10,10],
72:[13,3,19],
73:[12,9,7],
74:[12,3,0],
75:[11,9,4],
76:[11,3,12],
77:[10,9,27],
78:[10,4,21],
79:[9,11,26],
80:[9,7,12],
81:[9,3,9],
82:[8,11,12],
83:[8,7,23],
84:[8,4,11],
85:[8,1,4],
86:[7,10,2],
87:[7,7,3],
88:[7,4,5],
89:[7,1,9],
90:[6,10,18],
91:[6,8,1],
92:[6,5,8],
93:[6,2,10],
94:[5,11,12],
95:[5,8,11],
96:[5,5,9],
97:[5,2,6],
98:[0,9,0],
99:[0,6,0]

};

function toDecimalYears(y: number, m: number, d: number): number {
  return y + m / 12 + d / 365;
}

function decimalYearsToYmd(ex: number): Trh2010LifeEntry {
  const year = Math.floor(ex);
  const rem = ex - year;
  const month = Math.floor(rem * 12);
  const day = Math.round((rem * 12 - month) * 30);
  return {
    year: Math.max(0, year),
    month: Math.min(11, Math.max(0, month)),
    day: Math.min(30, Math.max(0, day)),
  };
}

function buildTableFromGiven(given: Record<number, [number, number, number]>): Trh2010Table {
  const ages: number[] = [0, 1, 42, 49, 50, 98, 99];
  const table: Trh2010Table = {};
  for (let a = 0; a <= 99; a++) {
    const exact = given[a];
    if (exact) {
      table[a] = { year: exact[0], month: exact[1], day: exact[2] };
      continue;
    }
    let i = 0;
    while (i < ages.length - 1 && ages[i + 1]! <= a) i++;
    const a0 = ages[i]!;
    const a1 = ages[i + 1]!;
    const v0 = given[a0]!;
    const v1 = given[a1]!;
    const ex0 = toDecimalYears(v0[0], v0[1], v0[2]);
    const ex1 = toDecimalYears(v1[0], v1[1], v1[2]);
    const t = (a - a0) / (a1 - a0);
    const ex = ex0 + t * (ex1 - ex0);
    table[a] = decimalYearsToYmd(ex);
  }
  return table;
}

export const trh2010Male: Trh2010Table = buildTableFromGiven(TRH2010_ERKEK_VERILEN);
export const trh2010Female: Trh2010Table = buildTableFromGiven(TRH2010_KADIN_VERILEN);

/**
 * Olay yaşı (yıl) ve cinsiyete göre TRH2010 bakiye ömrü.
 * eventAge = 24 yıl 3 ay → ageKey = 24.
 */
export function getTrh2010LifeExpectancy(
  ageKey: number,
  gender: "male" | "female"
): Trh2010LifeEntry {
  const a = Math.max(0, Math.min(99, Math.floor(ageKey)));
  const table = gender === "male" ? trh2010Male : trh2010Female;
  return table[a] ?? { year: 0, month: 0, day: 0 };
}

/**
 * TRH bakiye ömrünü "X yıl Y ay Z gün" formatında string yapar.
 */
export function formatTrhLifeExpectancy(entry: Trh2010LifeEntry): string {
  const parts: string[] = [];
  if (entry.year > 0) parts.push(`${entry.year} yıl`);
  if (entry.month > 0) parts.push(`${entry.month} ay`);
  if (entry.day > 0) parts.push(`${entry.day} gün`);
  return parts.length > 0 ? parts.join(" ") : "0 gün";
}
