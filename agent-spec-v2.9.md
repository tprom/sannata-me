ЗАДАНИЕ: Реализовать компонент PostcardLayout v2.9 для модуля Landmarks согласно архитектуре Postcard Architecture v1.2. SidebarMenu НЕ включать в компонент. SidebarMenu вызывает PostcardLayout.

СТРУКТУРА ФАЙЛОВ:

/components/book/modules/landmarks/PostcardLayout/
    PostcardLayout.jsx
    PostcardLayout.module.css

    /Postcard/
        PostcardContainer.jsx
        PostcardContainer.module.css
        PostcardStamp.jsx
        PostcardStamp.module.css
        PostcardText.jsx
        PostcardText.module.css
        PostcardBookInvite.jsx
        PostcardBookInvite.module.css

    /Filmstrip/
        FilmstripGallery.jsx
        FilmstripGallery.module.css
        FilmstripFrames.jsx
        FilmstripFrames.module.css
        FilmstripFadeTop.jsx
        FilmstripFadeTop.module.css
        FilmstripFadeBottom.jsx
        FilmstripFadeBottom.module.css


ТРЕБОВАНИЯ К КОМПОНЕНТАМ:

1. PostcardLayout.jsx
- Две колонки: открытка (центр) и фотоплёнка (справа).
- Высота 100vh, overflow hidden.
- Пропсы:
  {
    postcardText: string,
    postcardIllustrations: Illustration[],
    gallery: Image[],
    style: string | null
  }

2. PostcardContainer
- Центральная колонка.
- Внутренний скролл, скрытый scrollbar.
- Бумажная текстура, лёгкая тень.
- Содержит:
  <PostcardStamp />
  <PostcardText />
  <PostcardBookInvite />

3. PostcardStamp
- Марка + штемпель в правом верхнем углу открытки.
- Пропсы: { stampImage: string | null }

4. PostcardText
- Отображает текст открытки.
- Вставляет мини‑иллюстрации в поток текста.
- Иллюстрации смещаются на поля (left/right).
- Пропсы:
  {
    text: string,
    illustrations: [
      {
        id: string,
        position: number,
        side: "left" | "right",
        src: string
      }
    ]
  }

5. PostcardBookInvite
- Призыв к книге.
- Пропсы: { link: string }

6. FilmstripGallery
- Вертикальная фотоплёнка справа.
- Скрытый скролл.
- Тени сверху/снизу.
- Кадры внутри рамок плёнки.
- Изображения открываются в модальном окне.
- Пропсы: { images: Image[] }

7. FilmstripFrames
- Список кадров.
- Перфорация по краям.
- Лёгкий наклон (опционально).

8. FilmstripFadeTop / FilmstripFadeBottom
- Мягкие тени‑подсказки.
- Никаких видимых скроллбаров.


CSS‑ТРЕБОВАНИЯ:
- Никаких видимых скроллбаров.
- Мягкие тени и обрезанные элементы.
- Открытка — бумажная текстура.
- Фотоплёнка — перфорация, рамки, вертикальная лента.
- Мини‑иллюстрации — маленькие, смещённые на поля.


АРХИТЕКТУРНЫЕ ПРАВИЛА:
- PostcardLayout НЕ включает SidebarMenu.
- SidebarMenu вызывает PostcardLayout.
- PostcardLayout НЕ загружает данные.
- Компонент только отображает данные.
- Страница строится по схеме:
  Меню | Открытка Кетти | Фотоплёнка
