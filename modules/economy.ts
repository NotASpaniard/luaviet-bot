import { EmbedBuilder } from 'discord.js';
import type { PrefixCommand } from '../types/command.js';
import { getStore } from '../store/store.js';

// lv work - Làm việc kiếm tiền
export const prefixWork: PrefixCommand = {
  name: 'work',
  description: 'Làm việc kiếm LVC (cooldown 1 giờ)',
  async execute(message) {
    const store = getStore();
    const cooldownCheck = store.checkCooldown(message.author.id, 'work');
    
    if (!cooldownCheck.canUse) {
      await message.reply(`⏰ Bạn cần chờ ${cooldownCheck.remainingMinutes} phút nữa mới có thể làm việc.`);
      return;
    }
    
    const user = store.getUser(message.author.id);
    
    // Tính reward: 100-999 LVC + level bonus
    const baseReward = 100 + Math.floor(Math.random() * 900); // 100-999
    const levelBonus = user.level * 5; // +5 LVC per level
    const totalReward = baseReward + levelBonus;
    
    // Áp dụng campfire buff
    const userClub = store.getUserClub(message.author.id);
    let finalReward = totalReward;
    if (userClub) {
      const buffs = store.getCampfireBuffs(userClub.campfire.level);
      const bonus = Math.floor(totalReward * buffs.incomeBonus / 100);
      finalReward += bonus;
    }
    
    user.balance += finalReward;
    store.setCooldown(message.author.id, 'work', 60); // 1 giờ = 60 phút
    
    // Cộng XP
    const xpResult = store.addXP(message.author.id, 10);
    store.save();
    
    const embed = new EmbedBuilder()
      .setTitle('💼 Làm Việc')
      .setColor('#00FF00')
      .addFields(
        { name: '💰 Thu nhập', value: `${finalReward} LVC`, inline: true },
        { name: '📊 Chi tiết', value: `Cơ bản: ${baseReward} LVC\nLevel bonus: +${levelBonus} LVC`, inline: true },
        { name: '⏰ Cooldown', value: '1 giờ', inline: true }
      )
      .setTimestamp();
    
    if (userClub) {
      const buffs = store.getCampfireBuffs(userClub.campfire.level);
      embed.addFields({ name: '🔥 Campfire Bonus', value: `+${buffs.incomeBonus}% thu nhập`, inline: false });
    }
    
    embed.addFields({ name: '🎯 XP', value: xpResult.message, inline: false });
    
    await message.reply({ embeds: [embed] });
  }
};

// lv weekly - Quà hàng tuần
export const prefixWeekly: PrefixCommand = {
  name: 'weekly',
  description: 'Nhận quà hàng tuần (cooldown 7 ngày)',
  async execute(message) {
    const store = getStore();
    const cooldownCheck = store.checkCooldown(message.author.id, 'weekly');
    
    if (!cooldownCheck.canUse) {
      const days = Math.floor(cooldownCheck.remainingMinutes / 1440);
      const hours = Math.floor((cooldownCheck.remainingMinutes % 1440) / 60);
      await message.reply(`⏰ Bạn cần chờ ${days} ngày ${hours} giờ nữa mới có thể nhận quà tuần.`);
      return;
    }
    
    const user = store.getUser(message.author.id);
    
    // Reward: 1000-5000 LVC dựa trên level
    const baseReward = 1000 + (user.level * 200);
    const randomBonus = Math.floor(Math.random() * 1000);
    const totalReward = baseReward + randomBonus;
    
    // Áp dụng campfire buff
    const userClub = store.getUserClub(message.author.id);
    let finalReward = totalReward;
    if (userClub) {
      const buffs = store.getCampfireBuffs(userClub.campfire.level);
      const bonus = Math.floor(totalReward * buffs.incomeBonus / 100);
      finalReward += bonus;
    }
    
    user.balance += finalReward;
    store.setCooldown(message.author.id, 'weekly', 10080); // 7 days in minutes
    
    // Cộng XP
    const xpResult = store.addXP(message.author.id, 50);
    store.save();
    
    const embed = new EmbedBuilder()
      .setTitle('🎁 Quà Hàng Tuần')
      .setColor('#FFD700')
      .addFields(
        { name: '💰 Phần thưởng', value: `${finalReward} LVC`, inline: true },
        { name: '📊 Chi tiết', value: `Cơ bản: ${baseReward} LVC\nBonus: +${randomBonus} LVC`, inline: true },
        { name: '⏰ Cooldown', value: '7 ngày', inline: true }
      )
      .setTimestamp();
    
    if (userClub) {
      const buffs = store.getCampfireBuffs(userClub.campfire.level);
      embed.addFields({ name: '🔥 Campfire Bonus', value: `+${buffs.incomeBonus}% thu nhập`, inline: false });
    }
    
    embed.addFields({ name: '🎯 XP', value: xpResult.message, inline: false });
    
    await message.reply({ embeds: [embed] });
  }
};

