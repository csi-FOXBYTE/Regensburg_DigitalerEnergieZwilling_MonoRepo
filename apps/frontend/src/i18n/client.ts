import i18next from './instance';
import { resolveLocale } from './config';

const locale = resolveLocale(document.documentElement.lang);

if (i18next.language !== locale) {
  await i18next.changeLanguage(locale);
}
