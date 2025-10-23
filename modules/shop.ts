import { EmbedBuilder } from 'discord.js';
import type { PrefixCommand } from '../types/command.js';
import { getStore } from '../store/store.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// lv shop - Xem tất cả shop categories
export const prefixShop: PrefixCommand = {
  name: 'shop',
  description: 'Xem tất cả cửa hàng',
  async execute(message, args) {
    const subcommand = args[0]?.toLowerCase();
    
    if (subcommand === 'seeds') {
      await showSeedsShop(message);
    } else if (subcommand === 'weapons') {
      await showWeaponsShop(message);
    } else if (subcommand === 'fishing') {
      await showFishingShop(message);
    } else if (subcommand === 'roles') {
      await showRolesShop(message);
    } else {
      // Default: show all shops
      const embed = new EmbedBuilder()
        .setTitle('🛒 Cửa Hàng Lửa Việt')
        .setColor('#FF8C00')
        .setDescription('Chọn loại cửa hàng bạn muốn xem:')
        .addFields(
          { name: '🌾 Hạt giống', value: '`lv shop seeds` - Mua hạt giống trồng cây', inline: false },
          { name: '⚔️ Vũ khí', value: '`lv shop weapons` - Mua vũ khí săn bắn', inline: false },
          { name: '🎣 Đồ câu cá', value: '`lv shop fishing` - Mua cần câu và mồi', inline: false },
          { name: '🎭 Role', value: '`lv shop roles` - Mua role đặc biệt', inline: false },
          { name: '💰 Mua/Bán', value: '`lv buy <item_id> [số lượng]` - Mua item\n`lv sell <item_id> [số lượng]` - Bán item', inline: false }
        )
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
    }
  }
};

// Show seeds shop
async function showSeedsShop(message: any) {
  const shopConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/shop_config.json'), 'utf8'));
  const seeds = shopConfig.seeds;
  
  const items = Object.entries(seeds).map(([id, config]: [string, any]) => 
    `**${config.name}** (${id})\n💰 ${config.price} LVC | Level ${config.levelRequired}\n${config.description}`
  ).join('\n\n');
  
  const embed = new EmbedBuilder()
    .setTitle('🌾 Cửa Hàng Hạt Giống')
    .setColor('#228B22')
    .setDescription(items)
    .setFooter({ text: 'Dùng: lv buy <item_id> [số lượng] để mua' })
    .setTimestamp();
  
  await message.reply({ embeds: [embed] });
}

// Show weapons shop
async function showWeaponsShop(message: any) {
  const shopConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/shop_config.json'), 'utf8'));
  const weapons = shopConfig.weapons;
  
  const items = Object.entries(weapons).map(([id, config]: [string, any]) => 
    `**${config.name}** (${id})\n💰 ${config.price} LVC | Level ${config.levelRequired}\n${config.description}`
  ).join('\n\n');
  
  const embed = new EmbedBuilder()
    .setTitle('⚔️ Cửa Hàng Vũ Khí')
    .setColor('#8B0000')
    .setDescription(items)
    .setFooter({ text: 'Dùng: lv buy <item_id> [số lượng] để mua' })
    .setTimestamp();
  
  await message.reply({ embeds: [embed] });
}

// Show fishing shop
async function showFishingShop(message: any) {
  const shopConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/shop_config.json'), 'utf8'));
  const fishingGear = shopConfig.fishing_gear;
  
  const items = Object.entries(fishingGear).map(([id, config]: [string, any]) => 
    `**${config.name}** (${id})\n💰 ${config.price} LVC | Level ${config.levelRequired}\n${config.description}`
  ).join('\n\n');
  
  const embed = new EmbedBuilder()
    .setTitle('🎣 Cửa Hàng Đồ Câu Cá')
    .setColor('#4682B4')
    .setDescription(items)
    .setFooter({ text: 'Dùng: lv buy <item_id> [số lượng] để mua' })
    .setTimestamp();
  
  await message.reply({ embeds: [embed] });
}

// Show roles shop
async function showRolesShop(message: any) {
  const shopConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/shop_config.json'), 'utf8'));
  const roles = shopConfig.roles;
  
  const items = Object.entries(roles).map(([id, config]: [string, any]) => 
    `**${config.name}** (${id})\n💰 ${config.price} LVC | Level ${config.levelRequired}\n${config.description}`
  ).join('\n\n');
  
  const embed = new EmbedBuilder()
    .setTitle('🎭 Cửa Hàng Role')
    .setColor('#FFD700')
    .setDescription(items)
    .setFooter({ text: 'Dùng: lv buy <item_id> để mua role' })
    .setTimestamp();
  
  await message.reply({ embeds: [embed] });
}

