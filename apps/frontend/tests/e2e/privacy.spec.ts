import { expect, test } from '@playwright/test';

test.describe('privacy notice', () => {
  test('renders the complete notice with responsive tables', async ({
    page,
  }) => {
    await page.goto('/de/privacy');

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Datenschutzhinweise für das öffentliche Sanierungstool',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: '21. Aktualität dieser Datenschutzhinweise',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: '12. Webanalyse mit Matomo',
      }),
    ).toBeVisible();
    await expect(
      page.getByText('Die Webanalyse mit Matomo ist derzeit nicht aktiv.', {
        exact: false,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: '13. Schriftarten' }),
    ).toBeVisible();
    await expect(page.getByRole('table')).toHaveCount(3);
    await expect(
      page.getByText('Der Datenschutzhinweis wird hier ergänzt.'),
    ).toHaveCount(0);

    const pageWidth = await page.locator('html').evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(pageWidth.scrollWidth).toBeLessThanOrEqual(pageWidth.clientWidth);

    const tableWrappersAreScrollable = await page
      .getByRole('table')
      .evaluateAll((tables) =>
        tables.every(
          (table) =>
            table.parentElement != null &&
            getComputedStyle(table.parentElement).overflowX === 'auto',
        ),
      );
    expect(tableWrappersAreScrollable).toBe(true);

    if ((page.viewportSize()?.width ?? 0) >= 1024) {
      const dataSourcesTable = page
        .getByRole('columnheader', { name: /dcat:distribution/ })
        .locator('xpath=ancestor::table');
      const dataSourcesTableWidth = await dataSourcesTable.evaluate(
        (table) => ({
          clientWidth: table.parentElement?.clientWidth ?? 0,
          scrollWidth: table.parentElement?.scrollWidth ?? 0,
        }),
      );

      expect(dataSourcesTableWidth.scrollWidth).toBeLessThanOrEqual(
        dataSourcesTableWidth.clientWidth,
      );
    }
  });
});
