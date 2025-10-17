const API_URL = 'http://localhost:4000/api';

/**
 * Función centralizada para realizar peticiones a la API.
 * Automáticamente añade el token de autenticación si existe.
 * @param endpoint El endpoint de la API al que se llamará (ej. '/auth/login').
 * @param options Opciones de la petición fetch (method, body, etc.).
 * @returns La respuesta de la API en formato JSON.
 */
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('authToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Error de red o respuesta no válida.' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  // Si la respuesta no tiene contenido (ej. en un DELETE), devolvemos un objeto vacío.
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    return response.json();
  }
  return {};
}

export default apiFetch;
