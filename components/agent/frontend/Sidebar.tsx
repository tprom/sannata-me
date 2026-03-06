"use client";

import { LandmarksFormSelector } from "./LandmarksFormSelector";

type LandmarkFormType =
  | "module-home"
  | "city"
  | "collection-home"
  | "landmark-item";

type SidebarProps = {
  selectedLandmarkForm: LandmarkFormType | null;
  onSelectLandmarkForm: (formType: LandmarkFormType) => void;
  onCreateBook: () => void;
  onCreateChildPatterns: () => void;
};

export function Sidebar({
  selectedLandmarkForm,
  onSelectLandmarkForm,
  onCreateBook,
  onCreateChildPatterns,
}: SidebarProps) {
  return (
    <aside className="agent-sidebar">
      <LandmarksFormSelector
        selectedForm={selectedLandmarkForm}
        onSelectForm={onSelectLandmarkForm}
      />

      <div className="sidebar-divider" />

      <h3>Другие операции</h3>
      <button className="agent-button" onClick={onCreateBook}>
        Создать карточку книги
      </button>
      <button className="agent-button" onClick={onCreateChildPatterns}>
        Обновить словарь Кетти
      </button>
    </aside>
  );
}
