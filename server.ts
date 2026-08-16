import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "BNSSSireen$1";
const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

interface ServerUser {
  id: string;
  username: string;
  password: string;
  name?: string;
  notes?: string;
  isLocked: boolean;
  createdAt: string;
  lastLogin?: string;
}

// Ensure data directory and users file exist
function loadUsers(): ServerUser[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
      // Seed with initial default user if needed
      const initialUsers: ServerUser[] = [
        {
          id: "usr_demo_1",
          username: "user1",
          password: "123",
          name: "Test User",
          notes: "Demo account",
          isLocked: false,
          createdAt: new Date().toISOString(),
        }
      ];
      fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2), "utf8");
      return initialUsers;
    }
    const data = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error loading users:", err);
    return [];
  }
}

function saveUsers(users: ServerUser[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving users:", err);
  }
}

// Hardcoded headers requested by the user
const PROXY_HEADERS = {
  "Referer": "https://cdnlivetv.tv/api/v1/channels/player/?name=ABC&code=us&user=streamsports99&plan=vip",
  "Origin": "https://cdnlivetv.tv/api/v1/channels/player/?name=ABC&code=us&user=streamsports99&plan=vip",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
  "x-forwarded-for": "109.236.88.82",
};

// CORS Setup
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-admin-key");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// Auth unlock verification endpoint
app.post("/api/auth/unlock", (req, res) => {
  const { type, password, username } = req.body;

  if (type === "admin") {
    if (password === ADMIN_PASSWORD) {
      res.json({
        success: true,
        role: "admin",
        message: "Admin authentication successful",
      });
      return;
    } else {
      res.status(401).json({
        success: false,
        error: "ভুল এডমিন পাসওয়ার্ড!",
      });
      return;
    }
  }

  if (type === "user") {
    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: "ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন।",
      });
      return;
    }

    const users = loadUsers();
    const userIndex = users.findIndex(
      (u) => u.username.toLowerCase() === String(username).trim().toLowerCase()
    );

    if (userIndex === -1) {
      res.status(401).json({
        success: false,
        error: "ভুল ইউজারনেম অথবা পাসওয়ার্ড!",
      });
      return;
    }

    const user = users[userIndex];
    if (user.password !== String(password)) {
      res.status(401).json({
        success: false,
        error: "ভুল ইউজারনেম অথবা পাসওয়ার্ড!",
      });
      return;
    }

    if (user.isLocked) {
      res.status(403).json({
        success: false,
        isLocked: true,
        error: "আপনার অ্যাকাউন্টটি এডমিন কর্তৃক লক করা হয়েছে। এডমিনের সাথে যোগাযোগ করুন।",
      });
      return;
    }

    // Update last login timestamp
    users[userIndex].lastLogin = new Date().toISOString();
    saveUsers(users);

    res.json({
      success: true,
      role: "user",
      username: user.username,
      name: user.name,
      message: "User unlock successful",
    });
    return;
  }

  res.status(400).json({ success: false, error: "Invalid unlock type" });
});

// Admin auth middleware for management APIs
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const adminKey = req.headers["x-admin-key"] || req.query.adminKey;
  if (adminKey === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(403).json({ success: false, error: "Unauthorized. Admin password required." });
  }
};

// GET all users (Admin only)
app.get("/api/admin/users", requireAdmin, (req, res) => {
  const users = loadUsers();
  res.json({ success: true, users });
});

// CREATE a new user (Admin only)
app.post("/api/admin/users", requireAdmin, (req, res) => {
  const { username, password, name, notes } = req.body;

  if (!username || !password) {
    res.status(400).json({ success: false, error: "Username and password are required" });
    return;
  }

  const trimmedUsername = String(username).trim();
  const users = loadUsers();

  if (users.some((u) => u.username.toLowerCase() === trimmedUsername.toLowerCase())) {
    res.status(400).json({ success: false, error: "এই ইউজারনেমটি ইতিমধ্যে বিদ্যমান! অন্য ইউজারনেম ব্যবহার করুন।" });
    return;
  }

  const newUser: ServerUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    username: trimmedUsername,
    password: String(password),
    name: name ? String(name).trim() : undefined,
    notes: notes ? String(notes).trim() : undefined,
    isLocked: false,
    createdAt: new Date().toISOString(),
  };

  users.unshift(newUser);
  saveUsers(users);

  res.status(201).json({ success: true, user: newUser, message: "নতুন ইউজার সফলভাবে যুক্ত হয়েছে।" });
});

