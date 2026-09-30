import { defineMiddleware } from 'astro:middleware';
import i18next from '@/i18n/instance';
import { resolveLocale } from '@/i18n/config';

export const onRequest = defineMiddleware(async (context, next) => {
  await i18next.changeLanguage(resolveLocale(context.currentLocale));
  return next();
});
