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
  users,
  communities,
  posts,
  gamingSessions,
  messages,
  friendships,
  communityMembers,
  games,
  userGames
} from "@shared/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  searchUsers(query: string): Promise<User[]>;
  
  getFriends(userId: string): Promise<User[]>;
  addFriend(friendship: InsertFriendship): Promise<Friendship>;
  removeFriend(userId: string, friendId: string): Promise<void>;
  
  getCommunities(): Promise<Community[]>;
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
  addUserGame(userGame: InsertUserGame): Promise<UserGame>;
  getUserGames(userId: string): Promise<(UserGame & { game: Game })[]>;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
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

  async addUserGame(userGame: InsertUserGame): Promise<UserGame> {
    const [result] = await db.insert(userGames).values(userGame).returning();
    return result;
  }

  async getUserGames(userId: string): Promise<(UserGame & { game: Game })[]> {
    const result = await db
      .select()
      .from(userGames)
      .innerJoin(games, eq(userGames.gameId, games.id))
      .where(eq(userGames.userId, userId));
    
    return result.map(r => ({ ...r.user_games, game: r.games }));
  }
}

export const storage = new DatabaseStorage();
