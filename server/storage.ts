import { db } from "../db";
import { 
  type User, 
  type InsertUser, 
  type UpsertUser,
  type Community,
  type InsertCommunity,
  type Post,
  type InsertPost,
  type Session,
  type InsertSession,
  type Message,
  type InsertMessage,
  type Friendship,
  type InsertFriendship,
  type CommunityMember,
  type InsertCommunityMember,
  type Game,
  type InsertGame,
  type UserGame,
  type InsertUserGame,
  type VoiceChannel,
  type InsertVoiceChannel,
  type VoiceChannelParticipant,
  type InsertVoiceChannelParticipant,
  type Notification,
  type InsertNotification,
  type PostVoiceChannel,
  type InsertPostVoiceChannel,
  type PostVoiceParticipant,
  type InsertPostVoiceParticipant,
  users,
  communities,
  posts,
  gamingSessions,
  messages,
  friendships,
  communityMembers,
  games,
  userGames,
  voiceChannels,
  voiceChannelParticipants,
  notifications,
  postVoiceChannels,
  postVoiceParticipants
} from "@shared/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserBySteamId(steamId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createSteamUser(data: { steamId: string; username: string; avatar?: string; profileImageUrl?: string; steamProfileUrl?: string }): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  searchUsers(query: string): Promise<User[]>;
  
  getFriends(userId: string): Promise<User[]>;
  addFriend(friendship: InsertFriendship): Promise<Friendship>;
  removeFriend(userId: string, friendId: string): Promise<void>;
  
  getCommunities(): Promise<Community[]>;
  getCommunitiesWithMemberCount(): Promise<(Community & { memberCount: number })[]>;
  getCommunityMemberCount(communityId: string): Promise<number>;
  getCommunity(id: string): Promise<Community | undefined>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  getCommunityMembers(communityId: string): Promise<User[]>;
  joinCommunity(membership: InsertCommunityMember): Promise<CommunityMember>;
  leaveCommunity(communityId: string, userId: string): Promise<void>;
  isMember(communityId: string, userId: string): Promise<boolean>;
  
  getPosts(communityId: string): Promise<(Post & { user: User })[]>;
  createPost(post: InsertPost): Promise<Post>;
  
  getSessions(): Promise<(Session & { creator: User })[]>;
  getSession(id: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  
  getConversation(userId: string, otherUserId: string): Promise<Message[]>;
  sendMessage(message: InsertMessage): Promise<Message>;
  getRecentChats(userId: string): Promise<{ user: User; lastMessage: Message }[]>;
  
  getGames(): Promise<Game[]>;
  getGameByName(name: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, data: Partial<InsertGame>): Promise<Game | undefined>;
  addUserGame(userGame: InsertUserGame): Promise<UserGame>;
  updateUserGame(id: string, data: { hoursPlayed?: number; rank?: string }): Promise<UserGame | undefined>;
  deleteUserGame(id: string): Promise<void>;
  getUserGames(userId: string): Promise<(UserGame & { game: Game })[]>;
  getUserGameByGameId(userId: string, gameId: string): Promise<UserGame | undefined>;
  
  getVoiceChannels(communityId: string): Promise<(VoiceChannel & { participantCount: number })[]>;
  getVoiceChannel(id: string): Promise<VoiceChannel | undefined>;
  createVoiceChannel(channel: InsertVoiceChannel): Promise<VoiceChannel>;
  deleteVoiceChannel(id: string): Promise<void>;
  joinVoiceChannel(participant: InsertVoiceChannelParticipant): Promise<VoiceChannelParticipant>;
  leaveVoiceChannel(channelId: string, userId: string): Promise<void>;
  getVoiceChannelParticipants(channelId: string): Promise<(VoiceChannelParticipant & { user: User })[]>;
  isInVoiceChannel(channelId: string, userId: string): Promise<boolean>;
  
  getNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  
  createPostVoiceChannel(channel: InsertPostVoiceChannel): Promise<PostVoiceChannel>;
  getPostVoiceChannel(postId: string): Promise<(PostVoiceChannel & { participantCount: number }) | undefined>;
  joinPostVoiceChannel(participant: InsertPostVoiceParticipant): Promise<PostVoiceParticipant>;
  leavePostVoiceChannel(postVoiceChannelId: string, userId: string): Promise<void>;
  getPostVoiceParticipants(postVoiceChannelId: string): Promise<(PostVoiceParticipant & { user: User })[]>;
  isInPostVoiceChannel(postVoiceChannelId: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserBySteamId(steamId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.steamId, steamId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createSteamUser(data: { steamId: string; username: string; avatar?: string; profileImageUrl?: string; steamProfileUrl?: string }): Promise<User> {
    // Ensure unique username by appending steam ID if needed
    let username = data.username;
    const existingUser = await this.getUserByUsername(username);
    if (existingUser) {
      username = `${data.username}_${data.steamId.slice(-6)}`;
    }
    
    const [user] = await db.insert(users).values({
      username,
      steamId: data.steamId,
      avatar: data.avatar,
      profileImageUrl: data.profileImageUrl,
      steamProfileUrl: data.steamProfileUrl,
    }).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async searchUsers(query: string): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(sql`${users.username} ILIKE ${'%' + query + '%'}`)
      .limit(10);
  }

  async getFriends(userId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(friendships)
      .innerJoin(users, eq(friendships.friendId, users.id))
      .where(eq(friendships.userId, userId));
    
    return result.map(r => r.users);
  }

  async addFriend(friendship: InsertFriendship): Promise<Friendship> {
    const [result] = await db.insert(friendships).values(friendship).returning();
    return result;
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    await db.delete(friendships).where(
      and(
        eq(friendships.userId, userId),
        eq(friendships.friendId, friendId)
      )
    );
  }

  async getCommunities(): Promise<Community[]> {
    return db.select().from(communities).orderBy(desc(communities.createdAt));
  }

  async getCommunitiesWithMemberCount(): Promise<(Community & { memberCount: number })[]> {
    const allCommunities = await db.select().from(communities).orderBy(desc(communities.createdAt));
    
    if (allCommunities.length === 0) return [];
    
    const memberCounts = await db
      .select({
        communityId: communityMembers.communityId,
        count: sql<number>`count(*)::int`,
      })
      .from(communityMembers)
      .groupBy(communityMembers.communityId);
    
    const countMap = new Map(memberCounts.map(mc => [mc.communityId, mc.count]));
    
    return allCommunities.map(community => ({
      ...community,
      memberCount: countMap.get(community.id) || 0,
    }));
  }

  async getCommunityMemberCount(communityId: string): Promise<number> {
    const members = await db
      .select()
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId));
    return members.length;
  }

  async getCommunity(id: string): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.id, id));
    return community;
  }

  async createCommunity(community: InsertCommunity): Promise<Community> {
    const [result] = await db.insert(communities).values(community).returning();
    return result;
  }

  async getCommunityMembers(communityId: string): Promise<User[]> {
    const result = await db
      .select()
      .from(communityMembers)
      .innerJoin(users, eq(communityMembers.userId, users.id))
      .where(eq(communityMembers.communityId, communityId));
    
    return result.map(r => r.users);
  }

  async joinCommunity(membership: InsertCommunityMember): Promise<CommunityMember> {
    const [result] = await db.insert(communityMembers).values(membership).returning();
    return result;
  }

  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    await db.delete(communityMembers).where(
      and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.userId, userId)
      )
    );
  }

  async isMember(communityId: string, userId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(communityMembers)
      .where(
        and(
          eq(communityMembers.communityId, communityId),
          eq(communityMembers.userId, userId)
        )
      );
    return !!result;
  }

  async getPosts(communityId: string): Promise<(Post & { user: User })[]> {
    const result = await db
      .select()
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.communityId, communityId))
      .orderBy(desc(posts.createdAt));
    
    return result.map(r => ({ ...r.posts, user: r.users }));
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [result] = await db.insert(posts).values(post).returning();
    return result;
  }

  async getSessions(): Promise<(Session & { creator: User })[]> {
    const result = await db
      .select()
      .from(gamingSessions)
      .innerJoin(users, eq(gamingSessions.createdBy, users.id))
      .orderBy(gamingSessions.scheduledFor);
    
    return result.map(r => ({ ...r.gaming_sessions, creator: r.users }));
  }

  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(gamingSessions).where(eq(gamingSessions.id, id));
    return session;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [result] = await db.insert(gamingSessions).values(session).returning();
    return result;
  }

  async getConversation(userId: string, otherUserId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, userId),
            eq(messages.receiverId, otherUserId)
          ),
          and(
            eq(messages.senderId, otherUserId),
            eq(messages.receiverId, userId)
          )
        )
      )
      .orderBy(messages.createdAt);
  }

  async sendMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db.insert(messages).values(message).returning();
    return result;
  }

  async getRecentChats(userId: string): Promise<{ user: User; lastMessage: Message }[]> {
    const subquery = db
      .select({
        otherUserId: sql<string>`CASE WHEN ${messages.senderId} = ${userId} THEN ${messages.receiverId} ELSE ${messages.senderId} END`.as('other_user_id'),
        maxCreatedAt: sql<Date>`MAX(${messages.createdAt})`.as('max_created_at'),
      })
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .groupBy(sql`other_user_id`)
      .as('recent');

    const result = await db
      .select({
        user: users,
        lastMessage: messages,
      })
      .from(subquery)
      .innerJoin(users, eq(users.id, subquery.otherUserId))
      .innerJoin(
        messages,
        and(
          eq(messages.createdAt, subquery.maxCreatedAt),
          or(
            and(eq(messages.senderId, userId), eq(messages.receiverId, subquery.otherUserId)),
            and(eq(messages.senderId, subquery.otherUserId), eq(messages.receiverId, userId))
          )
        )
      )
      .orderBy(desc(messages.createdAt));

    return result;
  }

  async getGames(): Promise<Game[]> {
    return db.select().from(games);
  }

  async getGameByName(name: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.name, name));
    return game;
  }

  async createGame(game: InsertGame): Promise<Game> {
    const [result] = await db.insert(games).values(game).returning();
    return result;
  }

  async updateGame(id: string, data: Partial<InsertGame>): Promise<Game | undefined> {
    const [game] = await db.update(games).set(data).where(eq(games.id, id)).returning();
    return game;
  }

  async addUserGame(userGame: InsertUserGame): Promise<UserGame> {
    const [result] = await db.insert(userGames).values(userGame).returning();
    return result;
  }

  async updateUserGame(id: string, data: { hoursPlayed?: number; rank?: string }): Promise<UserGame | undefined> {
    const [result] = await db.update(userGames).set(data).where(eq(userGames.id, id)).returning();
    return result;
  }

  async deleteUserGame(id: string): Promise<void> {
    await db.delete(userGames).where(eq(userGames.id, id));
  }

  async getUserGames(userId: string): Promise<(UserGame & { game: Game })[]> {
    const result = await db
      .select()
      .from(userGames)
      .innerJoin(games, eq(userGames.gameId, games.id))
      .where(eq(userGames.userId, userId));
    
    return result.map(r => ({ ...r.user_games, game: r.games }));
  }

  async getUserGameByGameId(userId: string, gameId: string): Promise<UserGame | undefined> {
    const [result] = await db
      .select()
      .from(userGames)
      .where(and(eq(userGames.userId, userId), eq(userGames.gameId, gameId)));
    return result;
  }

  async getVoiceChannels(communityId: string): Promise<(VoiceChannel & { participantCount: number })[]> {
    const channels = await db
      .select()
      .from(voiceChannels)
      .where(eq(voiceChannels.communityId, communityId))
      .orderBy(voiceChannels.createdAt);
    
    if (channels.length === 0) return [];
    
    const counts = await db
      .select({
        channelId: voiceChannelParticipants.channelId,
        count: sql<number>`count(*)::int`,
      })
      .from(voiceChannelParticipants)
      .groupBy(voiceChannelParticipants.channelId);
    
    const countMap = new Map(counts.map(c => [c.channelId, c.count]));
    
    return channels.map(channel => ({
      ...channel,
      participantCount: countMap.get(channel.id) || 0,
    }));
  }

  async getVoiceChannel(id: string): Promise<VoiceChannel | undefined> {
    const [channel] = await db.select().from(voiceChannels).where(eq(voiceChannels.id, id));
    return channel;
  }

  async createVoiceChannel(channel: InsertVoiceChannel): Promise<VoiceChannel> {
    const [result] = await db.insert(voiceChannels).values(channel).returning();
    return result;
  }

  async deleteVoiceChannel(id: string): Promise<void> {
    await db.delete(voiceChannels).where(eq(voiceChannels.id, id));
  }

  async joinVoiceChannel(participant: InsertVoiceChannelParticipant): Promise<VoiceChannelParticipant> {
    const [result] = await db.insert(voiceChannelParticipants).values(participant).returning();
    return result;
  }

  async leaveVoiceChannel(channelId: string, userId: string): Promise<void> {
    await db.delete(voiceChannelParticipants).where(
      and(
        eq(voiceChannelParticipants.channelId, channelId),
        eq(voiceChannelParticipants.userId, userId)
      )
    );
  }

  async getVoiceChannelParticipants(channelId: string): Promise<(VoiceChannelParticipant & { user: User })[]> {
    const result = await db
      .select()
      .from(voiceChannelParticipants)
      .innerJoin(users, eq(voiceChannelParticipants.userId, users.id))
      .where(eq(voiceChannelParticipants.channelId, channelId));
    
    return result.map(r => ({ ...r.voice_channel_participants, user: r.users }));
  }

  async isInVoiceChannel(channelId: string, userId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(voiceChannelParticipants)
      .where(
        and(
          eq(voiceChannelParticipants.channelId, channelId),
          eq(voiceChannelParticipants.userId, userId)
        )
      );
    return !!result;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result[0]?.count || 0;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [result] = await db.insert(notifications).values(notification).returning();
    return result;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async createPostVoiceChannel(channel: InsertPostVoiceChannel): Promise<PostVoiceChannel> {
    const [result] = await db.insert(postVoiceChannels).values(channel).returning();
    return result;
  }

  async getPostVoiceChannel(postId: string): Promise<(PostVoiceChannel & { participantCount: number }) | undefined> {
    const [channel] = await db
      .select()
      .from(postVoiceChannels)
      .where(eq(postVoiceChannels.postId, postId));
    
    if (!channel) return undefined;
    
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(postVoiceParticipants)
      .where(eq(postVoiceParticipants.postVoiceChannelId, channel.id));
    
    return { ...channel, participantCount: countResult?.count || 0 };
  }

  async joinPostVoiceChannel(participant: InsertPostVoiceParticipant): Promise<PostVoiceParticipant> {
    const [result] = await db.insert(postVoiceParticipants).values(participant).returning();
    return result;
  }

  async leavePostVoiceChannel(postVoiceChannelId: string, userId: string): Promise<void> {
    await db.delete(postVoiceParticipants).where(
      and(
        eq(postVoiceParticipants.postVoiceChannelId, postVoiceChannelId),
        eq(postVoiceParticipants.userId, userId)
      )
    );
  }

  async getPostVoiceParticipants(postVoiceChannelId: string): Promise<(PostVoiceParticipant & { user: User })[]> {
    const result = await db
      .select()
      .from(postVoiceParticipants)
      .innerJoin(users, eq(postVoiceParticipants.userId, users.id))
      .where(eq(postVoiceParticipants.postVoiceChannelId, postVoiceChannelId));
    
    return result.map(r => ({ ...r.post_voice_participants, user: r.users }));
  }

  async isInPostVoiceChannel(postVoiceChannelId: string, userId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(postVoiceParticipants)
      .where(
        and(
          eq(postVoiceParticipants.postVoiceChannelId, postVoiceChannelId),
          eq(postVoiceParticipants.userId, userId)
        )
      );
    return !!result;
  }
}

export const storage = new DatabaseStorage();