// lv bet <amount> - Đặt cược may rủi
export const prefixBet: PrefixCommand = {
  name: 'bet',
  description: 'Đặt cược may rủi 50/50',
  async execute(message, args) {
    const amount = Number(args[0]);
    if (!Number.isFinite(amount) || amount <= 0) {
      await message.reply('Cú pháp: lv bet <số tiền>');
      return;
    }
    
    const store = getStore();
    const user = store.getUser(message.author.id);
    
    if (user.balance < amount) {
      await message.reply('Không đủ tiền để đặt cược.');
      return;
    }
    
    // Trừ tiền trước
    user.balance -= amount;
    
    // 50/50 chance
    const won = Math.random() < 0.5;
    const winnings = won ? Math.floor(amount * 1.8) : 0; // 80% return if win
    user.balance += winnings;
    store.save();
    
    const embed = new EmbedBuilder()
      .setTitle('🎲 Đặt Cược')
      .setColor(won ? '#00FF00' : '#FF0000')
      .addFields(
        { name: '💰 Cược', value: `${amount} LVC`, inline: true },
        { name: '🎯 Kết quả', value: won ? 'Thắng!' : 'Thua!', inline: true },
        { name: '💵 Thắng được', value: `${winnings} LVC`, inline: true }
      )
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};

// lv profile [@user] - Xem profile đầy đủ
export const prefixProfile: PrefixCommand = {
  name: 'profile',
  description: 'Xem profile đầy đủ của user',
  async execute(message, args) {
    const target = message.mentions.users.first() || message.author;
    const store = getStore();
    const user = store.getUser(target.id);
    const userClub = store.getUserClub(target.id);
    
    // Tính thời gian còn lại cho farm
    let farmStatus = 'Không có cây đang trồng';
    if (user.farm.plantedCrop.type) {
      const now = Date.now();
      if (now < user.farm.plantedCrop.harvestAt!) {
        const remainingMs = user.farm.plantedCrop.harvestAt! - now;
        farmStatus = `🌱 Đang trồng ${user.farm.plantedCrop.type} (còn ${Math.ceil(remainingMs / 60000)} phút)`;
      } else {
        farmStatus = `🌾 ${user.farm.plantedCrop.type} đã chín, có thể thu hoạch!`;
      }
    }
    
    // Tính XP cần để level up
    const nextLevel = user.level + 1;
    const xpNeeded = Math.pow(nextLevel, 2) * 100;
    const xpProgress = user.xp;
    const xpToNext = xpNeeded - xpProgress;
    
    const embed = new EmbedBuilder()
      .setTitle(`👤 Profile: ${target.displayName || target.username}`)
      .setColor('#FF8C00')
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: '💰 Số dư', value: `${user.balance.toLocaleString()} LVC`, inline: true },
        { name: '🎯 Level', value: `${user.level}`, inline: true },
        { name: '⭐ XP', value: `${user.xp} (cần ${xpToNext} để lên level ${nextLevel})`, inline: true },
        { name: '🌾 Farm Level', value: `${user.farm.level}`, inline: true },
        { name: '🌱 Trạng thái Farm', value: farmStatus, inline: false },
        { name: '⚔️ Vũ khí', value: user.equippedItems.weapon || 'Không có', inline: true },
        { name: '🎣 Cần câu', value: user.equippedItems.fishingRod || 'Không có', inline: true },
        { name: '🪱 Mồi câu', value: user.equippedItems.bait || 'Không có', inline: true }
      )
      .setTimestamp();
    
    if (userClub) {
      const buffs = store.getCampfireBuffs(userClub.campfire.level);
      embed.addFields({ 
        name: '🏠 Club & Buffs', 
        value: `Club: ${userClub.name}\n🔥 Campfire Level ${userClub.campfire.level}\n• Thu nhập: +${buffs.incomeBonus}%\n• Cooldown: -${buffs.cooldownReduction}%\n• XP: +${buffs.xpBonus}%`, 
        inline: false 
      });
    }
    
    await message.reply({ embeds: [embed] });
  }
};

// lv inventory / lv inv - Xem túi đồ phân loại
export const prefixInventory: PrefixCommand = {
  name: 'inventory',
  description: 'Xem túi đồ phân loại theo category',
  async execute(message) {
    const store = getStore();
    const user = store.getUser(message.author.id);
    const inv = user.categorizedInventory;
    
    const formatItems = (items: Record<string, number>, emoji: string) => {
      const entries = Object.entries(items);
      if (entries.length === 0) return `${emoji} Trống`;
      return entries.map(([item, qty]) => `${emoji} ${item}: ${qty}`).join('\n');
    };
    
    const embed = new EmbedBuilder()
      .setTitle('🎒 Túi Đồ')
      .setColor('#8B4513')
      .addFields(
        { name: '🌾 Hạt giống', value: formatItems(inv.seeds, '🌱'), inline: true },
        { name: '🌽 Nông sản', value: formatItems(inv.crops, '🌾'), inline: true },
        { name: '⚔️ Vũ khí', value: formatItems(inv.weapons, '⚔️'), inline: true },
        { name: '🥩 Đồ săn', value: formatItems(inv.huntItems, '🥩'), inline: true },
        { name: '🎣 Đồ câu', value: formatItems(inv.fishingGear, '🎣'), inline: true },
        { name: '🐟 Cá', value: formatItems(inv.fish, '🐟'), inline: true },
        { name: '📦 Khác', value: formatItems(inv.misc, '📦'), inline: true }
      )
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};

// Alias cho inventory
export const prefixInv: PrefixCommand = {
  name: 'inv',
  description: 'Xem túi đồ (alias của inventory)',
  async execute(message) {
    await prefixInventory.execute(message, []);
  }
};

export const prefixes: PrefixCommand[] = [prefixWork, prefixWeekly, prefixBet, prefixProfile, prefixInventory, prefixInv];
