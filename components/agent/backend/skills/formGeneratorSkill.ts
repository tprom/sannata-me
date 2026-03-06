import type { AgentFormSchema } from "../core/schema";
import type { AgentSkill } from "../core/skillRegistry";

export const formGeneratorSkill: AgentSkill = {
  name: "formGenerator",
  async execute(payload: Partial<AgentFormSchema>) {
    const schema: AgentFormSchema = {
      title: payload?.title ?? "Форма достопримечательности v3.0",
      fields:
        payload?.fields?.length && Array.isArray(payload.fields)
          ? payload.fields
          : [
              {
                id: "cityEn",
                type: "text",
                label: "Город (en)",
                placeholder: "Выберите или введите город на английском",
              },
              {
                id: "cityDe",
                type: "text",
                label: "Город (de)",
                placeholder: "Введите город на немецком",
              },
              {
                id: "cityRu",
                type: "text",
                label: "Город (ru)",
                placeholder: "Введите город на русском",
              },
              {
                id: "cityUk",
                type: "text",
                label: "Город (uk)",
                placeholder: "Введите город на украинском",
              },
              {
                id: "landmark",
                type: "text",
                label: "Достопримечательность",
                placeholder: "Выберите или введите достопримечательность",
              },
              {
                id: "contentRu",
                type: "textarea",
                label: "content.ru",
                placeholder: "Готовый текст открытки на русском",
              },
              {
                id: "contentEn",
                type: "textarea",
                label: "content.en",
                placeholder: "Ready postcard text in English",
              },
              {
                id: "contentDe",
                type: "textarea",
                label: "content.de",
                placeholder: "Fertiger Postkartentext auf Deutsch",
              },
              {
                id: "contentUk",
                type: "textarea",
                label: "content.uk",
                placeholder: "Готовий текст листівки українською",
              },
              {
                id: "greetingRu",
                type: "text",
                label: "greeting.ru",
                placeholder: "Приветствие на русском",
              },
              {
                id: "greetingEn",
                type: "text",
                label: "greeting.en",
                placeholder: "Greeting in English",
              },
              {
                id: "greetingDe",
                type: "text",
                label: "greeting.de",
                placeholder: "Begrüßung auf Deutsch",
              },
              {
                id: "greetingUk",
                type: "text",
                label: "greeting.uk",
                placeholder: "Привітання українською",
              },
              {
                id: "footerRu",
                type: "text",
                label: "footer.ru",
                placeholder: "Подпись на русском",
              },
              {
                id: "bookInviteRu",
                type: "text",
                label: "bookInvite.ru",
                placeholder: "Фраза-приглашение к книге (ru)",
              },
              {
                id: "bookLinkRu",
                type: "text",
                label: "bookLink.ru",
                placeholder: "Ссылка на страницу книги (ru)",
              },
              {
                id: "footerEn",
                type: "text",
                label: "footer.en",
                placeholder: "Footer in English",
              },
              {
                id: "bookInviteEn",
                type: "text",
                label: "bookInvite.en",
                placeholder: "Book invite phrase (en)",
              },
              {
                id: "bookLinkEn",
                type: "text",
                label: "bookLink.en",
                placeholder: "Book page link (en)",
              },
              {
                id: "footerDe",
                type: "text",
                label: "footer.de",
                placeholder: "Signatur auf Deutsch",
              },
              {
                id: "bookInviteDe",
                type: "text",
                label: "bookInvite.de",
                placeholder: "Einladungsphrase zum Buch (de)",
              },
              {
                id: "bookLinkDe",
                type: "text",
                label: "bookLink.de",
                placeholder: "Link zur Buchseite (de)",
              },
              {
                id: "footerUk",
                type: "text",
                label: "footer.uk",
                placeholder: "Підпис українською",
              },
              {
                id: "bookInviteUk",
                type: "text",
                label: "bookInvite.uk",
                placeholder: "Фраза-запрошення до книги (uk)",
              },
              {
                id: "bookLinkUk",
                type: "text",
                label: "bookLink.uk",
                placeholder: "Посилання на сторінку книги (uk)",
              },
              {
                id: "stampPrompt",
                type: "text",
                label: "stampPrompt — промпт для почтовой марки",
                placeholder: "Обязательное поле",
              },
            ],
    };

    return schema;
  },
};
