import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

type UserProfile = {
  userId: string;
  balance: number;
  daily: { last: number | null; streak: number };
  inventory: Record<string, number>; // woodId -> kg
  quests: { desc: string; reward: number; done: boolean }[];
  xp: number;
  level: number;
  cooldowns: {
    work: number | null;
    hunt: number | null;
    fish: number | null;
    weekly: number | null;
  };
  categorizedInventory: {
    seeds: Record<string, number>;      // lua_seed, ngo_seed, etc.
    crops: Record<string, number>;      // lua, ngo, ca_rot, etc.
    weapons: Record<string, number>;    // cung, noi_long_cung, etc.
    huntItems: Record<string, number>;  // thit_tho, thit_ga, lucky_charm, etc.
    fishingGear: Record<string, number>; // can_cau_tre, moi_cau, etc.
    fish: Record<string, number>;       // ca_me, ca_ro, etc.
    misc: Record<string, number>;       // rương kho báu, rác, etc.
  };
  equippedItems: {
    weapon: string | null;
    fishingRod: string | null;
    bait: string | null;
  };
  farm: {
    level: number;
    plantedCrop: {
      type: string | null;
      plantedAt: number | null;
      harvestAt: number | null;
    };
  };
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
        quests: this.generateQuests(),
        xp: 0,
        level: 1,
        cooldowns: {
          work: null,
          hunt: null,
          fish: null,
          weekly: null
        },
        categorizedInventory: {
          seeds: {},
          crops: {},
          weapons: {},
          huntItems: {},
          fishingGear: {},
          fish: {},
          misc: {}
        },
        equippedItems: {
          weapon: null,
          fishingRod: null,
          bait: null
        },
        farm: {
          level: 1,
          plantedCrop: {
            type: null,
            plantedAt: null,
            harvestAt: null
          }
        }
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

    let reward = 100; // Base reward 100 LVC
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
    
    // Cộng XP cho daily
    const xpResult = this.addXP(userId, 25);
    this.save();
    
    let message = `Điểm danh thành công! +${reward} LVC. Streak: ${u.daily.streak}.`;
    if (userClub) {
      const buffs = this.getCampfireBuffs(userClub.campfire.level);
      message += `\n🔥 Campfire Level ${userClub.campfire.level} bonus: +${buffs.incomeBonus}%`;
    }
    message += `\n${xpResult.message}`;
    
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

  // ====== XP & LEVEL SYSTEM ======
  addXP(userId: string, amount: number): { leveledUp: boolean; newLevel: number; message: string } {
    const user = this.getUser(userId);
    user.xp += amount;
    
    const oldLevel = user.level;
    const newLevel = Math.max(1, Math.floor(Math.sqrt(user.xp / 100)));
    const leveledUp = newLevel > oldLevel;
    
    if (leveledUp) {
      user.level = newLevel;
      this.save();
      return {
        leveledUp: true,
        newLevel,
        message: `🎉 Level up! Bạn đã lên level ${newLevel}! (+${amount} XP)`
      };
    }
    
    this.save();
    return {
      leveledUp: false,
      newLevel: oldLevel,
      message: `+${amount} XP (${user.xp}/${Math.pow(newLevel + 1, 2) * 100} để lên level ${newLevel + 1})`
    };
  }

  // ====== COOLDOWN SYSTEM ======
  checkCooldown(userId: string, type: 'work' | 'hunt' | 'fish' | 'weekly'): { canUse: boolean; remainingMinutes: number } {
    const user = this.getUser(userId);
    const cooldownTime = user.cooldowns[type];
    
    if (!cooldownTime) {
      return { canUse: true, remainingMinutes: 0 };
    }
    
    const now = Date.now();
    const remainingMs = cooldownTime - now;
    
    if (remainingMs <= 0) {
      user.cooldowns[type] = null;
      this.save();
      return { canUse: true, remainingMinutes: 0 };
    }
    
    return { canUse: false, remainingMinutes: Math.ceil(remainingMs / 60000) };
  }

  setCooldown(userId: string, type: 'work' | 'hunt' | 'fish' | 'weekly', baseMinutes: number): void {
    const user = this.getUser(userId);
    
    // Áp dụng campfire buff
    const userClub = this.getUserClub(userId);
    let actualMinutes = baseMinutes;
    
    if (userClub) {
      const buffs = this.getCampfireBuffs(userClub.campfire.level);
      actualMinutes = Math.max(1, Math.floor(baseMinutes * (1 - buffs.cooldownReduction / 100)));
    }
    
    user.cooldowns[type] = Date.now() + (actualMinutes * 60000);
    this.save();
  }

  // ====== INVENTORY SYSTEM ======
  addItemToInventory(userId: string, category: keyof UserProfile['categorizedInventory'], itemId: string, quantity: number): void {
    const user = this.getUser(userId);
    user.categorizedInventory[category][itemId] = (user.categorizedInventory[category][itemId] || 0) + quantity;
    this.save();
  }

  removeItemFromInventory(userId: string, category: keyof UserProfile['categorizedInventory'], itemId: string, quantity: number): boolean {
    const user = this.getUser(userId);
    const currentAmount = user.categorizedInventory[category][itemId] || 0;
    
    if (currentAmount < quantity) {
      return false;
    }
    
    user.categorizedInventory[category][itemId] = currentAmount - quantity;
    if (user.categorizedInventory[category][itemId] <= 0) {
      delete user.categorizedInventory[category][itemId];
    }
    this.save();
    return true;
  }

  getItemQuantity(userId: string, category: keyof UserProfile['categorizedInventory'], itemId: string): number {
    const user = this.getUser(userId);
    return user.categorizedInventory[category][itemId] || 0;
  }

  // ====== EQUIPMENT SYSTEM ======
  equipItem(userId: string, slot: 'weapon' | 'fishingRod' | 'bait', itemId: string): { success: boolean; message: string } {
    const user = this.getUser(userId);
    
    // Kiểm tra có item trong inventory không
    const category = slot === 'weapon' ? 'weapons' : slot === 'fishingRod' ? 'fishingGear' : 'fishingGear';
    if (this.getItemQuantity(userId, category, itemId) <= 0) {
      return { success: false, message: 'Bạn không có item này trong túi đồ.' };
    }
    
    user.equippedItems[slot] = itemId;
    this.save();
    return { success: true, message: `Đã trang bị ${itemId}.` };
  }

  // ====== FARM SYSTEM ======
  plantCrop(userId: string, cropType: string): { success: boolean; message: string } {
    const user = this.getUser(userId);
    
    // Kiểm tra farm level
    const gameConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/game_config.json'), 'utf8'));
    const cropConfig = gameConfig.crops[cropType];
    
    if (!cropConfig) {
      return { success: false, message: 'Loại cây không hợp lệ.' };
    }
    
    if (user.farm.level < cropConfig.levelRequired) {
      return { success: false, message: `Cần farm level ${cropConfig.levelRequired} để trồng ${cropConfig.name}.` };
    }
    
    // Kiểm tra đã trồng cây chưa
    if (user.farm.plantedCrop.type) {
      return { success: false, message: 'Đã có cây đang trồng. Hãy thu hoạch trước.' };
    }
    
    // Kiểm tra có hạt giống
    const seedId = `${cropType}_seed`;
    if (this.getItemQuantity(userId, 'seeds', seedId) <= 0) {
      return { success: false, message: `Không có hạt giống ${cropConfig.name}.` };
    }
    
    // Trồng cây
    this.removeItemFromInventory(userId, 'seeds', seedId, 1);
    
    const now = Date.now();
    const growTimeMs = cropConfig.growTime * 60000; // Convert minutes to ms
    
    // Áp dụng campfire buff
    const userClub = this.getUserClub(userId);
    let actualGrowTime = growTimeMs;
    if (userClub) {
      const buffs = this.getCampfireBuffs(userClub.campfire.level);
      actualGrowTime = Math.max(60000, Math.floor(growTimeMs * (1 - buffs.cooldownReduction / 100)));
    }
    
    user.farm.plantedCrop = {
      type: cropType,
      plantedAt: now,
      harvestAt: now + actualGrowTime
    };
    
    this.save();
    return { success: true, message: `Đã trồng ${cropConfig.name}. Thu hoạch sau ${Math.ceil(actualGrowTime / 60000)} phút.` };
  }

  harvestCrop(userId: string): { success: boolean; message: string; reward: number; kg: number } {
    const user = this.getUser(userId);
    
    if (!user.farm.plantedCrop.type) {
      return { success: false, message: 'Không có cây nào để thu hoạch.', reward: 0, kg: 0 };
    }
    
    const now = Date.now();
    if (now < user.farm.plantedCrop.harvestAt!) {
      const remainingMs = user.farm.plantedCrop.harvestAt! - now;
      return { success: false, message: `Cây chưa chín. Còn ${Math.ceil(remainingMs / 60000)} phút.`, reward: 0, kg: 0 };
    }
    
    const gameConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/game_config.json'), 'utf8'));
    const cropConfig = gameConfig.crops[user.farm.plantedCrop.type];
    
    // Random KG từ 0.1 - 100 KG
    const kg = Math.round((0.1 + Math.random() * 99.9) * 10) / 10; // Làm tròn 1 chữ số thập phân
    
    // Tính reward với bonus 10-30%
    const bonusPercent = 10 + Math.random() * 20; // 10-30%
    const reward = Math.floor(cropConfig.baseReward * (1 + bonusPercent / 100));
    
    // Thêm reward vào balance và inventory
    user.balance += reward;
    this.addItemToInventory(userId, 'crops', user.farm.plantedCrop.type, 1);
    
    // Reset farm
    user.farm.plantedCrop = {
      type: null,
      plantedAt: null,
      harvestAt: null
    };
    
    this.save();
    return { success: true, message: `Thu hoạch thành công! +${reward} LVC (+${Math.floor(bonusPercent)}% bonus). Thu được ${kg} KG ${cropConfig.name}.`, reward, kg };
  }

  upgradeFarm(userId: string): { success: boolean; message: string } {
    const user = this.getUser(userId);
    const gameConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/game_config.json'), 'utf8'));
    const nextLevel = user.farm.level + 1;
    const cost = gameConfig.farm_upgrade_costs[nextLevel.toString()];
    
    if (!cost) {
      return { success: false, message: 'Farm đã đạt level tối đa.' };
    }
    
    if (user.balance < cost) {
      return { success: false, message: `Không đủ ${cost} LVC để nâng cấp farm.` };
    }
    
    user.balance -= cost;
    user.farm.level = nextLevel;
    this.save();
    
    return { success: true, message: `Đã nâng cấp farm lên level ${nextLevel}!` };
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


