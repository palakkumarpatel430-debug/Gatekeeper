import { describe, it, expect, beforeEach } from "vitest";
import { sha } from "../lib/util";

const USERS_KEY = "gatekeeper.users";
const SESSION_KEY = "gatekeeper.session";

type User = { email: string; name: string; hash: string; premium: boolean; plan: string | null };

function loadUsers(): User[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch { return []; }
}
function saveUsers(u: User[]) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

async function register(name: string, email: string, pass: string): Promise<string | null> {
  const e = email.trim().toLowerCase();
  if (!name.trim()) return "Enter your name";
  if (!/^\S+@\S+\.\S+$/.test(e)) return "Enter a valid email";
  if (pass.length < 6) return "Password must be at least 6 characters";
  const users = loadUsers();
  if (users.some((u) => u.email === e)) return "Account already exists — log in instead";
  const nu: User = { email: e, name: name.trim(), hash: await sha(pass), premium: false, plan: null };
  users.push(nu);
  saveUsers(users);
  localStorage.setItem(SESSION_KEY, e);
  return null;
}

async function login(email: string, pass: string): Promise<string | null> {
  const e = email.trim().toLowerCase();
  const u = loadUsers().find((x) => x.email === e);
  if (!u) return "No account with that email";
  if (u.hash !== (await sha(pass))) return "Wrong password";
  localStorage.setItem(SESSION_KEY, e);
  return null;
}

function purchase(email: string, plan: string) {
  saveUsers(loadUsers().map((u) => u.email === email ? { ...u, premium: true, plan } : u));
}

beforeEach(() => localStorage.clear());

describe("register", () => {
  it("creates a new account successfully", async () => {
    const err = await register("Alice", "alice@example.com", "secret123");
    expect(err).toBeNull();
    const users = loadUsers();
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe("alice@example.com");
    expect(users[0].name).toBe("Alice");
    expect(users[0].premium).toBe(false);
  });

  it("saves session after register", async () => {
    await register("Alice", "alice@example.com", "secret123");
    expect(localStorage.getItem(SESSION_KEY)).toBe("alice@example.com");
  });

  it("normalises email to lowercase", async () => {
    await register("Bob", "Bob@Example.COM", "pass123");
    expect(loadUsers()[0].email).toBe("bob@example.com");
  });

  it("trims whitespace from name", async () => {
    await register("  Carol  ", "carol@test.com", "pass123");
    expect(loadUsers()[0].name).toBe("Carol");
  });

  it("rejects empty name", async () => {
    const err = await register("", "user@test.com", "pass123");
    expect(err).toBe("Enter your name");
  });

  it("rejects invalid email", async () => {
    const err = await register("Alice", "not-an-email", "pass123");
    expect(err).toBe("Enter a valid email");
  });

  it("rejects short password", async () => {
    const err = await register("Alice", "alice@test.com", "abc");
    expect(err).toBe("Password must be at least 6 characters");
  });

  it("rejects duplicate account", async () => {
    await register("Alice", "alice@test.com", "pass123");
    const err = await register("Alice", "alice@test.com", "pass123");
    expect(err).toBe("Account already exists — log in instead");
  });

  it("hashes password (not stored in plaintext)", async () => {
    await register("Alice", "alice@test.com", "mypassword");
    expect(loadUsers()[0].hash).not.toBe("mypassword");
  });
});

describe("login", () => {
  beforeEach(async () => {
    await register("Alice", "alice@test.com", "correct-pass");
    localStorage.removeItem(SESSION_KEY);
  });

  it("logs in with correct credentials", async () => {
    const err = await login("alice@test.com", "correct-pass");
    expect(err).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBe("alice@test.com");
  });

  it("is case-insensitive on email", async () => {
    const err = await login("Alice@TEST.com", "correct-pass");
    expect(err).toBeNull();
  });

  it("rejects unknown email", async () => {
    const err = await login("nobody@test.com", "pass");
    expect(err).toBe("No account with that email");
  });

  it("rejects wrong password", async () => {
    const err = await login("alice@test.com", "wrong-pass");
    expect(err).toBe("Wrong password");
  });
});

describe("purchase", () => {
  it("sets premium true and stores plan", async () => {
    await register("Alice", "alice@test.com", "pass123");
    purchase("alice@test.com", "Per-Project");
    const user = loadUsers().find((u) => u.email === "alice@test.com");
    expect(user?.premium).toBe(true);
    expect(user?.plan).toBe("Per-Project");
  });

  it("does not affect other accounts", async () => {
    await register("Alice", "alice@test.com", "pass123");
    await register("Bob", "bob@test.com", "pass456");
    purchase("alice@test.com", "Basic");
    const bob = loadUsers().find((u) => u.email === "bob@test.com");
    expect(bob?.premium).toBe(false);
  });
});