// UPDATE user (lock/unlock, password change, etc.) (Admin only)
app.patch("/api/admin/users/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { isLocked, password, name, notes, username } = req.body;

  const users = loadUsers();
  const userIndex = users.findIndex((u) => u.id === id);

  if (userIndex === -1) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  if (username !== undefined) {
    const trimmedUsername = String(username).trim();
    if (
      users.some(
        (u) => u.id !== id && u.username.toLowerCase() === trimmedUsername.toLowerCase()
      )
    ) {
      res.status(400).json({ success: false, error: "এই ইউজারনেমটি ইতিমধ্যে অন্য ইউজারের রয়েছে।" });
      return;
    }
    users[userIndex].username = trimmedUsername;
  }

  if (typeof isLocked === "boolean") {
    users[userIndex].isLocked = isLocked;
  }

  if (password !== undefined && String(password).length > 0) {
    users[userIndex].password = String(password);
  }

  if (name !== undefined) {
    users[userIndex].name = String(name).trim();
  }

  if (notes !== undefined) {
    users[userIndex].notes = String(notes).trim();
  }

  saveUsers(users);

  res.json({
    success: true,
    user: users[userIndex],
    message: typeof isLocked === "boolean" 
      ? (isLocked ? "ইউজার সফলভাবে লক করা হয়েছে।" : "ইউজার সফলভাবে আনলক করা হয়েছে।")
      : "ইউজার তথ্য আপডেট করা হয়েছে।",
  });
});

// DELETE user (Admin only)
app.delete("/api/admin/users/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const users = loadUsers();
  const filteredUsers = users.filter((u) => u.id !== id);

  saveUsers(filteredUsers);
  res.json({ success: true, message: "ইউজার সফলভাবে মুছে ফেলা হয়েছে।" });
});

// JSON API proxy to get the Live Sports playlist
app.get("/api/playlist", async (req, res) => {
  try {
    const playlistUrl = "https://raw.githubusercontent.com/ireentv/IreenTv-Auto-Update-Json-M3u-Playlist/refs/heads/main/Live_Sports.json";
    
    const response = await fetch(playlistUrl, {
      headers: {
        "User-Agent": PROXY_HEADERS["User-Agent"],
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch playlist from GitHub. Status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("Error fetching playlist:", error.message);
    res.status(500).json({ error: "Failed to load playlist", details: error.message });
  }
});

// HLS Stream proxy with URI rewriting to support playing restricted streams in browser
app.get("/api/stream", async (req, res) => {
  const targetUrl = req.query.url as string;

  if (!targetUrl) {
    res.status(400).send("Missing 'url' query parameter");
    return;
  }

  try {
    // Get headers from query params, falling back to defaults if not provided
    const referer = (req.query.referer as string) || PROXY_HEADERS["Referer"];
    const origin = (req.query.origin as string) || PROXY_HEADERS["Origin"];
    const userAgent = (req.query.userAgent as string) || PROXY_HEADERS["User-Agent"];
    const xff = (req.query.xff as string) || PROXY_HEADERS["x-forwarded-for"];

    const headers: Record<string, string> = {
      "User-Agent": userAgent,
      "Referer": referer,
      "Origin": origin,
      "x-forwarded-for": xff,
    };

    const response = await fetch(targetUrl, { headers });

    if (!response.ok) {
      res.status(response.status).send(`Failed to fetch remote stream asset. Status: ${response.status}`);
      return;
    }

    const contentType = response.headers.get("content-type") || "";
    
    // Check if it's an M3U8 playlist or manifest
    const isPlaylist = 
      contentType.includes("mpegurl") || 
      contentType.includes("mpegURL") || 
      targetUrl.includes(".m3u8") || 
      targetUrl.includes(".m3u");

    if (isPlaylist) {
      const text = await response.text();
      const parentUrl = targetUrl;
      const lines = text.split("\n");

      // Pass along the query parameters to subsequent segment files in the playlist
      const queryParams = new URLSearchParams();
      queryParams.set("referer", referer);
      queryParams.set("origin", origin);
      queryParams.set("userAgent", userAgent);
      queryParams.set("xff", xff);

      const rewrittenLines = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        // Rewrite absolute/relative URLs (lines not starting with #)
        if (!trimmed.startsWith("#")) {
          try {
            const absoluteUrl = new URL(trimmed, parentUrl).href;
            queryParams.set("url", absoluteUrl);
            return `/api/stream?${queryParams.toString()}`;
          } catch (e) {
            return line;
          }
        }

        // Rewrite tags containing URI references (e.g., #EXT-X-KEY, #EXT-X-MEDIA, #EXT-X-STREAM-INF)
        if (trimmed.startsWith("#")) {
          let updatedLine = line;
          
          // Match URI="some_url"
          const uriRegex = /URI="([^"]+)"/g;
          updatedLine = updatedLine.replace(uriRegex, (match, p1) => {
            try {
              const absoluteUrl = new URL(p1, parentUrl).href;
              queryParams.set("url", absoluteUrl);
              return `URI="/api/stream?${queryParams.toString()}"`;
            } catch (e) {
              return match;
            }
          });

          return updatedLine;
        }

        return line;
      });

      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.send(rewrittenLines.join("\n"));
    } else {
      // For TS video segments or other binary assets, pipe the stream back to the client
      res.setHeader("Content-Type", contentType || "video/MP2T");
      
      // Buffer & send body directly
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (error: any) {
    console.error(`Error in proxy for URL ${targetUrl}:`, error.message);
    res.status(500).send(`Proxy Error: ${error.message}`);
  }
});

// Configure Vite or Static Assets based on environment
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