// lv buy <item_id> [số lượng] - Mua item
export const prefixBuy: PrefixCommand = {
  name: 'buy',
  description: 'Mua item từ cửa hàng',
  async execute(message, args) {
    const itemId = args[0];
    const quantity = Number(args[1]) || 1;
    
    if (!itemId || !Number.isFinite(quantity) || quantity <= 0) {
      await message.reply('Cú pháp: lv buy <item_id> [số lượng]');
      return;
    }
    
    const store = getStore();
    const user = store.getUser(message.author.id);
    const shopConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/shop_config.json'), 'utf8'));
    
    // Tìm item trong tất cả categories
    let itemConfig = null;
    let category = '';
    
    for (const [cat, items] of Object.entries(shopConfig)) {
      if (cat === 'seeds' || cat === 'weapons' || cat === 'fishing_gear' || cat === 'roles') {
        const itemsData = items as any;
        if (itemsData[itemId]) {
          itemConfig = itemsData[itemId];
          category = cat === 'fishing_gear' ? 'fishingGear' : cat;
          break;
        }
      }
    }
    
    if (!itemConfig) {
      await message.reply('Item không tồn tại trong cửa hàng.');
      return;
    }
    
    // Kiểm tra level requirement
    if (user.level < itemConfig.levelRequired) {
      await message.reply(`Cần level ${itemConfig.levelRequired} để mua item này.`);
      return;
    }
    
    // Kiểm tra đủ tiền
    const totalCost = itemConfig.price * quantity;
    if (user.balance < totalCost) {
      await message.reply(`Không đủ tiền. Cần ${totalCost} LVC, bạn có ${user.balance} LVC.`);
      return;
    }
    
    // Xử lý mua role đặc biệt
    if (category === 'roles') {
      if (quantity > 1) {
        await message.reply('Chỉ có thể mua 1 role.');
        return;
      }
      
      // Gán role cho user (cần implement role assignment)
      user.balance -= totalCost;
      store.save();
      
      const embed = new EmbedBuilder()
        .setTitle('🎭 Mua Role')
        .setColor('#FFD700')
        .setDescription(`Đã mua role **${itemConfig.name}** thành công!\n💰 -${totalCost} LVC`)
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
      return;
    }
    
    // Mua item thường
    user.balance -= totalCost;
    store.addItemToInventory(message.author.id, category as any, itemId, quantity);
    store.save();
    
    const embed = new EmbedBuilder()
      .setTitle('🛒 Mua Hàng')
      .setColor('#00FF00')
      .setDescription(`Đã mua **${itemConfig.name}** x${quantity} thành công!\n💰 -${totalCost} LVC`)
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};

// lv sell <item_id> [số lượng] - Bán item
export const prefixSell: PrefixCommand = {
  name: 'sell',
  description: 'Bán item (70% giá mua)',
  async execute(message, args) {
    const itemId = args[0];
    const quantity = Number(args[1]) || 1;
    
    if (!itemId || !Number.isFinite(quantity) || quantity <= 0) {
      await message.reply('Cú pháp: lv sell <item_id> [số lượng]');
      return;
    }
    
    const store = getStore();
    const user = store.getUser(message.author.id);
    const shopConfig = JSON.parse(readFileSync(path.join(process.cwd(), 'data/shop_config.json'), 'utf8'));
    
    // Tìm item trong tất cả categories
    let itemConfig = null;
    let category = '';
    
    for (const [cat, items] of Object.entries(shopConfig)) {
      if (cat === 'seeds' || cat === 'weapons' || cat === 'fishing_gear') {
        const itemsData = items as any;
        if (itemsData[itemId]) {
          itemConfig = itemsData[itemId];
          category = cat === 'fishing_gear' ? 'fishingGear' : cat;
          break;
        }
      }
    }
    
    if (!itemConfig) {
      await message.reply('Item không thể bán.');
      return;
    }
    
    // Kiểm tra có đủ item không
    const currentQuantity = store.getItemQuantity(message.author.id, category as any, itemId);
    if (currentQuantity < quantity) {
      await message.reply(`Không đủ ${itemConfig.name}. Bạn có ${currentQuantity}, cần ${quantity}.`);
      return;
    }
    
    // Tính giá bán (70% giá mua)
    const sellPrice = Math.floor(itemConfig.price * 0.7);
    const totalEarned = sellPrice * quantity;
    
    // Bán item
    store.removeItemFromInventory(message.author.id, category as any, itemId, quantity);
    user.balance += totalEarned;
    store.save();
    
    const embed = new EmbedBuilder()
      .setTitle('💰 Bán Hàng')
      .setColor('#FFA500')
      .setDescription(`Đã bán **${itemConfig.name}** x${quantity} thành công!\n💰 +${totalEarned} LVC (70% giá mua)`)
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
  }
};

export const prefixes: PrefixCommand[] = [prefixShop, prefixBuy, prefixSell];
