import { db } from "../db";
import { 
  type User, 
  type InsertUser, 
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
  sessions,
  messages,
  friendships,
  communityMembers,
  games,
  userGames
} from "@shared/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  
  // Friends
  getFriends(userId: string): Promise<User[]>;
  addFriend(friendship: InsertFriendship): Promise<Friendship>;
  removeFriend(userId: string, friendId: string): Promise<void>;
  
  // Communities
  getCommunities(): Promise<Community[]>;
  getCommunity(id: string): Promise<Community | undefined>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  getCommunityMembers(communityId: string): Promise<User[]>;
  joinCommunity(membership: InsertCommunityMember): Promise<CommunityMember>;
  leaveCommunity(communityId: string, userId: string): Promise<void>;
  isMember(communityId: string, userId: string): Promise<boolean>;
  
  // Posts
  getPosts(communityId: string): Promise<(Post & { user: User })[]>;
  createPost(post: InsertPost): Promise<Post>;
  
  // Sessions
  getSessions(): Promise<(Session & { creator: User })[]>;
  getSession(id: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  
  // Messages
  getConversation(userId: string, otherUserId: string): Promise<Message[]>;
  sendMessage(message: InsertMessage): Promise<Message>;
  getRecentChats(userId: string): Promise<{ user: User; lastMessage: Message }[]>;
  
  // Games
  getGames(): Promise<Game[]>;
  addUserGame(userGame: InsertUserGame): Promise<UserGame>;
  getUserGames(userId: string): Promise<(UserGame & { game: Game })[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
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
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  // Friends
  async getFriends(userId: string): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        password: users.password,
        email: users.email,
        avatar: users.avatar,
        bio: users.bio,
        status: users.status,
        statusText: users.statusText,
        createdAt: users.createdAt,
      })
      .from(friendships)
      .innerJoin(users, eq(friendships.friendId, users.id))
      .where(eq(friendships.userId, userId));
    
    return result;
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

  // Communities
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
      .select({
        id: users.id,
        username: users.username,
        password: users.password,
        email: users.email,
        avatar: users.avatar,
        bio: users.bio,
        status: users.status,
        statusText: users.statusText,
        createdAt: users.createdAt,
      })
      .from(communityMembers)
      .innerJoin(users, eq(communityMembers.userId, users.id))
      .where(eq(communityMembers.communityId, communityId));
    
    return result;
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

  // Posts
  async getPosts(communityId: string): Promise<(Post & { user: User })[]> {
    const result = await db
      .select({
        id: posts.id,
        communityId: posts.communityId,
        userId: posts.userId,
        content: posts.content,
        createdAt: posts.createdAt,
        user: {
          id: users.id,
          username: users.username,
          password: users.password,
          email: users.email,
          avatar: users.avatar,
          bio: users.bio,
          status: users.status,
          statusText: users.statusText,
          createdAt: users.createdAt,
        }
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.communityId, communityId))
      .orderBy(desc(posts.createdAt));
    
    return result;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [result] = await db.insert(posts).values(post).returning();
    return result;
  }

  // Sessions
  async getSessions(): Promise<(Session & { creator: User })[]> {
    const result = await db
      .select({
        id: sessions.id,
        title: sessions.title,
        game: sessions.game,
        description: sessions.description,
        scheduledFor: sessions.scheduledFor,
        slotsNeeded: sessions.slotsNeeded,
        createdBy: sessions.createdBy,
        createdAt: sessions.createdAt,
        creator: {
          id: users.id,
          username: users.username,
          password: users.password,
          email: users.email,
          avatar: users.avatar,
          bio: users.bio,
          status: users.status,
          statusText: users.statusText,
          createdAt: users.createdAt,
        }
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.createdBy, users.id))
      .orderBy(sessions.scheduledFor);
    
    return result;
  }

  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [result] = await db.insert(sessions).values(session).returning();
    return result;
  }

  // Messages
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
        user: {
          id: users.id,
          username: users.username,
          password: users.password,
          email: users.email,
          avatar: users.avatar,
          bio: users.bio,
          status: users.status,
          statusText: users.statusText,
          createdAt: users.createdAt,
        },
        lastMessage: {
          id: messages.id,
          senderId: messages.senderId,
          receiverId: messages.receiverId,
          content: messages.content,
          createdAt: messages.createdAt,
        }
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

  // Games
  async getGames(): Promise<Game[]> {
    return db.select().from(games);
  }

  async addUserGame(userGame: InsertUserGame): Promise<UserGame> {
    const [result] = await db.insert(userGames).values(userGame).returning();
    return result;
  }

  async getUserGames(userId: string): Promise<(UserGame & { game: Game })[]> {
    const result = await db
      .select({
        id: userGames.id,
        userId: userGames.userId,
        gameId: userGames.gameId,
        rank: userGames.rank,
        hoursPlayed: userGames.hoursPlayed,
        game: {
          id: games.id,
          name: games.name,
          icon: games.icon,
        }
      })
      .from(userGames)
      .innerJoin(games, eq(userGames.gameId, games.id))
      .where(eq(userGames.userId, userId));
    
    return result;
  }
}

export const storage = new DatabaseStorage();
