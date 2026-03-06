"use client";

type LandmarkFormType =
  | "module-home"
  | "city"
  | "collection-home"
  | "landmark-item";

type LandmarksFormSelectorProps = {
  selectedForm: LandmarkFormType | null;
  onSelectForm: (formType: LandmarkFormType) => void;
};

const FORM_OPTIONS: Array<{
  value: LandmarkFormType;
  label: string;
  description: string;
}> = [
  {
    value: "module-home",
    label: "Главная страница модуля",
    description: "Редко используется, структура модуля landmarks",
  },
  {
    value: "city",
    label: "Город (реестр)",
    description: "Создание/обновление города в реестре",
  },
  {
    value: "collection-home",
    label: "Страница города",
    description: "Главная страница города с описанием и списком",
  },
  {
    value: "landmark-item",
    label: "Открытка достопримечательности",
    description: "Страница достопримечательности (envelope)",
  },
];

export function LandmarksFormSelector({
  selectedForm,
  onSelectForm,
}: LandmarksFormSelectorProps) {
  return (
    <div className="landmarks-form-selector">
      <h3 className="selector-title">Выбор формы модуля Landmarks</h3>
      <select
        id="landmarks-form-select"
        className="agent-select"
        value={selectedForm || ""}
        onChange={(e) => {
          const value = e.target.value as LandmarkFormType;
          if (value) {
            onSelectForm(value);
          }
        }}
      >
        <option value="" disabled>
          — Выберите тип формы —
        </option>
        {FORM_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {selectedForm && (
        <p className="selector-hint">
          {FORM_OPTIONS.find((opt) => opt.value === selectedForm)?.description}
        </p>
      )}
    </div>
  );
}
