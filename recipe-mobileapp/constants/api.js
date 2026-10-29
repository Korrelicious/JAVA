export const BASE_URL = 'http://192.168.10.244:8080/api';

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error('Kunde inte nå servern. Kontrollera anslutningen.');
  }

  if (response.status === 204) {
    return null;
  }

  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    // Svaret saknar JSON-innehåll
  }

  if (!response.ok) {
    const message =
      (data && data.message) ||
      (response.status === 401 ? 'Fel e-post eller lösenord' : null) ||
      (response.status === 409 ? 'E-postadressen används redan' : null) ||
      'Något gick fel. Försök igen.';
    throw new Error(message);
  }

  return data;
}