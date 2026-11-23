/** Does the site answer? navigator.onLine is also true on Wi-Fi without Internet, or with the class server stopped. */
export async function siteAnswers(): Promise<boolean> {
  try {
    const r = await fetch(import.meta.env.BASE_URL, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export function reloadPage(): void {
  window.location.reload();
}
