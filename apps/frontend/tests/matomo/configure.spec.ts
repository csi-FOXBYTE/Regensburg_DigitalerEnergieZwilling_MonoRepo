import { expect, test, type APIRequestContext } from '@playwright/test';
import { ADMIN, MATOMO } from './matomo';

/**
 * Privacy configuration the DEZ tracker is designed for, as on the
 * devcontainer instance; matomo.sh up applies it to the local instance. A production instance needs the same, plus
 * [Tracker] trust_visitors_cookies = 1 in config.ini.php (set by matomo.sh).
 *
 * Do not enable "force cookieless tracking": Matomo then ignores the session
 * reference sent as _id and merges everyone with the same IP prefix and
 * browser into one visit. The tracker sets no cookies either way.
 */
const PRIVACY_SETTINGS = {
  anonymizeIPEnable: '1',
  ipAddressMaskLength: '4',
  useAnonymizedIpForVisitEnrichment: '1',
  anonymizeUserId: '1',
  anonymizeOrderId: '1',
  anonymizeReferrer: 'exclude_all',
  forceCookielessTracking: '0',
  randomizeConfigId: '0',
};
const LOCATION_PROVIDER = 'disabled';
/**
 * Optional Matomo compliance policy to enforce, e.g. cnil_v1. It also disables
 * the visits log that funnel.spec.ts reads, so the test instance leaves it off.
 * Its "Opt-Out Configured" item stays "unknown": Matomo cannot detect the DEZ
 * consent dialog, which is the opt-out.
 */
const COMPLIANCE_POLICY = process.env.MATOMO_COMPLIANCE_POLICY;

async function call(
  request: APIRequestContext,
  token: string,
  method: string,
  params: Record<string, string>,
) {
  const response = await request.post(`${MATOMO}/index.php`, {
    form: {
      module: 'API',
      method,
      format: 'json',
      token_auth: token,
      ...params,
    },
  });
  const body = await response.json();
  expect(body, method).not.toMatchObject({ result: 'error' });
}

test('apply the DEZ privacy configuration', async ({ request }) => {
  const tokenResponse = await request.post(`${MATOMO}/index.php`, {
    form: {
      module: 'API',
      method: 'UsersManager.createAppSpecificTokenAuth',
      format: 'json',
      userLogin: ADMIN.login,
      passwordConfirmation: ADMIN.password,
      description: 'configure',
    },
  });
  const { value: token } = (await tokenResponse.json()) as { value: string };
  await call(request, token, 'PrivacyManager.setAnonymizeIpSettings', {
    ...PRIVACY_SETTINGS,
    passwordConfirmation: ADMIN.password,
  });
  await call(request, token, 'UserCountry.setLocationProvider', {
    providerId: LOCATION_PROVIDER,
  });
  if (COMPLIANCE_POLICY)
    await call(request, token, 'PrivacyManager.setComplianceStatus', {
      idSite: '1',
      complianceType: COMPLIANCE_POLICY,
      enforce: '1',
      passwordConfirmation: ADMIN.password,
    });
});
