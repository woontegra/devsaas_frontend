import type { WizardStepConfig } from "../shared/wizardTypes";
import { TrafficPartiesStep } from "../shared/TrafficPartiesStep";
import { TrafficCalculationInfoStep } from "../shared/TrafficCalculationInfoStep";
import { TrafficLifeExpectancyStep } from "../shared/TrafficLifeExpectancyStep";

export const trafficInjurySteps: WizardStepConfig[] = [
  {
    id: "parties",
    title: "Taraf Bilgileri",
    shortTitle: "Taraflar",
    description: "Davacı bilgilerini girin ve dosyada yer alan davalı veya davalı türlerini seçin.",
    sectionKey: "parties",
    Component: TrafficPartiesStep,
  },
  {
    id: "calculationInfo",
    title: "Hesaplama Bilgileri",
    shortTitle: "Hesaplama",
    description:
      "Kaza tarihi, kusur, hastane raporları, maluliyet, gelir ve masrafları tek ekranda girin.",
    sectionKey: "calculationInfo",
    Component: TrafficCalculationInfoStep,
  },
  {
    id: "lifeExpectancy",
    title: "Bakiye Ömür ve Dönem Bilgileri",
    shortTitle: "Bakiye Ömür",
    description:
      "TRH-2010 tablosuna göre bakiye ömür, pasif devre ve muhtemel ömür sonu bilgileri.",
    sectionKey: "lifeExpectancy",
    Component: TrafficLifeExpectancyStep,
  },
];
