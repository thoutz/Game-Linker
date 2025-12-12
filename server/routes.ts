import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCommunitySchema, insertPostSchema, insertSessionSchema, insertMessageSchema, insertFriendshipSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  await setupAuth(app);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.patch("/api/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (userId !== req.params.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.get("/api/users/:id/friends", async (req, res) => {
    try {
      const friends = await storage.getFriends(req.params.id);
      res.json(friends);
    } catch (error) {
      res.status(500).json({ error: "Failed to get friends" });
    }
  });

  app.post("/api/friendships", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertFriendshipSchema.parse(req.body);
      const friendship = await storage.addFriend(validatedData);
      res.status(201).json(friendship);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: "Failed to add friend" });
    }
  });

  app.delete("/api/friendships", isAuthenticated, async (req, res) => {
    try {
      const { userId, friendId } = req.body;
      await storage.removeFriend(userId, friendId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove friend" });
    }
  });

  app.get("/api/communities", async (req, res) => {
    try {
      const communities = await storage.getCommunitiesWithMemberCount();
      res.json(communities);
    } catch (error) {
      res.status(500).json({ error: "Failed to get communities" });
    }
  });

  app.get("/api/communities/:id", async (req, res) => {
    try {
      const community = await storage.getCommunity(req.params.id);
      if (!community) {
        return res.status(404).json({ error: "Community not found" });
      }
      res.json(community);
    } catch (error) {
      res.status(500).json({ error: "Failed to get community" });
    }
  });

  app.post("/api/communities", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertCommunitySchema.parse(req.body);
      const community = await storage.createCommunity(validatedData);
      res.status(201).json(community);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: "Failed to create community" });
    }
  });

  app.get("/api/communities/:id/members", async (req, res) => {
    try {
      const members = await storage.getCommunityMembers(req.params.id);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to get members" });
    }
  });

  app.post("/api/communities/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const membership = await storage.joinCommunity({
        communityId: req.params.id,
        userId,
      });
      res.status(201).json(membership);
    } catch (error) {
      res.status(500).json({ error: "Failed to join community" });
    }
  });

  app.post("/api/communities/:id/leave", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.leaveCommunity(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to leave community" });
    }
  });

  app.get("/api/communities/:id/is-member/:userId", async (req, res) => {
    try {
      const isMember = await storage.isMember(req.params.id, req.params.userId);
      res.json({ isMember });
    } catch (error) {
      res.status(500).json({ error: "Failed to check membership" });
    }
  });

  app.get("/api/communities/:id/posts", async (req, res) => {
    try {
      const posts = await storage.getPosts(req.params.id);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get posts" });
    }
  });

  app.post("/api/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertPostSchema.parse({ ...req.body, userId });
      const post = await storage.createPost(validatedData);
      res.status(201).json(post);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get sessions" });
    }
  });

  app.post("/api/sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertSessionSchema.parse({ ...req.body, createdBy: userId });
      const session = await storage.createSession(validatedData);
      res.status(201).json(session);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.get("/api/messages/conversation/:userId/:otherUserId", isAuthenticated, async (req, res) => {
    try {
      const messages = await storage.getConversation(req.params.userId, req.params.otherUserId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to get conversation" });
    }
  });

  app.get("/api/messages/:otherUserId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messages = await storage.getConversation(userId, req.params.otherUserId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to get conversation" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertMessageSchema.parse({ ...req.body, senderId: userId });
      const message = await storage.sendMessage(validatedData);
      res.status(201).json(message);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.get("/api/users/:id/chats", isAuthenticated, async (req, res) => {
    try {
      const chats = await storage.getRecentChats(req.params.id);
      res.json(chats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get chats" });
    }
  });

  app.get("/api/games", async (req, res) => {
    try {
      const games = await storage.getGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: "Failed to get games" });
    }
  });

  app.get("/api/games/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json({ results: [] });
      }
      const apiKey = process.env.RAWG_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "RAWG API key not configured" });
      }
      const response = await fetch(
        `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=10`
      );
      const data = await response.json();
      const results = data.results?.map((game: any) => ({
        id: game.id,
        name: game.name,
        icon: game.background_image,
        released: game.released,
        rating: game.rating,
        platforms: game.platforms?.map((p: any) => p.platform.name) || [],
      })) || [];
      res.json({ results });
    } catch (error) {
      console.error("RAWG API error:", error);
      res.status(500).json({ error: "Failed to search games" });
    }
  });

  app.get("/api/users/:id/games", async (req, res) => {
    try {
      const userGames = await storage.getUserGames(req.params.id);
      res.json(userGames);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user games" });
    }
  });

  app.post("/api/users/:id/games", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (userId !== req.params.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { gameName, gameIcon, rank } = req.body;
      let game = await storage.getGameByName(gameName);
      if (!game) {
        game = await storage.createGame({ name: gameName, icon: gameIcon });
      }
      const userGame = await storage.addUserGame({
        userId,
        gameId: game.id,
        rank,
      });
      res.status(201).json(userGame);
    } catch (error) {
      console.error("Add user game error:", error);
      res.status(500).json({ error: "Failed to add game" });
    }
  });

  app.get("/api/users/search", isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }
      const users = await storage.searchUsers(query);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  return httpServer;
}
