import { EmbedBuilder } from 'discord.js';
import type { PrefixCommand } from '../types/command.js';
import { getStore } from '../store/store.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// lv hunt - Săn bắn 1 lần
export const prefixHunt: PrefixCommand = {
  name: 'hunt',
  description: 'Săn bắn sinh vật (cooldown 2 phút)',
  async execute(message) {
    const store = getStore();
    const cooldownCheck = store.checkCooldown(message.author.id, 'hunt');
    
    if (!cooldownCheck.canUse) {
      await message.reply(`⏰ Bạn cần chờ ${cooldownCheck.remainingMinutes} phút nữa mới có thể săn bắn.`);
      return;
    }
    
    const user = store.getUser(message.author.id);
    const gameConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/game_config.json'), 'utf8'));
    
    // Lọc creatures theo level
    const availableCreatures = Object.entries(gameConfig.hunt_creatures)
      .filter(([_, config]: [string, any]) => user.level >= config.levelRequired);
    
    if (availableCreatures.length === 0) {
      await message.reply('Bạn cần level cao hơn để săn bắn.');
      return;
    }
    
    // Tính tỷ lệ thành công với weapon bonus
    let baseSuccessRate = 0;
    let creatureName = '';
    let creatureEmoji = '';
    let creatureReward = { min: 0, max: 0 };
    let creatureLoot = '';
    
    // Random creature dựa trên level
    const randomCreature = availableCreatures[Math.floor(Math.random() * availableCreatures.length)];
    const [creatureKey, creatureConfig] = randomCreature as [string, any];
    baseSuccessRate = creatureConfig.successRate;
    creatureName = creatureConfig.name;
    creatureEmoji = creatureConfig.emoji;
    creatureReward = creatureConfig.reward;
    creatureLoot = creatureConfig.loot;
    
    // Áp dụng weapon bonus
    if (user.equippedItems.weapon) {
      const weaponBonus = gameConfig.weapon_bonuses[user.equippedItems.weapon] || 0;
      baseSuccessRate += weaponBonus;
    }
    
    // Áp dụng lucky charm nếu có
    const hasLuckyCharm = store.getItemQuantity(message.author.id, 'huntItems', 'lucky_charm') > 0;
    if (hasLuckyCharm) {
      baseSuccessRate += 20; // +20% với lucky charm
      store.removeItemFromInventory(message.author.id, 'huntItems', 'lucky_charm', 1);
    }
    
    // Thực hiện săn bắn
    const success = Math.random() * 100 < baseSuccessRate;
    let reward = 0;
    let lootMessage = '';
    
    if (success) {
      // Random KG từ 1 - 100 KG
      const kg = Math.floor(1 + Math.random() * 100);
      
      // Tính reward
      reward = creatureReward.min + Math.floor(Math.random() * (creatureReward.max - creatureReward.min + 1));
      
      // Áp dụng campfire buff
      const userClub = store.getUserClub(message.author.id);
      let finalReward = reward;
      if (userClub) {
        const buffs = store.getCampfireBuffs(userClub.campfire.level);
        const bonus = Math.floor(reward * buffs.incomeBonus / 100);
        finalReward += bonus;
      }
      
      user.balance += finalReward;
      
      // Thêm loot vào inventory
      store.addItemToInventory(message.author.id, 'huntItems', creatureLoot, 1);
      
      lootMessage = `\n💰 +${finalReward} LVC\n🥩 +1 ${creatureLoot} (${kg} KG)`;
    }
    
    // Set cooldown
    store.setCooldown(message.author.id, 'hunt', 2);
    
    // Cộng XP
    const xpResult = store.addXP(message.author.id, 15);
    store.save();
    
    // Lấy thông tin club
    const userClub = store.getUserClub(message.author.id);
    
    const embed = new EmbedBuilder()
      .setTitle('🏹 Săn Bắn')
      .setColor(success ? '#00FF00' : '#FF0000')
      .addFields(
        { name: '🎯 Mục tiêu', value: `${creatureEmoji} ${creatureName}`, inline: true },
        { name: '📊 Tỷ lệ thành công', value: `${Math.round(baseSuccessRate)}%`, inline: true },
        { name: '⚔️ Vũ khí', value: user.equippedItems.weapon || 'Không có', inline: true },
        { name: '🎲 Kết quả', value: success ? '✅ Thành công!' : '❌ Thất bại!', inline: false }
      )
      .setTimestamp();
    
    if (success) {
      embed.addFields({ name: '🎁 Phần thưởng', value: lootMessage, inline: false });
    }
    
    if (userClub) {
      const buffs = store.getCampfireBuffs(userClub.campfire.level);
      embed.addFields({ name: '🔥 Campfire Bonus', value: `+${buffs.incomeBonus}% thu nhập`, inline: false });
    }
    
    embed.addFields({ name: '🎯 XP', value: xpResult.message, inline: false });
    
    await message.reply({ embeds: [embed] });
  }
};

