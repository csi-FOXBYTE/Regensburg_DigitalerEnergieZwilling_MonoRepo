import { expect, type Page, test } from '@playwright/test';

const deletionReceipt = {
  version: 1,
  auditEventId: '11111111-1111-4111-8111-111111111111',
  deletedAt: '2026-09-17T12:00:00.000Z',
  action: 'SUBMISSION_DELETE',
  actorType: 'PUBLIC_CAPABILITY',
  targetType: 'SUBMISSION',
  targetId: 'submission-1',
  deletedCount: 1,
  verificationSecret: 'a'.repeat(43),
};

// Answers a capability route only for the expected token in the POST body.
async function routeWithToken(
  page: Page,
  action: 'status' | 'download' | 'delete',
  token: string,
  json: object | (() => object),
) {
  await page.route(`**/api/public/submissions/${action}`, async (route) => {
    const request = route.request();
    const valid =
      request.method() === 'POST' &&
      request.postDataJSON()?.deletionToken === token;
    await route.fulfill(
      valid
        ? { json: typeof json === 'function' ? json() : json }
        : { status: 404, json: {} },
    );
  });
}

function recordRequestUrls(page: Page): string[] {
  const urls: string[] = [];
  page.on('request', (request) => urls.push(request.url()));
  return urls;
}

test.describe('submission deletion links', () => {
  test('checks availability, cancels persistently, and stays on the page', async ({
    page,
  }) => {
    await routeWithToken(page, 'status', 'test-token', { available: true });
    const requests = recordRequestUrls(page);

    await page.goto('/en/delete#test-token');
    await expect(
      page.getByRole('heading', { name: 'Really delete data?' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(
      page.getByText('Your submitted data has not been deleted.'),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/en\/delete#test-token$/);
    await expect(
      page.getByRole('link', { name: 'Open application' }),
    ).toHaveAttribute('href', '/en');
    expect(requests.filter((url) => url.includes('test-token'))).toEqual([]);
  });

  test('keeps legacy path links working and moves the token out of the path', async ({
    page,
  }) => {
    await routeWithToken(page, 'status', 'legacy-token', { available: true });

    await page.goto('/en/delete/legacy-token');
    await expect(
      page.getByRole('heading', { name: 'Really delete data?' }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/en\/delete#legacy-token$/);
  });

  test('deletes only after confirmation and shows a persistent result', async ({
    page,
  }) => {
    let deleteRequests = 0;
    await routeWithToken(page, 'status', 'test-token', { available: true });
    await routeWithToken(page, 'delete', 'test-token', () => {
      deleteRequests += 1;
      return { success: true, receipt: deletionReceipt };
    });

    await page.goto('/en/delete#test-token');
    expect(deleteRequests).toBe(0);
    await page.getByRole('button', { name: 'Yes, delete data' }).click();

    await expect(
      page.getByText(
        'Your submitted data has been permanently deleted from the city server.',
      ),
    ).toBeVisible();
    expect(deleteRequests).toBe(1);
    await expect(page.getByText(deletionReceipt.auditEventId)).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page
      .getByRole('button', { name: 'Download deletion receipt' })
      .click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(
      `deletion-receipt-${deletionReceipt.auditEventId}.json`,
    );
    await expect(page).toHaveURL(/\/en\/delete#test-token$/);
  });

  test('uses one neutral unavailable state for a missing token', async ({
    page,
  }) => {
    await page.route('**/api/public/submissions/status', (route) =>
      route.fulfill({ status: 404, json: {} }),
    );

    await page.goto('/en/delete#missing');
    await expect(
      page.getByRole('heading', { name: 'Deletion link unavailable' }),
    ).toBeVisible();
  });

  test('offers retry for a service failure', async ({ page }) => {
    let statusRequests = 0;
    await page.route(
      '**/api/public/submissions/status',
      async (route) => {
        statusRequests += 1;
        await route.fulfill(
          statusRequests === 1
            ? { status: 503, json: {} }
            : { json: { available: true } },
        );
      },
    );

    await page.goto('/en/delete#retry');
    await expect(
      page.getByRole('heading', { name: 'Service temporarily unavailable' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(
      page.getByRole('heading', { name: 'Really delete data?' }),
    ).toBeVisible();
  });
});

test.describe('submission download links', () => {
  test('downloads the submitted data with the token only in the fragment', async ({
    page,
  }) => {
    await routeWithToken(page, 'download', 'test-token', {
      id: 'submission-1',
      raw: {},
    });
    const requests = recordRequestUrls(page);

    await page.goto('/en/download#test-token');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download JSON file' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('submission-submission-1.json');
    expect(requests.filter((url) => url.includes('test-token'))).toEqual([]);
  });

  test('uses one neutral unavailable state for a missing token', async ({
    page,
  }) => {
    await page.route('**/api/public/submissions/download', (route) =>
      route.fulfill({ status: 404, json: {} }),
    );

    await page.goto('/en/download#missing');
    await expect(
      page.getByRole('heading', { name: 'Link unavailable' }),
    ).toBeVisible();
  });
});
