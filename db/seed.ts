import { db, client } from "./index";
import { users, communities, games, friendships, communityMembers, posts, sessions } from "@shared/schema";
import { hashSync } from "bcrypt";

async function seed() {
  console.log("Seeding database...");

  // Create users
  const [user1, user2, user3, user4, user5] = await db.insert(users).values([
    {
      username: "NeoGamer2077",
      password: hashSync("password123", 10),
      email: "neo@nexus.gg",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=NeoGamer",
      bio: "Level 42 • DPS Main",
      status: "online",
    },
    {
      username: "CyberNinja",
      password: hashSync("password123", 10),
      email: "cyber@nexus.gg",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CyberNinja",
      status: "in-game",
      statusText: "Ranked Match - 2/3",
    },
    {
      username: "PixelQueen",
      password: hashSync("password123", 10),
      email: "pixel@nexus.gg",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=PixelQueen",
      status: "online",
    },
    {
      username: "FragMaster99",
      password: hashSync("password123", 10),
      email: "frag@nexus.gg",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=FragMaster",
      status: "offline",
      statusText: "Last seen 2h ago",
    },
    {
      username: "RaidLeader",
      password: hashSync("password123", 10),
      email: "raid@nexus.gg",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=RaidLeader",
      status: "online",
    },
  ]).returning();

  // Create games
  const [apex, arcRaiders, valorant, minecraft] = await db.insert(games).values([
    { name: "Apex Legends" },
    { name: "Arc Raiders" },
    { name: "Valorant" },
    { name: "Minecraft" },
  ]).returning();

  // Create friendships
  await db.insert(friendships).values([
    { userId: user1.id, friendId: user2.id },
    { userId: user1.id, friendId: user3.id },
    { userId: user1.id, friendId: user4.id },
    { userId: user2.id, friendId: user1.id },
  ]);

  // Create communities
  const [community1, community2, community3] = await db.insert(communities).values([
    {
      name: "Arc Raiders Elite",
      game: "Arc Raiders",
      description: "Official community for high-level Arc Raiders gameplay and strategy sharing.",
      image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2670",
      isPrivate: false,
    },
    {
      name: "Cozy Gamers",
      game: "General",
      description: "A chill place for cozy game lovers to share screenshots and vibes.",
      image: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&q=80&w=2670",
      isPrivate: true,
    },
    {
      name: "FPS Legends",
      game: "Shooters",
      description: "Competitive shooter discussion, LFG, and tournament organization.",
      image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=2671",
      isPrivate: false,
    },
  ]).returning();

  // Join communities
  await db.insert(communityMembers).values([
    { communityId: community1.id, userId: user1.id },
    { communityId: community1.id, userId: user2.id },
    { communityId: community1.id, userId: user5.id },
    { communityId: community2.id, userId: user3.id },
    { communityId: community3.id, userId: user4.id },
  ]);

  // Create posts
  await db.insert(posts).values([
    {
      communityId: community1.id,
      userId: user5.id,
      content: "Need 2 more for deep run tonight. 8PM EST.",
    },
    {
      communityId: community1.id,
      userId: user2.id,
      content: "Just found this insane loot spot in the sunken city!",
    },
    {
      communityId: community1.id,
      userId: user1.id,
      content: "Is the heavy laser worth crafting?",
    },
  ]);

  // Create gaming session
  await db.insert(sessions).values([
    {
      title: "Arc Raiders Raid Night",
      game: "Arc Raiders",
      description: "Ranked grinding session, need teammates with mics",
      scheduledFor: new Date(Date.now() + 3600000 * 6), // 6 hours from now
      slotsNeeded: 2,
      createdBy: user1.id,
    },
  ]);

  console.log("Seed completed successfully!");
  await client.end();
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
