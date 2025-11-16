import type { StudyPlan, UserProfile } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';
const GUEST_PLAN_KEY = 'studyPlanData_guest';

// --- Helper Functions ---

const getToken = () => localStorage.getItem('authToken');
const setToken = (token: string) => localStorage.setItem('authToken', token);
const removeToken = () => localStorage.removeItem('authToken');

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Ocorreu um erro na rede.' }));
    throw new Error(errorData.message || `Erro ${response.status}`);
  }

  // Handle responses with no content
  if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null;
  }
  
  return response.json();
};

// --- API Endpoint Implementation ---

export const api = {
  /**
   * Fetches the current user's profile from the backend using a JWT.
   */
  async getProfile(): Promise<UserProfile | null> {
    if (!getToken()) return null;
    try {
        return await apiFetch('/profile');
    } catch (error) {
        console.error("API: Falha ao buscar perfil, limpando token.", error);
        removeToken(); // Token might be invalid, so clear it.
        return null;
    }
  },

  /**
   * Logs a user in via the /auth/login endpoint.
   */
  async login(email: string, password?: string): Promise<{ user: { email: string } }> {
    const { token, user } = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(token);
    return user;
  },

  /**
   * Registers a new user via the /auth/register endpoint.
   */
  async register(email: string, password?: string): Promise<{ user: { email: string } }> {
    const { token, user } = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(token);
    return user;
  },
  
  /**
   * Saves the logged-in user's entire profile to the backend.
   */
  async saveUserProfile(profile: UserProfile): Promise<void> {
    await apiFetch('/profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  },

  /**
   * Clears the user's token from local storage.
   */
  async clearUserSession(): Promise<void> {
    removeToken();
    return Promise.resolve();
  },

  // --- Guest functions remain using localStorage ---

  async getGuestProfile(): Promise<StudyPlan | null> {
    try {
      const savedData = localStorage.getItem(GUEST_PLAN_KEY);
      return savedData ? JSON.parse(savedData) : null;
    } catch (error) {
      console.error(`API: Failed to load guest data`, error);
      return null;
    }
  },
  
  async saveGuestProfile(plan: StudyPlan): Promise<void> {
    try {
      localStorage.setItem(GUEST_PLAN_KEY, JSON.stringify(plan));
    } catch (error) {
      console.error(`API: Failed to save guest data`, error);
    }
  },
};
