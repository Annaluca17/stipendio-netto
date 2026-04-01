import { User, SavedProfile, UserInput } from '../types';

const USERS_KEY = 'payroll_app_users';
const SESSION_KEY = 'payroll_app_session';

interface StoredUser {
  email: string;
  passwordHash: string;
  profiles: SavedProfile[];
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash = hash & hash;
  }
  return hash.toString(16);
}

const getUsers = (): Record<string, StoredUser> => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); }
  catch { return {}; }
};

const saveUsers = (users: Record<string, StoredUser>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const authService = {
  login(email: string, password: string): User | null {
    const users = getUsers();
    const user = users[email];
    if (!user || user.passwordHash !== simpleHash(password)) return null;
    const sessionUser: User = { email: user.email, profiles: user.profiles };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  register(email: string, password: string): User | { error: string } {
    const users = getUsers();
    if (users[email]) return { error: 'Email già registrata. Prova ad accedere.' };
    if (password.length < 6) return { error: 'La password deve essere di almeno 6 caratteri.' };
    const newUser: StoredUser = { email, passwordHash: simpleHash(password), profiles: [] };
    users[email] = newUser;
    saveUsers(users);
    const sessionUser: User = { email, profiles: [] };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser(): User | null {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  },

  saveProfile(userEmail: string, profileName: string, data: UserInput): User {
    const users = getUsers();
    if (!users[userEmail]) throw new Error('Utente non trovato');
    const newProfile: SavedProfile = {
      id: Date.now().toString(),
      name: profileName,
      createdAt: new Date().toISOString(),
      data,
    };
    users[userEmail].profiles.push(newProfile);
    saveUsers(users);
    const updatedUser: User = { email: userEmail, profiles: users[userEmail].profiles };
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  },

  deleteProfile(userEmail: string, profileId: string): User {
    const users = getUsers();
    if (!users[userEmail]) throw new Error('Utente non trovato');
    users[userEmail].profiles = users[userEmail].profiles.filter(p => p.id !== profileId);
    saveUsers(users);
    const updatedUser: User = { email: userEmail, profiles: users[userEmail].profiles };
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  },
};
