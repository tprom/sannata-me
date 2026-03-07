# Форма достопримечательности (landmark-item)

Форма создаёт или обновляет карточку достопримечательности в едином контракте.
Создание новых городов из этой формы запрещено.

## 1. Привязка к городу и объекту

cityId:
landmark:
landmarkSlug:
geoLat:
geoLng:
geoSource: manual

## 2. Основные текстовые блоки

block.passport:
block.history:
block.meaning:
block.legends:
block.visual:
block.sensory:
block.touristExperience:
block.sources:

## 3. Тексты открытки

greeting: Милый друг,
footer: Читать полную историю в книге\nКнига Кетти
stampPrompt:

## 4. Галерея изображений

imageSlots: 8
commonImagePrompt:

image[0].file:
image[0].prompt:

## 5. Справочник городов (read-only)

Список городов загружается автоматически при открытии формы.
