/**
 * Tüm UI metinleri — hardcoded string yok.
 * Mahkeme / bilirkişi aktüerya formu.
 */

export const uiText = {
  app: {
    title: "Aktüerya Platformu",
    logout: "Çıkış",
  },

  wizard: {
    step0: "Hesap türü",
    step1: "Kişi bilgileri",
    step2: "Gelir bilgileri",
    step3: "Aktüerya parametreleri",
    step4: "Destek bilgileri",
    step5: "Sonuç",
    next: "İleri",
    back: "Geri",
    calculate: "Hesapla",
    calculating: "Hesaplanıyor…",
  },

  calculationType: {
    title: "Hesap türünü seçin",
    trafficDeath: "Trafik Kazası Ölüm",
    trafficInjury: "Trafik Kazası Yaralanma",
    workDeath: "İş Kazası Ölüm",
    workInjury: "İş Kazası Yaralanma",
  },

  personal: {
    title: "Kişisel bilgiler",
    birthDate: "Doğum tarihi",
    gender: "Cinsiyet",
    male: "Erkek",
    female: "Kadın",
    maritalStatus: "Medeni durum",
    maritalSingle: "Bekâr",
    maritalMarried: "Evli",
    maritalDivorced: "Boşanmış",
    maritalWidowed: "Dul",
    educationLevel: "Eğitim durumu",
    educationPrimary: "İlkokul",
    educationHighSchool: "Lise",
    educationUniversity: "Üniversite",
    educationOther: "Diğer",
    occupation: "Meslek",
    eventDate: "Olay tarihi",
    calculationDate: "Hesap tarihi",
    age: "Yaş",
    ageComputed: "Yaş (otomatik hesaplanır)",
  },

  accident: {
    title: "Kaza bilgileri",
    accidentType: "Kaza türü",
    typeWork: "İş kazası",
    typeTraffic: "Trafik kazası",
    typeSupportLoss: "Destekten yoksun kalma",
    typeDisability: "Maluliyet",
    plaintiffFaultRatio: "Davacı kusur oranı",
    defendantFaultRatio: "Davalı kusur oranı",
  },

  income: {
    title: "Gelir bilgileri",
    grossSalary: "Brüt ücret",
    netSalary: "Net ücret",
    incomeType: "Gelir türü",
    typeMinWage: "Asgari ücret",
    typeComparableWage: "Emsal ücret",
    typeSgkIncome: "SGK geliri",
    incomeStartDate: "Gelir başlangıç tarihi",
    incomeIncreaseRate: "Gelir artış oranı",
  },

  actuarial: {
    title: "Aktüerya parametreleri",
    lifeTable: "Yaşam tablosu",
    tableTRH2010: "TRH2010",
    tableCSO1980: "CSO1980",
    tablePMF1931: "PMF1931",
    activePeriodAge: "Aktif dönem yaşı",
    passivePeriodAge: "Pasif dönem yaşı",
    increaseRate: "Artış oranı",
    discountRate: "İskonto oranı",
    progressiveRant: "Progressive rant",
    maluliyetOrani: "Maluliyet oranı (%)",
    sgkGeliri: "SGK geliri (peşin değer)",
    monthlySgkIncome: "SGK aylık gelir (hesaplanan PSD)",
    temporaryDisabilityStartDate: "Geçici iş göremezlik başlangıç",
    temporaryDisabilityEndDate: "Geçici iş göremezlik bitiş",
    monthlyCareCost: "Aylık bakıcı gideri",
  },

  support: {
    title: "Destek paylaştırma",
    addPerson: "Kişi ekle",
    name: "Ad",
    birthDate: "Doğum tarihi",
    gender: "Cinsiyet",
    shareRatio: "Pay oranı",
    supportDuration: "Destek süresi",
    relationship: "Yakınlık",
    relSpouse: "Eş",
    relChild: "Çocuk",
    relMother: "Anne",
    relFather: "Baba",
  },

  marriage: {
    title: "Evlenme olasılığı",
    marriageProbability: "Evlenme ihtimali",
  },

  military: {
    title: "Askerlik parametresi",
    militaryAge: "Askerlik yaşı",
    militaryDuration: "Askerlik süresi",
  },

  education: {
    title: "Eğitim parametreleri",
    childEducationLevel: "Çocuk eğitim süresi",
    levelPrimary: "İlkokul",
    levelHighSchool: "Lise",
    levelUniversity: "Üniversite",
  },

  upbringing: {
    title: "Yetiştirme gideri",
    upbringingCost: "Yetiştirme gideri",
    childRearingCost: "Çocuk yetiştirme maliyeti",
  },

  interest: {
    title: "Faiz parametreleri",
    interestStartDate: "Faiz başlangıç tarihi",
    interestType: "Faiz türü",
    typeLegal: "Yasal faiz",
    typeAdvance: "Avans faizi",
  },

  pastPeriod: {
    title: "Geçmiş dönem hesabı",
    pastPeriodStartDate: "Geçmiş dönem başlangıç tarihi",
    pastPeriodEndDate: "Geçmiş dönem bitiş tarihi",
  },

  table: {
    title: "Aktüerya tablosu",
    sectionTitle: "Aktüerya Hesap Tablosu",
    year: "Yıl",
    age: "Yaş",
    lx: "lx",
    survivalProbability: "Yaşam olasılığı",
    income: "Gelir",
    increasedIncome: "Artış",
    discountFactor: "İskonto",
    psd: "PSD",
    supportShare: "Destek payı",
    faultAdjustedValue: "Kusur sonrası değer",
  },

  result: {
    title: "Sonuç",
    pastPeriodValue: "Geçmiş dönem değeri",
    futureActivePeriod: "Gelecek aktif dönem",
    futurePassivePeriod: "Gelecek pasif dönem",
    totalPSD: "Toplam PSD",
    runCalculation: "Hesaplama yapıldığında sonuç burada görüntülenir",
    sgkPSDTitle: "SGK Geliri Peşin Sermaye Değeri",
    temporaryDisabilityLabel: "Geçici İş Göremezlik Zararı",
    permanentDisabilityLabel: "Sürekli İş Göremezlik Zararı",
    caregiverCostLabel: "Bakıcı Gideri",
    totalCompensationLabel: "Toplam Tazminat",
  },

  common: {
    required: "Zorunlu",
    percent: "%",
    years: "yıl",
    months: "ay",
  },

  errors: {
    calculationFailed: "Hesaplama başarısız",
  },

  report: {
    save: "Kaydet",
    saving: "Kaydediliyor…",
    exportDocx: "DOCX İndir",
    exporting: "Hazırlanıyor…",
  },

  validation: {
    title: "Hesap denetimi",
    errors: "Hatalar",
    warnings: "Uyarılar",
    suggestions: "Öneriler",
    noIssues: "Denetim sonucu sorun bulunmadı.",
    reportText: "Rapor metni",
  },

  sgk: {
    title: "SGK Geliri Peşin Sermaye Değeri",
    value: "Peşin sermaye değeri",
    year: "Yıl",
    age: "Yaş",
    income: "Gelir",
    discountFactor: "İskonto",
    survivalProbability: "Yaşam olasılığı",
    presentValue: "Bugünkü değer",
  },
} as const;

export type UiText = typeof uiText;
