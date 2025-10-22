import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder, time } from 'discord.js';
import type { PrefixCommand, SlashCommand } from '../types/command.js';
import { getStore } from '../store/store.js';
import { getEnv } from '../lib/env.js';

// ===================== BASIC CMDS =====================
// Slash: /help
export const slash: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Kiểm tra thông tin, cách dùng các lệnh basic và camping'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🔥 Hướng dẫn sử dụng bot Lửa Việt')
      .setDescription('Danh sách các lệnh và chức năng của bot')
      .setColor('#FF8C00')
      .addFields(
        { 
          name: '⚙️ Prefix Commands', 
          value: `Sử dụng prefix: \`${getEnv().PREFIX}\``,
          inline: false
        },
        { 
          name: '💰 Lệnh Kinh Tế (Economy)', 
          value: [
            '• `lv work` - Làm việc kiếm LVC (30 phút)',
            '• `lv daily` - Nhận thưởng hàng ngày',
            '• `lv weekly` - Quà hàng tuần (7 ngày)',
            '• `lv bet <số tiền>` - Đặt cược may rủi 50/50',
            '• `lv cash` - Kiểm tra số dư tài khoản',
            '• `lv profile [@user]` - Xem profile đầy đủ',
            '• `lv give <@user> <số tiền>` - Chuyển tiền cho người khác',
            '• `lv bxh` - Xem bảng xếp hạng giàu có',
            '• `lv quest` - Xem và làm nhiệm vụ hàng ngày',
            '• `lv inventory` / `lv inv` - Xem túi đồ phân loại'
          ].join('\n'),
          inline: false
        },
        { 
          name: '🏠 Lệnh Club', 
          value: [
            '• `/clubowner <@user> <tên club> <role>` - Quản lý chủ club',
            '• `lv club create <tên>` - Tạo club mới',
            '• `lv club add/remove/list` - Quản lý thành viên club',
            '• `lv club daily` - Nhận thưởng club hàng ngày',
            '• `lv club bxh` - Bảng xếp hạng club',
            '• `lv club inv` - Xem kho club',
            '• `lv club quest` - Nhiệm vụ club',
            '• `lv club info` - Thông tin campfire & buff',
            '• `lv club donate <số tiền>` - Đóng góp nâng cấp campfire'
          ].join('\n'),
          inline: false
        },
        { 
          name: '🌾 Lệnh Nông Trại (Farm)', 
          value: [
            '• `lv farm` - Xem trạng thái nông trại',
            '• `lv farm plant <lua|ngo|ca_rot|ca_chua>` - Gieo trồng cây',
            '• `lv farm harvest` - Thu hoạch nông sản',
            '• `lv farm upgrade` - Nâng cấp farm'
          ].join('\n'),
          inline: false
        },
        { 
          name: '🏹 Lệnh Săn Bắn (Hunt)', 
          value: [
            '• `lv hunt` - Săn bắn sinh vật (10 phút)',
            '• `lv hunt equip <vũ_khí>` - Trang bị vũ khí',
            '• `lv hunt inventory` - Xem đồ săn bắn',
            '• `lv hunt use <bùa_phép>` - Dùng bùa phép'
          ].join('\n'),
          inline: false
        },
        { 
          name: '🎣 Lệnh Câu Cá (Fishing)', 
          value: [
            '• `lv fish` - Câu cá (5 phút)',
            '• `lv fish equip <cần_câu>` - Trang bị cần câu',
            '• `lv fish use <mồi_câu>` - Dùng mồi câu',
            '• `lv fish inventory` - Xem đồ câu cá'
          ].join('\n'),
          inline: false
        },
        { 
          name: '🛒 Lệnh Cửa Hàng (Shop)', 
          value: [
            '• `lv shop` - Xem tất cả cửa hàng',
            '• `lv shop seeds` - Cửa hàng hạt giống',
            '• `lv shop weapons` - Cửa hàng vũ khí',
            '• `lv shop fishing` - Cửa hàng đồ câu cá',
            '• `lv shop roles` - Cửa hàng role',
            '• `lv buy <item_id> [số lượng]` - Mua item',
            '• `lv sell <item_id> [số lượng]` - Bán item'
          ].join('\n'),
          inline: false
        },
        { 
          name: '🎮 Giải trí (Entertainment)', 
          value: [
            '• `lv blackjack <số tiền>` - Chơi Blackjack (x2, Blackjack x2.5)',
            '• `lv baucua <bầu|cua|tôm|cá|gà|nai> <số tiền>` - Chơi Bầu Cua',
            '• `lv xocdia <chẵn|lẻ> <số tiền>` - Chơi Xóc Đĩa (x1.95)'
          ].join('\n'),
          inline: false
        }
      )
      .setFooter({ text: '🔥 Bot Lửa Việt - Lửa vl luôn!' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

const store = getStore();

// lv cash
export const prefix: PrefixCommand = {
  name: 'cash',
  description: 'Check số dư người dùng',
  async execute(message) {
    const profile = store.getUser(message.author.id);
    await message.reply(`Số dư của ${message.author} là ${profile.balance} LVC.`);
  }
};

// lv info
export const prefixInfo: PrefixCommand = {
  name: 'info',
  description: 'Hiển thị thông tin server',
  async execute(message) {
    const g = message.guild!;
    const embed = new EmbedBuilder()
      .setTitle(`Thông tin server: ${g.name}`)
      .addFields(
        { name: 'ID', value: g.id, inline: true },
        { name: 'Thành viên', value: `${g.memberCount}`, inline: true }
      );
    await message.reply({ embeds: [embed] });
  }
};

// lv give <@user> <amount>
export const prefixGive: PrefixCommand = {
  name: 'give',
  description: 'Chuyển tiền cho người dùng khác',
  async execute(message, args) {
    const target = message.mentions.users.first();
    const amount = Number(args.filter((a) => !a.startsWith('<@')).at(-1));
    if (!target || !Number.isFinite(amount) || amount <= 0) {
      await message.reply('Cú pháp: lv give <@user> <số tiền>');
      return;
    }
    const from = store.getUser(message.author.id);
    if (from.balance < amount) {
      await message.reply('Không đủ số dư.');
      return;
    }
    from.balance -= amount;
    const to = store.getUser(target.id);
    to.balance += amount;
    store.save();
    await message.reply(`Đã chuyển ${amount} LVC cho ${target}.`);
  }
};

// lv bxh
export const prefixBxh: PrefixCommand = {
  name: 'bxh',
  description: 'Bảng xếp hạng giàu nhất',
  async execute(message) {
    const top = store.getTopBalances(10);
    const desc = top
      .map((u, i) => `${i + 1}. <@${u.userId}> — ${u.balance} LVC`)
      .join('\n');
    const embed = new EmbedBuilder().setTitle('BXH Giàu Nhất').setDescription(desc || 'Trống');
    await message.reply({ embeds: [embed] });
  }
};

// lv daily
export const prefixDaily: PrefixCommand = {
  name: 'daily',
  description: 'Điểm danh hằng ngày',
  async execute(message) {
    const res = store.claimDaily(message.author.id);
    await message.reply(res.message);
  }
};

// lv quest (daily 3 quest + refresh confirm -2000 LVC)
export const prefixQuest: PrefixCommand = {
  name: 'quest',
  description: 'Nhiệm vụ hằng ngày',
  async execute(message) {
    const quests = store.getDailyQuests(message.author.id);
    const rows = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`quest_refresh:${message.author.id}`).setLabel('Làm Mới').setStyle(ButtonStyle.Secondary)
    );
    const lines = quests.map((q, idx) => `Nhiệm vụ ${idx + 1}: ${q.desc} — Thưởng ${q.reward} LVC — ${q.done ? 'Hoàn thành' : 'Chưa'}`);
    await message.reply({ content: lines.join('\n') + '\nNhấn "Làm Mới" nếu nhiệm vụ quá khó (mất 2000 LVC).', components: [rows] });
  }
};

// Đăng ký thêm các lệnh prefix phụ trong file
export const prefixes: PrefixCommand[] = [prefixInfo, prefixGive, prefixBxh, prefixDaily, prefixQuest];


