import type { GetStaticPaths } from 'astro';
import { locales } from './config';

export const buildStaticPaths = (() =>
  locales.map((locale) => ({ params: { locale } }))) satisfies GetStaticPaths;
