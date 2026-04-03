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
  onOpenPortalHomeForm: () => void;
  onCreateBook: () => void;
  onCreateChildPatterns: () => void;
};

export function Sidebar({
  selectedLandmarkForm,
  onSelectLandmarkForm,
  onOpenPortalHomeForm,
  onCreateBook,
  onCreateChildPatterns,
}: SidebarProps) {
  return (
    <aside className="agent-sidebar">
      <h3>Формы портала</h3>
      <button className="agent-button" onClick={onOpenPortalHomeForm}>
        Главная страница портала
      </button>

      <div className="sidebar-divider" />

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
