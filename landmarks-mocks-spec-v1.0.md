# Mock‑данные для LandmarksPage

## Цель
Создать локальные mock‑данные для передачи в PostcardLayout:
- текст открытки
- мини‑иллюстрации
- изображения фотоплёнки

## Требования
- Никаких загрузок.
- Никаких fetch.
- Только локальные константы.

## mockText
const mockText = `
Милый друг, сегодня я гуляла по старинным улочкам города и нашла место,
которое обязательно покажу тебе, когда ты приедешь.

Я сделала несколько зарисовок и фотографий — они справа, на плёнке.
Надеюсь, тебе понравится эта маленькая прогулка.
`;

## mockIllustrations
const mockIllustrations = [
  {
    id: "illu-1",
    position: 40,
    side: "left",
    src: "/placeholder.png"
  },
  {
    id: "illu-2",
    position: 180,
    side: "right",
    src: "/placeholder.png"
  }
];

## mockGallery
const mockGallery = [
  { src: "/gallery1.jpg", alt: "Photo 1" },
  { src: "/gallery2.jpg", alt: "Photo 2" },
  { src: "/gallery3.jpg", alt: "Photo 3" },
  { src: "/gallery4.jpg", alt: "Photo 4" }
];

## Интеграция в LandmarksPage.jsx
Вставить mock‑данные в начало файла и передать их в PostcardLayout.
