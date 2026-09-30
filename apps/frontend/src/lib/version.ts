declare const __FRONTEND_VERSION__: string;
declare const __CORE_VERSION__: string;

export function getVersions() {
  return {
    frontend: __FRONTEND_VERSION__,
    core: __CORE_VERSION__,
  };
}

export function getVersionString() {
  return `Frontend v${__FRONTEND_VERSION__} / Core v${__CORE_VERSION__}`;
}
