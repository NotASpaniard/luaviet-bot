import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

type UserProfile = {
  userId: string;
  balance: number;
  daily: { last: number | null; streak: number };
  inventory: Record<string, number>; // woodId -> kg
  quests: { desc: string; reward: number; done: boolean }[];
};

type DB = {
  users: Record<string, UserProfile>;
  clubs: Record<string, Club>;
};

type Club = {
  name: string;
  ownerId: string;
  roleId: string | null;
  members: string[];
  inventory: Record<string, number>; // itemId -> quantity (kho club)
  fire: { until: number | null };
  quests: { desc: string; reward: number; done: boolean }[];
  daily: { day: number | null; completed: string[] };
  campfire: {
    level: number;        // Cấp lửa trại (1-5)
    funds: number;        // Quỹ hiện tại
    totalContributed: number; // Tổng đã đóng góp
    contributors: Record<string, number>; // userId -> số tiền đã donate
  };
};

let singleton: Store | null = null;

export function getStore(): Store {
  if (!singleton) singleton = new Store();
  return singleton;
}

export class Store {
  private file: string;
  private db: DB;

  constructor() {
    const dir = path.join(process.cwd(), 'data');
    if (!existsSync(dir)) mkdirSync(dir);
    this.file = path.join(dir, 'db.json');
    this.db = { users: {}, clubs: {} };
    this.load();
  }

  private load(): void {
    try {
      const raw = readFileSync(this.file, 'utf8');
      this.db = JSON.parse(raw) as DB;
    } catch {
      this.save();
    }
  }

  save(): void {
    writeFileSync(this.file, JSON.stringify(this.db, null, 2), 'utf8');
  }

  getUser(userId: string): UserProfile {
    if (!this.db.users[userId]) {
      this.db.users[userId] = {
        userId,
        balance: 0,
        daily: { last: null, streak: 0 },
        inventory: {},
        quests: this.generateQuests()
      };
      this.save();
    }
    return this.db.users[userId];
  }

