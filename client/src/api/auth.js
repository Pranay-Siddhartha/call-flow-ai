/**
 * Authentication Service & Integration Point
 * 
 * Note: The DeepThought FDE challenge specification focuses on caller-facing
 * workflows and data persistence (Supabase tables for calls and stage_results).
 * 
 * This module defines the client-side authentication contract and integration
 * point for connecting Supabase Auth (`supabase.auth.signInWithPassword`) or a
 * custom backend endpoint (`POST /api/auth/login`).
 */

const STORAGE_KEY = 'callflow_auth_session';

/**
 * Get current authenticated user session if present
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('Error reading auth session from storage:', err);
    return null;
  }
}

/**
 * Authenticate a user with email and password
 * 
 * INTEGRATION POINT:
 * To connect to Supabase Auth:
 *   const { data, error } = await supabase.auth.signInWithPassword({ email, password });
 *   if (error) throw error;
 *   return data.user;
 * 
 * To connect to Express backend:
 *   const res = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
 * 
 * @param {Object} credentials { email, password }
 * @returns {Promise<Object>} user session
 */
export async function loginUser({ email, password }) {
  // Client-side validation
  if (!email || !email.trim()) {
    throw new Error('Email address is required.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    throw new Error('Please enter a valid email address.');
  }

  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  // Simulate network round-trip for responsive UX
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Construct active session
  const user = {
    id: 'user_' + Math.random().toString(36).substring(2, 9),
    email: email.trim().toLowerCase(),
    name: email.split('@')[0],
    role: 'sales_engineer',
    authenticatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (err) {
    console.warn('Unable to persist session to localStorage:', err);
  }

  return user;
}

/**
 * Log out current user
 */
export function logoutUser() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Error removing auth session:', err);
  }
}

export default {
  getCurrentUser,
  loginUser,
  logoutUser,
};
