import { EmbedBuilder } from 'discord.js';
import type { PrefixCommand } from '../types/command.js';
import { getStore } from '../store/store.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// lv fish - Câu cá 1 lần
export const prefixFish: PrefixCommand = {
  name: 'fish',
  description: 'Câu cá (cooldown 5 phút)',
  async execute(message) {
    const store = getStore();
    const cooldownCheck = store.checkCooldown(message.author.id, 'fish');
    
    if (!cooldownCheck.canUse) {
      await message.reply(`⏰ Bạn cần chờ ${cooldownCheck.remainingMinutes} phút nữa mới có thể câu cá.`);
      return;
    }
    
    const user = store.getUser(message.author.id);
    const gameConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/game_config.json'), 'utf8'));
    
    // Lọc fish theo level
    const availableFish = Object.entries(gameConfig.fish_types)
      .filter(([_, config]: [string, any]) => user.level >= config.levelRequired);
    
    if (availableFish.length === 0) {
      await message.reply('Bạn cần level cao hơn để câu cá.');
      return;
    }
    
    // Tính tỷ lệ câu được với gear bonus
    let baseCatchRate = 0;
    let fishName = '';
    let fishEmoji = '';
    let fishReward = { min: 0, max: 0 };
    
    // Random fish dựa trên level
    const randomFish = availableFish[Math.floor(Math.random() * availableFish.length)];
    const [fishKey, fishConfig] = randomFish;
    baseCatchRate = fishConfig.catchRate;
    fishName = fishConfig.name;
    fishEmoji = fishConfig.emoji;
    fishReward = fishConfig.reward;
    
    // Áp dụng fishing gear bonus
    if (user.equippedItems.fishingRod) {
      const rodBonus = gameConfig.fishing_gear_bonuses[user.equippedItems.fishingRod] || 0;
      baseCatchRate += rodBonus;
    }
    
    // Áp dụng mồi câu nếu có
    const hasBait = user.equippedItems.bait && store.getItemQuantity(message.author.id, 'fishingGear', user.equippedItems.bait) > 0;
    if (hasBait) {
      const baitBonus = gameConfig.fishing_gear_bonuses[user.equippedItems.bait] || 0;
      baseCatchRate += baitBonus;
      // Tiêu hao mồi
      store.removeItemFromInventory(message.author.id, 'fishingGear', user.equippedItems.bait, 1);
    }
    
    // Kiểm tra special events (rương kho báu, rác)
    const specialEvents = gameConfig.special_events;
    const totalSpecialRate = Object.values(specialEvents).reduce((sum: number, event: any) => sum + event.rate, 0);
    const randomSpecial = Math.random() * 100;
    
    let result = '';
    let reward = 0;
    let lootMessage = '';
    let isSpecial = false;
    
    if (randomSpecial < totalSpecialRate) {
      // Special event
      isSpecial = true;
      const events = Object.entries(specialEvents);
      let cumulativeRate = 0;
      let selectedEvent = null;
      
      for (const [key, event]: [string, any]) {
        cumulativeRate += event.rate;
        if (randomSpecial < cumulativeRate) {
          selectedEvent = { key, ...event };
          break;
        }
      }
      
      if (selectedEvent) {
        result = `${selectedEvent.emoji} ${selectedEvent.name}`;
        if (selectedEvent.key === 'ruong_kho_bau') {
          reward = selectedEvent.reward.min + Math.floor(Math.random() * (selectedEvent.reward.max - selectedEvent.reward.min + 1));
          lootMessage = `💰 +${reward} LVC`;
        } else {
          reward = 0;
          lootMessage = 'Không có gì...';
        }
      }
    } else {
      // Normal fishing
      const success = Math.random() * 100 < baseCatchRate;
      
      if (success) {
        result = `${fishEmoji} ${fishName}`;
        reward = fishReward.min + Math.floor(Math.random() * (fishReward.max - fishReward.min + 1));
        
        // Thêm cá vào inventory
        store.addItemToInventory(message.author.id, 'fish', fishKey, 1);
        lootMessage = `💰 +${reward} LVC\n🐟 +1 ${fishKey}`;
      } else {
        result = '🌊 Không câu được gì';
        reward = 0;
        lootMessage = 'Thử lại lần sau!';
      }
    }
    
    // Áp dụng campfire buff cho reward
    const userClub = store.getUserClub(message.author.id);
    let finalReward = reward;
    if (userClub && reward > 0) {
      const buffs = store.getCampfireBuffs(userClub.campfire.level);
      const bonus = Math.floor(reward * buffs.incomeBonus / 100);
      finalReward += bonus;
    }
    
    if (finalReward > 0) {
      user.balance += finalReward;
    }
    
    // Set cooldown
    store.setCooldown(message.author.id, 'fish', 5);
    
    // Cộng XP
    const xpResult = store.addXP(message.author.id, 12);
    store.save();
    
    const embed = new EmbedBuilder()
      .setTitle('🎣 Câu Cá')
      .setColor(reward > 0 ? '#00FF00' : '#FFA500')
      .addFields(
        { name: '🎣 Kết quả', value: result, inline: true },
        { name: '📊 Tỷ lệ thành công', value: `${Math.round(baseCatchRate)}%`, inline: true },
        { name: '🎣 Cần câu', value: user.equippedItems.fishingRod || 'Không có', inline: true },
        { name: '🪱 Mồi câu', value: user.equippedItems.bait || 'Không có', inline: true }
      )
      .setTimestamp();
    
    if (reward > 0) {
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

// lv fish equip <tên_cần> - Trang bị cần câu
export const prefixFishEquip: PrefixCommand = {
  name: 'fish_equip',
  description: 'Trang bị cần câu',
  async execute(message, args) {
    const rodName = args[0];
    if (!rodName) {
      await message.reply('Cú pháp: lv fish equip <tên_cần_câu>');
      return;
    }
    
    const store = getStore();
    const result = store.equipItem(message.author.id, 'fishingRod', rodName);
    
    const embed = new EmbedBuilder()
      .setTitle('🎣 Trang Bị Cần Câu')
      .setColor(result.success ? '#00FF00' : '#FF0000')
      .setDescription(result.message)
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};

// lv fish use <tên_mồi> - Dùng mồi câu
export const prefixFishUse: PrefixCommand = {
  name: 'fish_use',
  description: 'Dùng mồi câu',
  async execute(message, args) {
    const baitName = args[0];
    if (!baitName) {
      await message.reply('Cú pháp: lv fish use <tên_mồi>');
      return;
    }
    
    const store = getStore();
    const result = store.equipItem(message.author.id, 'bait', baitName);
    
    const embed = new EmbedBuilder()
      .setTitle('🪱 Dùng Mồi Câu')
      .setColor(result.success ? '#00FF00' : '#FF0000')
      .setDescription(result.message)
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};

// lv fish inventory / lv fish inv - Xem đồ câu cá
export const prefixFishInventory: PrefixCommand = {
  name: 'fish_inventory',
  description: 'Xem đồ câu cá',
  async execute(message) {
    const store = getStore();
    const user = store.getUser(message.author.id);
    const fishingGear = user.categorizedInventory.fishingGear;
    const fish = user.categorizedInventory.fish;
    
    const formatItems = (items: Record<string, number>, emoji: string) => {
      const entries = Object.entries(items);
      if (entries.length === 0) return `${emoji} Trống`;
      return entries.map(([item, qty]) => `${emoji} ${item}: ${qty}`).join('\n');
    };
    
    const embed = new EmbedBuilder()
      .setTitle('🎣 Đồ Câu Cá')
      .setColor('#4682B4')
      .addFields(
        { name: '🎣 Đồ câu', value: formatItems(fishingGear, '🎣'), inline: true },
        { name: '🐟 Cá', value: formatItems(fish, '🐟'), inline: true },
        { name: '🎣 Đang trang bị', value: `Cần câu: ${user.equippedItems.fishingRod || 'Không có'}\nMồi: ${user.equippedItems.bait || 'Không có'}`, inline: true }
      )
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};

// Main fish command handler
export const prefixFishMain: PrefixCommand = {
  name: 'fish',
  description: 'Câu cá: fish/equip/use/inventory',
  async execute(message, args) {
    const subcommand = args[0]?.toLowerCase();
    
    if (subcommand === 'equip') {
      await prefixFishEquip.execute(message, args.slice(1));
    } else if (subcommand === 'use') {
      await prefixFishUse.execute(message, args.slice(1));
    } else if (subcommand === 'inventory' || subcommand === 'inv') {
      await prefixFishInventory.execute(message, []);
    } else {
      // Default: fish
      await prefixFish.execute(message, []);
    }
  }
};

export const prefixes: PrefixCommand[] = [prefixFishMain];
