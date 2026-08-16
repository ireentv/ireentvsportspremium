import { ManagedUser, AuthSession } from "../types";

export const ADMIN_PASSWORD = "BNSSSireen$1";
const LOCAL_USERS_KEY = "ireentv_managed_users";
const AUTH_SESSION_KEY = "ireentv_auth_session";

// Default initial fallback user
const DEFAULT_USERS: ManagedUser[] = [
  {
    id: "usr_demo_1",
    username: "user1",
    password: "123",
    name: "Test User",
    notes: "Demo account",
    isLocked: false,
    createdAt: new Date().toISOString(),
  },
];

// Get cached local users
export function getLocalUsers(): ManagedUser[] {
  try {
    const data = localStorage.getItem(LOCAL_USERS_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_USERS;
  }
}

// Save users to localStorage cache
export function saveLocalUsers(users: ManagedUser[]) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Failed to save local users", e);
  }
}

// Get active session
export function getStoredSession(): AuthSession | null {
  try {
    const local = localStorage.getItem(AUTH_SESSION_KEY);
    if (local) return JSON.parse(local);
    const session = sessionStorage.getItem(AUTH_SESSION_KEY);
    if (session) return JSON.parse(session);
    
    // Check legacy unlock key
    if (
      localStorage.getItem("ireentv_unlocked") === "true" ||
      sessionStorage.getItem("ireentv_unlocked") === "true"
    ) {
      return {
        role: "admin",
        unlockedAt: new Date().toISOString(),
      };
    }
  } catch {
    return null;
  }
  return null;
}

// Save active session
export function saveSession(session: AuthSession, remember: boolean) {
  try {
    const serialized = JSON.stringify(session);
    if (remember) {
      localStorage.setItem(AUTH_SESSION_KEY, serialized);
      localStorage.setItem("ireentv_unlocked", "true");
    } else {
      sessionStorage.setItem(AUTH_SESSION_KEY, serialized);
      sessionStorage.setItem("ireentv_unlocked", "true");
    }
  } catch (e) {
    console.error(e);
  }
}

// Clear session
export function clearSession() {
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem("ireentv_unlocked");
    sessionStorage.removeItem("ireentv_unlocked");
  } catch (e) {
    console.error(e);
  }
}

// API: Verify and unlock (Admin or User)
export async function verifyAndUnlock(
  payload: { type: "admin"; password: string } | { type: "user"; username: string; password: string }
): Promise<{ success: boolean; session?: AuthSession; error?: string; isLocked?: boolean }> {
  // Try server API first
  try {
    const res = await fetch("/api/auth/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      const session: AuthSession = {
        role: data.role,
        username: data.username,
        name: data.name,
        unlockedAt: new Date().toISOString(),
      };
      return { success: true, session };
    }

    return {
      success: false,
      error: data.error || "আনলক করা সম্ভব হয়নি।",
      isLocked: data.isLocked,
    };
  } catch {
    // Client-side fallback if server is unreachable
    if (payload.type === "admin") {
      if (payload.password === ADMIN_PASSWORD) {
        return {
          success: true,
          session: {
            role: "admin",
            unlockedAt: new Date().toISOString(),
          },
        };
      }
      return { success: false, error: "ভুল এডমিন পাসওয়ার্ড!" };
    } else {
      const users = getLocalUsers();
      const user = users.find(
        (u) => u.username.toLowerCase() === payload.username.trim().toLowerCase()
      );
      if (!user || user.password !== payload.password) {
        return { success: false, error: "ভুল ইউজারনেম অথবা পাসওয়ার্ড!" };
      }
      if (user.isLocked) {
        return {
          success: false,
          isLocked: true,
          error: "আপনার অ্যাকাউন্টটি এডমিন কর্তৃক লক করা হয়েছে। এডমিনের সাথে যোগাযোগ করুন।",
        };
      }
      return {
        success: true,
        session: {
          role: "user",
          username: user.username,
          name: user.name,
          unlockedAt: new Date().toISOString(),
        },
      };
    }
  }
}

// Admin API: Fetch all users
export async function fetchAdminUsers(adminKey: string = ADMIN_PASSWORD): Promise<ManagedUser[]> {
  try {
    const res = await fetch("/api/admin/users", {
      headers: { "x-admin-key": adminKey },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.users && Array.isArray(data.users)) {
        saveLocalUsers(data.users);
        return data.users;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch users from server, using local fallback", err);
  }
  return getLocalUsers();
}

// Admin API: Create user
export async function createAdminUser(
  userData: { username: string; password: string; name?: string; notes?: string },
  adminKey: string = ADMIN_PASSWORD
): Promise<{ success: boolean; user?: ManagedUser; error?: string }> {
  try {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      const currentUsers = getLocalUsers();
      const updated = [data.user, ...currentUsers.filter((u) => u.id !== data.user.id)];
      saveLocalUsers(updated);
      return { success: true, user: data.user };
    }
    return { success: false, error: data.error || "ইউজার যোগ করা সম্ভব হয়নি।" };
  } catch {
    // Local fallback
    const users = getLocalUsers();
    if (users.some((u) => u.username.toLowerCase() === userData.username.trim().toLowerCase())) {
      return { success: false, error: "এই ইউজারনেমটি ইতিমধ্যে বিদ্যমান!" };
    }
    const newUser: ManagedUser = {
      id: `usr_${Date.now()}`,
      username: userData.username.trim(),
      password: userData.password,
      name: userData.name?.trim(),
      notes: userData.notes?.trim(),
      isLocked: false,
      createdAt: new Date().toISOString(),
    };
    saveLocalUsers([newUser, ...users]);
    return { success: true, user: newUser };
  }
}

// Admin API: Toggle lock or update user
export async function updateAdminUser(
  id: string,
  updates: Partial<ManagedUser>,
  adminKey: string = ADMIN_PASSWORD
): Promise<{ success: boolean; user?: ManagedUser; error?: string }> {
  try {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      const current = getLocalUsers();
      const updated = current.map((u) => (u.id === id ? { ...u, ...data.user } : u));
      saveLocalUsers(updated);
      return { success: true, user: data.user };
    }
    return { success: false, error: data.error || "ইউজার আপডেট করা যায়নি।" };
  } catch {
    const users = getLocalUsers();
    const updated = users.map((u) => (u.id === id ? { ...u, ...updates } : u));
    saveLocalUsers(updated);
    const user = updated.find((u) => u.id === id);
    return { success: true, user };
  }
}

// Admin API: Delete user
export async function deleteAdminUser(
  id: string,
  adminKey: string = ADMIN_PASSWORD
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "DELETE",
      headers: { "x-admin-key": adminKey },
    });
    const data = await res.json().catch(() => ({ success: true }));
    const users = getLocalUsers().filter((u) => u.id !== id);
    saveLocalUsers(users);
    if (res.ok || data.success) {
      return { success: true };
    }
    return { success: true };
  } catch {
    const users = getLocalUsers().filter((u) => u.id !== id);
    saveLocalUsers(users);
    return { success: true };
  }
}
