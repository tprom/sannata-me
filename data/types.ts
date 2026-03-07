// CityPageContent V1.3 — типы данных для страниц городов

export type LanguageCode = "en" | "de" | "ru" | "uk";

/** Локализованная строка по всем четырём локалям */
export type LocalizedString = Record<LanguageCode, string>;

/** Размер иллюстрации */
export type IllustrationSize = "small" | "medium" | "large";

/** Тип иллюстрации */
export type IllustrationType = "ketty-drawing" | "photo" | "decor";

/** Позиция иллюстрации на странице */
export type IllustrationPosition = "left" | "right" | "center";

/** Точка вставки иллюстрации относительно параграфа */
export interface IllustrationInsert {
  where: "before" | "after";
  paragraph: number;
}

/** Блок иллюстрации — один элемент в динамическом списке иллюстраций */
export interface IllustrationBlock {
  /** Путь к изображению */
  image: string;
  /** Подпись к иллюстрации (локализованная) */
  caption?: LocalizedString;
  /** Визуальный размер */
  size: IllustrationSize;
  /** Тип иллюстрации */
  type: IllustrationType;
  /** Горизонтальное расположение */
  position: IllustrationPosition;
  /** Обтекание текстом */
  wrap: boolean;
  /** Тень */
  shadow: boolean;
  /** Рамка */
  border: boolean;
  /** Поворот в градусах */
  rotate?: number;
  /** Точка вставки относительно параграфа */
  insert?: IllustrationInsert;
  /** Якорь внутри страницы (id элемента) */
  anchor?: string;
}

/** Контент страницы города (V1.3) */
export interface CityPageContent {
  /** Панорама города для верхнего блока */
  panorama?: string;
  /** Приветствие — отображается в самом верху страницы */
  greeting?: LocalizedString;
  /** Описание города — текстовый блок без изображений */
  description?: LocalizedString;
  /** Список иллюстраций (динамический) */
  illustrations?: IllustrationBlock[];
  /** Приглашение — отображается в самом низу страницы */
  invitation?: LocalizedString;
}