  getTopBalances(limit: number): { userId: string; balance: number }[] {
    return Object.values(this.db.users)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limit)
      .map((u) => ({ userId: u.userId, balance: u.balance }));
  }

  getInventory(userId: string): Record<string, number> {
    return this.getUser(userId).inventory;
  }

  // Daily reward with VN time (GMT+7) + Campfire buffs
  claimDaily(userId: string): { amount: number; message: string } {
    const u = this.getUser(userId);
    const now = Date.now();
    const vnNow = now + 7 * 60 * 60 * 1000; // shift to GMT+7
    const day = Math.floor(vnNow / 86400000); // days since epoch at GMT+7
    const lastDay = u.daily.last === null ? null : Math.floor((u.daily.last + 7 * 3600000) / 86400000);

    if (lastDay === day) {
      return { amount: 0, message: 'Hôm nay bạn đã điểm danh rồi.' };
    }

    // streak logic
    if (lastDay !== null && lastDay === day - 1) {
      u.daily.streak += 1;
    } else {
      u.daily.streak = 1;
    }
    u.daily.last = now;

    let reward = 100;
    if (u.daily.streak === 2) reward = 200;
    else if (u.daily.streak === 3) reward = 300;
    else if (u.daily.streak > 7) reward = Math.floor(700 + Math.random() * (1999 - 700 + 1));
    // else default 100

    // Áp dụng campfire buff
    const userClub = this.getUserClub(userId);
    if (userClub) {
      const buffs = this.getCampfireBuffs(userClub.campfire.level);
      const bonus = Math.floor(reward * buffs.incomeBonus / 100);
      reward += bonus;
    }

    u.balance += reward;
    this.save();
    
    let message = `Điểm danh thành công! +${reward} LVC. Streak: ${u.daily.streak}.`;
    if (userClub) {
      const buffs = this.getCampfireBuffs(userClub.campfire.level);
      message += `\n🔥 Campfire Level ${userClub.campfire.level} bonus: +${buffs.incomeBonus}%`;
    }
    
    return { amount: reward, message };
  }

  // Quests
  generateQuests(): { desc: string; reward: number; done: boolean }[] {
    const pool = [
      { desc: 'Chat 50 tin nhắn', reward: 200 },
      { desc: 'Dùng lệnh bất kỳ 5 lần', reward: 150 },
      { desc: 'Đề cập 3 người', reward: 120 },
      { desc: 'Tham gia voice 10 phút', reward: 300 },
      { desc: 'Gửi 1 ảnh', reward: 100 }
    ];
    const pick = () => pool[Math.floor(Math.random() * pool.length)];
    return [pick(), pick(), pick()].map((q) => ({ ...q, done: false }));
  }

  getDailyQuests(userId: string): { desc: string; reward: number; done: boolean }[] {
    const u = this.getUser(userId);
    // reset by VN day
    const now = Date.now();
    const vnDay = Math.floor((now + 7 * 3600000) / 86400000);
    const last = u.daily.last ? Math.floor((u.daily.last + 7 * 3600000) / 86400000) : null;
    if (last !== vnDay) {
      // regenerate quests daily independently of daily claim
      u.quests = this.generateQuests();
      this.save();
    }
    return u.quests;
  }

  refreshDailyQuests(userId: string): void {
    const u = this.getUser(userId);
    u.quests = this.generateQuests();
    this.save();
  }

  // ====== CLUB (CLUB) ======
  ensureClub(name: string): Club {
    if (!this.db.clubs[name]) {
      this.db.clubs[name] = {
        name,
        ownerId: '',
        roleId: null,
        members: [],
        inventory: {},
        fire: { until: null },
        quests: this.generateQuests(),
        daily: { day: null, completed: [] },
        campfire: {
          level: 1,
          funds: 0,
          totalContributed: 0,
          contributors: {}
        }
      };
      this.save();
    }
    return this.db.clubs[name];
  }

  setClubOwner(name: string, ownerId: string, roleId: string | null): Club {
    const c = this.ensureClub(name);
    c.ownerId = ownerId;
    c.roleId = roleId;
    if (!c.members.includes(ownerId)) c.members.push(ownerId);
    this.save();
    return c;
  }

  addClubMember(name: string, userId: string): Club {
    const c = this.ensureClub(name);
    if (!c.members.includes(userId)) c.members.push(userId);
    this.save();
    return c;
  }

  removeClubMember(name: string, userId: string): Club {
    const c = this.ensureClub(name);
    c.members = c.members.filter((m) => m !== userId);
    this.save();
    return c;
  }

  getUserClub(userId: string): Club | null {
    return Object.values(this.db.clubs).find((c) => c.members.includes(userId)) ?? null;
  }

  getClubInventory(name: string): Record<string, number> {
    return this.ensureClub(name).inventory;
  }

  addItemToClub(name: string, itemId: string, quantity: number): void {
    const inv = this.ensureClub(name).inventory;
    inv[itemId] = (inv[itemId] ?? 0) + Math.max(0, Math.floor(quantity));
    this.save();
  }

  // Fire handling
  getClubFire(name: string): { until: number | null } {
    return this.ensureClub(name).fire;
  }

  startClubFire(name: string, minutes: number): void {
    const c = this.ensureClub(name);
    const now = Date.now();
    c.fire.until = now + minutes * 60000;
    this.save();
  }

  // Club quests/daily
  getClubQuests(name: string): { desc: string; reward: number; done: boolean }[] {
    return this.ensureClub(name).quests;
  }

  refreshClubQuests(name: string): void {
    const c = this.ensureClub(name);
    c.quests = this.generateQuests();
    this.save();
  }

  markClubDaily(name: string, userId: string): { completedAll: boolean; message: string } {
    const c = this.ensureClub(name);
    const vnDay = Math.floor((Date.now() + 7 * 3600000) / 86400000);
    if (c.daily.day !== vnDay) {
      c.daily.day = vnDay;
      c.daily.completed = [];
    }
    if (!c.daily.completed.includes(userId)) c.daily.completed.push(userId);
    const completedAll = c.members.length > 0 && c.daily.completed.length === c.members.length;
    this.save();
    return { completedAll, message: `Đã điểm danh club: ${c.daily.completed.length}/${c.members.length}` };
  }

  // ====== CAMPFIRE SYSTEM ======
  contributeToClub(clubName: string, userId: string, amount: number): { success: boolean; message: string; upgraded: boolean } {
    const user = this.getUser(userId);
    if (user.balance < amount) {
      return { success: false, message: 'Không đủ tiền để đóng góp.', upgraded: false };
    }
    
    const club = this.ensureClub(clubName);
    if (!club.members.includes(userId)) {
      return { success: false, message: 'Bạn không phải thành viên của club này.', upgraded: false };
    }

    // Trừ tiền user và thêm vào quỹ club
    user.balance -= amount;
    club.campfire.funds += amount;
    club.campfire.totalContributed += amount;
    club.campfire.contributors[userId] = (club.campfire.contributors[userId] || 0) + amount;

    // Kiểm tra auto-upgrade
    const upgraded = this.upgradeClubCampfire(clubName);
    this.save();
    
    return { 
      success: true, 
      message: `Đã đóng góp ${amount} LVC vào quỹ club. Quỹ hiện tại: ${club.campfire.funds} LVC.`,
      upgraded 
    };
  }

  upgradeClubCampfire(clubName: string): boolean {
    const club = this.ensureClub(clubName);
    const currentLevel = club.campfire.level;
    const requiredFunds = this.getCampfireUpgradeCost(currentLevel + 1);
    
    if (club.campfire.funds >= requiredFunds && currentLevel < 5) {
      club.campfire.level += 1;
      club.campfire.funds -= requiredFunds;
      return true;
    }
    return false;
  }

  getCampfireUpgradeCost(level: number): number {
    const costs = [0, 10000, 100000, 1000000, 10000000, 100000000]; // Level 0-5
    return costs[level] || 0;
  }

  getCampfireBuffs(level: number): { memberSlots: number; incomeBonus: number; cooldownReduction: number; xpBonus: number } {
    return {
      memberSlots: 5 + (level - 1) * 2, // Level 1 = 5, Level 2 = 7, Level 3 = 9, etc.
      incomeBonus: (level - 1) * 5, // +5% per level
      cooldownReduction: (level - 1) * 5, // -5% per level
      xpBonus: (level - 1) * 10 // +10% per level
    };
  }

}


