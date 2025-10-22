import { EmbedBuilder } from 'discord.js';
import type { PrefixCommand } from '../types/command.js';
import { getStore } from '../store/store.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// lv farm - Xem trạng thái nông trại
export const prefixFarm: PrefixCommand = {
  name: 'farm',
  description: 'Xem trạng thái nông trại',
  async execute(message, args) {
    const store = getStore();
    const user = store.getUser(message.author.id);
    const gameConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/game_config.json'), 'utf8'));
    
    // Tính thời gian còn lại cho farm
    let farmStatus = 'Không có cây đang trồng';
    let progressBar = '';
    
    if (user.farm.plantedCrop.type) {
      const now = Date.now();
      const cropConfig = gameConfig.crops[user.farm.plantedCrop.type];
      
      if (now < user.farm.plantedCrop.harvestAt!) {
        const totalTime = user.farm.plantedCrop.harvestAt! - user.farm.plantedCrop.plantedAt!;
        const elapsed = now - user.farm.plantedCrop.plantedAt!;
        const remaining = user.farm.plantedCrop.harvestAt! - now;
        const progress = Math.floor((elapsed / totalTime) * 100);
        
        // Tạo progress bar
        const filled = Math.floor(progress / 10);
        progressBar = '[' + '█'.repeat(filled) + '░'.repeat(10 - filled) + `] ${progress}%`;
        
        farmStatus = `🌱 Đang trồng ${cropConfig.emoji} ${cropConfig.name}\n⏰ Còn ${Math.ceil(remaining / 60000)} phút\n${progressBar}`;
      } else {
        farmStatus = `🌾 ${cropConfig.emoji} ${cropConfig.name} đã chín, có thể thu hoạch!`;
      }
    }
    
    // Hiển thị các loại cây có thể trồng
    const availableCrops = Object.entries(gameConfig.crops)
      .filter(([_, config]: [string, any]) => user.farm.level >= config.levelRequired)
      .map(([key, config]: [string, any]) => `${config.emoji} ${config.name} (Level ${config.levelRequired})`)
      .join('\n');
    
    const embed = new EmbedBuilder()
      .setTitle('🌾 Nông Trại')
      .setColor('#228B22')
      .addFields(
        { name: '🏗️ Farm Level', value: `${user.farm.level}`, inline: true },
        { name: '🌱 Trạng thái', value: farmStatus, inline: false },
        { name: '🌾 Có thể trồng', value: availableCrops || 'Cần nâng cấp farm', inline: false }
      )
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};

// lv farm plant <tên_cây> - Gieo trồng
export const prefixFarmPlant: PrefixCommand = {
  name: 'farm_plant',
  description: 'Gieo trồng cây: lv farm plant <tên_cây>',
  async execute(message, args) {
    const cropType = args[0]?.toLowerCase();
    if (!cropType) {
      await message.reply('Cú pháp: lv farm plant <lua|ngo|ca_rot|ca_chua>');
      return;
    }
    
    const store = getStore();
    const result = store.plantCrop(message.author.id, cropType);
    
    if (!result.success) {
      await message.reply(result.message);
      return;
    }
    
    const embed = new EmbedBuilder()
      .setTitle('🌱 Trồng Cây')
      .setColor('#00FF00')
      .setDescription(result.message)
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};

// lv farm harvest - Thu hoạch
export const prefixFarmHarvest: PrefixCommand = {
  name: 'farm_harvest',
  description: 'Thu hoạch nông sản',
  async execute(message) {
    const store = getStore();
    const result = store.harvestCrop(message.author.id);
    
    if (!result.success) {
      await message.reply(result.message);
      return;
    }
    
    // Cộng XP cho harvest
    const xpResult = store.addXP(message.author.id, 20);
    
    const embed = new EmbedBuilder()
      .setTitle('🌾 Thu Hoạch')
      .setColor('#FFD700')
      .setDescription(`${result.message}\n${xpResult.message}`)
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};

// lv farm upgrade - Nâng cấp farm
export const prefixFarmUpgrade: PrefixCommand = {
  name: 'farm_upgrade',
  description: 'Nâng cấp farm',
  async execute(message) {
    const store = getStore();
    const result = store.upgradeFarm(message.author.id);
    
    if (!result.success) {
      await message.reply(result.message);
      return;
    }
    
    const embed = new EmbedBuilder()
      .setTitle('🏗️ Nâng Cấp Farm')
      .setColor('#FF8C00')
      .setDescription(result.message)
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};

// Main farm command handler
export const prefixFarmMain: PrefixCommand = {
  name: 'farm',
  description: 'Quản lý nông trại: farm/plant/harvest/upgrade',
  async execute(message, args) {
    const subcommand = args[0]?.toLowerCase();
    
    if (subcommand === 'plant') {
      await prefixFarmPlant.execute(message, args.slice(1));
    } else if (subcommand === 'harvest') {
      await prefixFarmHarvest.execute(message, []);
    } else if (subcommand === 'upgrade') {
      await prefixFarmUpgrade.execute(message, []);
    } else {
      // Default: show farm status
      await prefixFarm.execute(message, []);
    }
  }
};

export const prefixes: PrefixCommand[] = [prefixFarmMain];
