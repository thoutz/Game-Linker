import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertCommunitySchema, insertPostSchema, insertSessionSchema, insertMessageSchema, insertFriendshipSchema, insertVoiceChannelSchema, insertNotificationSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { generateLiveKitToken, generateRoomName, isLiveKitConfigured, getLiveKitUrl } from "./livekit";

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

  app.get("/api/livekit/config", (req, res) => {
    res.json({
      configured: isLiveKitConfigured(),
      url: getLiveKitUrl(),
    });
  });

  app.get("/api/communities/:id/voice-channels", async (req, res) => {
    try {
      const channels = await storage.getVoiceChannels(req.params.id);
      res.json(channels);
    } catch (error) {
      res.status(500).json({ error: "Failed to get voice channels" });
    }
  });

  app.post("/api/communities/:id/voice-channels", isAuthenticated, async (req: any, res) => {
    try {
      const isMember = await storage.isMember(req.params.id, req.user.claims.sub);
      if (!isMember) {
        return res.status(403).json({ error: "Must be a community member" });
      }
      const validatedData = insertVoiceChannelSchema.parse({
        ...req.body,
        communityId: req.params.id,
        livekitRoom: generateRoomName("community", req.params.id + "-" + Date.now()),
      });
      const channel = await storage.createVoiceChannel(validatedData);
      res.status(201).json(channel);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      res.status(500).json({ error: "Failed to create voice channel" });
    }
  });

  app.post("/api/voice-channels/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const channel = await storage.getVoiceChannel(req.params.id);
      if (!channel) {
        return res.status(404).json({ error: "Voice channel not found" });
      }
      
      const participants = await storage.getVoiceChannelParticipants(req.params.id);
      if (participants.length >= channel.maxParticipants) {
        return res.status(400).json({ error: "Voice channel is full" });
      }
      
      const isInChannel = await storage.isInVoiceChannel(req.params.id, userId);
      if (!isInChannel) {
        await storage.joinVoiceChannel({ channelId: req.params.id, userId });
      }
      
      const user = await storage.getUser(userId);
      if (!channel.livekitRoom) {
        return res.status(400).json({ error: "LiveKit room not configured" });
      }
      
      const token = await generateLiveKitToken(
        channel.livekitRoom,
        user?.username || "Anonymous",
        userId
      );
      
      res.json({ token, url: getLiveKitUrl(), room: channel.livekitRoom });
    } catch (error) {
      console.error("Join voice channel error:", error);
      res.status(500).json({ error: "Failed to join voice channel" });
    }
  });

  app.post("/api/voice-channels/:id/leave", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.leaveVoiceChannel(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to leave voice channel" });
    }
  });

  app.get("/api/voice-channels/:id/participants", async (req, res) => {
    try {
      const participants = await storage.getVoiceChannelParticipants(req.params.id);
      res.json(participants);
    } catch (error) {
      res.status(500).json({ error: "Failed to get participants" });
    }
  });

  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  app.post("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification read" });
    }
  });

  app.post("/api/notifications/mark-all-read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsRead(userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications read" });
    }
  });

  app.post("/api/posts/:id/voice-channel", isAuthenticated, async (req: any, res) => {
    try {
      const { maxSlots } = req.body;
      const roomName = generateRoomName("post", req.params.id);
      const channel = await storage.createPostVoiceChannel({
        postId: req.params.id,
        maxSlots: maxSlots || 4,
        livekitRoom: roomName,
        isActive: true,
      });
      res.status(201).json(channel);
    } catch (error) {
      res.status(500).json({ error: "Failed to create post voice channel" });
    }
  });

  app.get("/api/posts/:id/voice-channel", async (req, res) => {
    try {
      const channel = await storage.getPostVoiceChannel(req.params.id);
      if (!channel) {
        return res.json(null);
      }
      const participants = await storage.getPostVoiceParticipants(channel.id);
      res.json({ ...channel, participants });
    } catch (error) {
      res.status(500).json({ error: "Failed to get post voice channel" });
    }
  });

  app.post("/api/post-voice-channels/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const channelId = req.params.id;
      
      const channel = await storage.getPostVoiceChannel(channelId);
      if (!channel) {
        return res.status(404).json({ error: "Voice channel not found" });
      }
      
      if (channel.participantCount >= channel.maxSlots) {
        return res.status(400).json({ error: "Voice channel is full" });
      }
      
      const isInChannel = await storage.isInPostVoiceChannel(channel.id, userId);
      if (!isInChannel) {
        await storage.joinPostVoiceChannel({ postVoiceChannelId: channel.id, userId });
      }
      
      const user = await storage.getUser(userId);
      if (!channel.livekitRoom) {
        return res.status(400).json({ error: "LiveKit room not configured" });
      }
      
      const token = await generateLiveKitToken(
        channel.livekitRoom,
        user?.username || "Anonymous",
        userId
      );
      
      res.json({ token, url: getLiveKitUrl(), room: channel.livekitRoom });
    } catch (error) {
      console.error("Join post voice channel error:", error);
      res.status(500).json({ error: "Failed to join voice channel" });
    }
  });

  app.post("/api/post-voice-channels/:id/leave", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.leavePostVoiceChannel(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to leave voice channel" });
    }
  });

  // Steam Games API
  app.get("/api/steam/games", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.steamId) {
        return res.status(400).json({ error: "Steam account not linked" });
      }
      
      if (!process.env.STEAM_API_KEY) {
        return res.status(500).json({ error: "Steam API not configured" });
      }
      
      // Fetch owned games from Steam Web API
      const steamApiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${user.steamId}&format=json&include_appinfo=true&include_played_free_games=true`;
      
      const response = await fetch(steamApiUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch Steam games");
      }
      
      const data = await response.json();
      const games = data.response?.games || [];
      
      // Format the response
      const formattedGames = games.map((game: any) => ({
        appId: game.appid,
        name: game.name,
        playtimeForever: game.playtime_forever, // in minutes
        playtimeRecent: game.playtime_2weeks || 0, // in minutes
        icon: game.img_icon_url 
          ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`
          : null,
        logo: game.img_logo_url
          ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_logo_url}.jpg`
          : null,
      })).sort((a: any, b: any) => b.playtimeForever - a.playtimeForever);
      
      res.json({ games: formattedGames, totalCount: games.length });
    } catch (error) {
      console.error("Steam games fetch error:", error);
      res.status(500).json({ error: "Failed to fetch Steam games" });
    }
  });

  // Check if Steam auth is available
  app.get("/api/auth/steam/status", (req, res) => {
    res.json({ 
      available: !!process.env.STEAM_API_KEY,
      linked: !!(req.user as any)?.claims?.sub && false // Would need to check user's steamId
    });
  });

  return httpServer;
}
