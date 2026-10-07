export function createGoogleClient(url) {
  if (!url) throw new Error('GOOGLE_APPS_SCRIPT_URL no está configurada.');

  return async function callGoogleApi(data) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const text = await response.text();
    let result;
    try { result = JSON.parse(text); }
    catch { throw new Error('Google Apps Script devolvió una respuesta no válida.'); }
    if (!response.ok || result.ok === false) {
      throw new Error(result.error || `Google Apps Script respondió ${response.status}.`);
    }
    return result;
  };
}