// lv hunt equip <tên_vũ_khí> - Trang bị vũ khí
export const prefixHuntEquip: PrefixCommand = {
  name: 'hunt_equip',
  description: 'Trang bị vũ khí săn bắn',
  async execute(message, args) {
    const weaponName = args[0];
    if (!weaponName) {
      await message.reply('Cú pháp: lv hunt equip <tên_vũ_khí>');
      return;
    }
    
    const store = getStore();
    const result = store.equipItem(message.author.id, 'weapon', weaponName);
    
    const embed = new EmbedBuilder()
      .setTitle('⚔️ Trang Bị Vũ Khí')
      .setColor(result.success ? '#00FF00' : '#FF0000')
      .setDescription(result.message)
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};

// lv hunt inventory / lv hunt inv - Xem đồ săn
export const prefixHuntInventory: PrefixCommand = {
  name: 'hunt_inventory',
  description: 'Xem đồ săn bắn',
  async execute(message) {
    const store = getStore();
    const user = store.getUser(message.author.id);
    const huntItems = user.categorizedInventory.huntItems;
    const weapons = user.categorizedInventory.weapons;
    
    const formatItems = (items: Record<string, number>, emoji: string) => {
      const entries = Object.entries(items);
      if (entries.length === 0) return `${emoji} Trống`;
      return entries.map(([item, qty]) => `${emoji} ${item}: ${qty}`).join('\n');
    };
    
    const embed = new EmbedBuilder()
      .setTitle('🏹 Đồ Săn Bắn')
      .setColor('#8B4513')
      .addFields(
        { name: '⚔️ Vũ khí', value: formatItems(weapons, '⚔️'), inline: true },
        { name: '🥩 Đồ săn', value: formatItems(huntItems, '🥩'), inline: true },
        { name: '🎯 Đang trang bị', value: user.equippedItems.weapon || 'Không có', inline: true }
      )
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};

// lv hunt use <tên_bùa> - Dùng bùa phép
export const prefixHuntUse: PrefixCommand = {
  name: 'hunt_use',
  description: 'Dùng bùa phép tăng tỷ lệ săn',
  async execute(message, args) {
    const itemName = args[0];
    if (!itemName) {
      await message.reply('Cú pháp: lv hunt use <tên_bùa>');
      return;
    }
    
    const store = getStore();
    const user = store.getUser(message.author.id);
    
    if (itemName === 'lucky_charm') {
      const hasCharm = store.getItemQuantity(message.author.id, 'huntItems', 'lucky_charm') > 0;
      if (!hasCharm) {
        await message.reply('Bạn không có lucky charm.');
        return;
      }
      
      // Lucky charm sẽ được dùng tự động khi hunt
      await message.reply('🍀 Lucky charm đã được kích hoạt! Sẽ được dùng trong lần săn tiếp theo.');
      return;
    }
    
    await message.reply('Chỉ có thể dùng lucky_charm.');
  }
};

// Main hunt command handler
export const prefixHuntMain: PrefixCommand = {
  name: 'hunt',
  description: 'Săn bắn: hunt/equip/inventory/use',
  async execute(message, args) {
    const subcommand = args[0]?.toLowerCase();
    
    if (subcommand === 'equip') {
      await prefixHuntEquip.execute(message, args.slice(1));
    } else if (subcommand === 'inventory' || subcommand === 'inv') {
      await prefixHuntInventory.execute(message, []);
    } else if (subcommand === 'use') {
      await prefixHuntUse.execute(message, args.slice(1));
    } else {
      // Default: hunt
      await prefixHunt.execute(message, []);
    }
  }
};

export const prefixes: PrefixCommand[] = [prefixHuntMain];
