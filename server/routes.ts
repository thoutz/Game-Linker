import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCommunitySchema, insertPostSchema, insertSessionSchema, insertMessageSchema, insertFriendshipSchema, insertCommunityMemberSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Users
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Friends
  app.get("/api/users/:id/friends", async (req, res) => {
    try {
      const friends = await storage.getFriends(req.params.id);
      const friendsWithoutPasswords = friends.map(({ password, ...friend }) => friend);
      res.json(friendsWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to get friends" });
    }
  });

  app.post("/api/friendships", async (req, res) => {
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

  app.delete("/api/friendships", async (req, res) => {
    try {
      const { userId, friendId } = req.body;
      await storage.removeFriend(userId, friendId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove friend" });
    }
  });

  // Communities
  app.get("/api/communities", async (req, res) => {
    try {
      const communities = await storage.getCommunities();
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

  app.post("/api/communities", async (req, res) => {
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
      const membersWithoutPasswords = members.map(({ password, ...member }) => member);
      res.json(membersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to get members" });
    }
  });

  app.post("/api/communities/:id/join", async (req, res) => {
    try {
      const { userId } = req.body;
      const membership = await storage.joinCommunity({
        communityId: req.params.id,
        userId,
      });
      res.status(201).json(membership);
    } catch (error) {
      res.status(500).json({ error: "Failed to join community" });
    }
  });

  app.post("/api/communities/:id/leave", async (req, res) => {
    try {
      const { userId } = req.body;
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

  // Posts
  app.get("/api/communities/:id/posts", async (req, res) => {
    try {
      const posts = await storage.getPosts(req.params.id);
      const postsWithoutPasswords = posts.map(post => ({
        ...post,
        user: (() => {
          const { password, ...userWithoutPassword } = post.user;
          return userWithoutPassword;
        })()
      }));
      res.json(postsWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to get posts" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    try {
      const validatedData = insertPostSchema.parse(req.body);
      const post = await storage.createPost(validatedData);
      res.status(201).json(post);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  // Sessions
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getSessions();
      const sessionsWithoutPasswords = sessions.map(session => ({
        ...session,
        creator: (() => {
          const { password, ...userWithoutPassword } = session.creator;
          return userWithoutPassword;
        })()
      }));
      res.json(sessionsWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to get sessions" });
    }
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const validatedData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(validatedData);
      res.status(201).json(session);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  // Messages
  app.get("/api/messages/conversation/:userId/:otherUserId", async (req, res) => {
    try {
      const messages = await storage.getConversation(req.params.userId, req.params.otherUserId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to get conversation" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.sendMessage(validatedData);
      res.status(201).json(message);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.get("/api/users/:id/chats", async (req, res) => {
    try {
      const chats = await storage.getRecentChats(req.params.id);
      const chatsWithoutPasswords = chats.map(chat => ({
        ...chat,
        user: (() => {
          const { password, ...userWithoutPassword } = chat.user;
          return userWithoutPassword;
        })()
      }));
      res.json(chatsWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to get chats" });
    }
  });

  // Games
  app.get("/api/games", async (req, res) => {
    try {
      const games = await storage.getGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: "Failed to get games" });
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

  return httpServer;
}
