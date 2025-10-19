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

  const fetchUrl = `${API_URL}${endpoint}`;
  console.log(`apiFetch: Intentando fetch a ${fetchUrl} con opciones:`, options); // <-- LOG ANTES

  try {
    const response = await fetch(fetchUrl, {
      ...options,
      headers,
    });
    console.log(`apiFetch: Fetch a ${endpoint} completado. Status: ${response.status}`); // <-- LOG DESPUÉS

    // --- Manejo de errores MEJORADO ---
    if (!response.ok) {
      let errorData = { error: `HTTP error! status: ${response.status}` }; // Default error
      try {
        // Intenta parsear como JSON, pero prepárate si no lo es
        const body = await response.text();
        if (body) {
            errorData = JSON.parse(body);
        }
      } catch (parseError) {
         console.error(`apiFetch: No se pudo parsear la respuesta de error de ${endpoint}`);
      }
      console.error(`apiFetch: Error response from ${endpoint}`, response.status, errorData); // <-- LOG ERROR RESPONSE
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    // --- FIN Manejo de errores MEJORADO ---


    const contentType = response.headers.get("content-type");
    if (response.status === 204 || !contentType || contentType.indexOf("application/json") === -1) {
        console.log(`apiFetch: Respuesta sin JSON desde ${endpoint}`); // <-- LOG SIN JSON
        return {}; // Devuelve objeto vacío para 204 No Content o si no es JSON
    }

    const data = await response.json();
    console.log(`apiFetch: Respuesta JSON desde ${endpoint}:`, data); // <-- LOG RESPUESTA JSON
    return data;

  } catch (error) {
    console.error(`apiFetch: Error en CATCH durante fetch a ${endpoint}`, error); // <-- LOG CATCH BLOCK
    // Asegúrate de re-lanzar un error que AuthContext pueda leer .message
    if (error instanceof Error) {
        throw error;
    } else {
        throw new Error('Error desconocido en apiFetch');
    }
  }
}

export default apiFetch;


