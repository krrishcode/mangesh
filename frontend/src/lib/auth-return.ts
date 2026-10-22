export function authReturnPath() {
  const next = new URLSearchParams(window.location.search).get('next') || '';
  return /^\/(account|checkout|cart|shop|products|collections|runway|weddings)(\/|\?|$)/.test(next) && !next.includes('\\') ? next : '/account';
}
