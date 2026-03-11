import { formTypography } from "../../../styles/formTypography";

export function Step7PesinSermayeDegeri() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-800 dark:text-ds-text">Peşin Sermaye Değeri</h3>
      <p className={formTypography.label}>
        Bu bölüm daha sonra doldurulacaktır.
      </p>
    </div>
  );
}
