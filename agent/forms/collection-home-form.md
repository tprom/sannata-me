# Форма страницы города (collection-home)

Эта форма создаёт или обновляет главную страницу города в модуле landmarks.

**Структура:** envelope с pageKind: "collection-home"

## A. Город

cityId: (выберите из справочника ниже)
citySlug: (выберите из справочника ниже)
locale: ru

## B. Метаданные

title: Аугсбург
subtitle: Исторический город Баварии
tags: landmarks, city, augsburg
status: published

## C. Hero

heroTitle: Аугсбург
heroSubtitle: Город ренессансной архитектуры
heroImage: /images/cities/augsburg/hero.jpg

## D. Summary секция

summaryTitle: О городе
summarySubtitle: Городской профиль
summaryDescription: Аугсбург — третий по величине город Баварии после Мюнхена и Нюрнберга. Город богат историей, здесь родился архитектурный стиль "аугсбургские дома".

## E. Highlights (по одной на строку)

highlight1: Достопримечательностей в городе
highlight2: Выберите табличку в меню для подробной информации
highlight3: Контент синхронизирован с каталогом data/landmarks

## F. Links-grid секция

linksGridTitle: Достопримечательности города

<!-- Ссылки генерируются автоматически из landmark-файлов города -->

## G. CTA секция

ctaText: Блок расширяется по мере наполнения города новыми объектами и медиаматериалами.

## H. Служебные поля (авто)

pageKind: collection-home
moduleKey: landmarks
pageId: (генерируется автоматически)
slug: (берётся из citySlug)
schemaVersion: 1.1.0

## I. Справочник городов (read-only)

Список городов будет загружен автоматически при открытии формы.
