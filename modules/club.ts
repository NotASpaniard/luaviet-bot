import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { PrefixCommand, SlashCommand } from '../types/command.js';
import { getStore } from '../store/store.js';

// /clubowner <@user> <tên club> <role>
export const slash: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('clubowner')
    .setDescription('Gán chủ sở hữu club')
    .addUserOption((o) => o.setName('user').setDescription('Người dùng').setRequired(true))
    .addStringOption((o) => o.setName('name').setDescription('Tên club').setRequired(true))
    .addStringOption((o) => o.setName('role').setDescription('ID role').setRequired(true)),
  async execute(interaction) {
    // Role kiểm soát: chỉ role id 1409811217048141896 được phép
    const allowRoleId = '1409811217048141896';
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    if (!member.roles.cache.has(allowRoleId)) {
      await interaction.reply({ content: 'Bạn không có quyền dùng lệnh này.', ephemeral: true });
      return;
    }
    const user = interaction.options.getUser('user', true);
    const name = interaction.options.getString('name', true);
    const roleId = interaction.options.getString('role', true);
    const store = getStore();
    store.setClubOwner(name, user.id, roleId);
    store.save();
    await interaction.reply({ content: `Đã đặt ${user} làm chủ club '${name}' (role ${roleId}).`, ephemeral: true });
  }
};

// lv club <subcommand>
export const prefixClub: PrefixCommand = {
  name: 'club',
  description: 'Quản lý club: create/add/remove/list/inv/daily/bxh/quest/info/donate',
  async execute(message, args) {
    const sub = (args[0] || '').toLowerCase();
    const store = getStore();
    const myClub = store.getUserClub(message.author.id);
    
    if (sub === 'create') {
      // Kiểm tra user chưa thuộc club nào
      if (myClub) {
        await message.reply('Bạn đã thuộc một club rồi. Chỉ có thể tạo club mới khi rời club hiện tại.');
        return;
      }
      
      const clubName = args.slice(1).join(' ').trim();
      if (!clubName) {
        await message.reply('Cú pháp: lv club create <tên club>');
        return;
      }
      
      // Tạo club mới với user làm chủ
      const newClub = store.ensureClub(clubName);
      newClub.ownerId = message.author.id;
      newClub.members = [message.author.id];
      store.save();
      
      await message.reply(`Đã tạo club '${clubName}' thành công! Bạn là chủ club.`);
      return;
    }
    
    if (sub === 'add') {
      if (!myClub || myClub.ownerId !== message.author.id) { 
        await message.reply('Chỉ chủ club mới dùng được.'); 
        return; 
      }
      
      const target = message.mentions.users.first();
      if (!target) { 
        await message.reply('Cú pháp: lv club add <@user>'); 
        return; 
      }
      
      // Kiểm tra target chưa thuộc club nào
      const targetClub = store.getUserClub(target.id);
      if (targetClub) {
        await message.reply(`${target} đã thuộc club khác rồi.`);
        return;
      }
      
      // Kiểm tra slot còn trống
      const buffs = store.getCampfireBuffs(myClub.campfire.level);
      if (myClub.members.length >= buffs.memberSlots) {
        await message.reply(`Club đã đầy! Tối đa ${buffs.memberSlots} thành viên (Level ${myClub.campfire.level}).`);
        return;
      }
      
      store.addClubMember(myClub.name, target.id);
      store.save();
      await message.reply(`Đã thêm ${target} vào club ${myClub.name}.`);
      return;
    }
    
    if (sub === 'remove') {
      if (!myClub || myClub.ownerId !== message.author.id) { 
        await message.reply('Chỉ chủ club mới dùng được.'); 
        return; 
      }
      const target = message.mentions.users.first();
      if (!target) { 
        await message.reply('Cú pháp: lv club remove <@user>'); 
        return; 
      }
      store.removeClubMember(myClub.name, target.id);
      store.save();
      await message.reply(`Đã xóa ${target} khỏi club ${myClub.name}.`);
      return;
    }
    
    if (sub === 'list') {
      if (!myClub) { 
        await message.reply('Bạn chưa thuộc club nào.'); 
        return; 
      }
      const lines = myClub.members.map((m) => `<@${m}>`).join(', ');
      await message.reply(`Thành viên club ${myClub.name}: ${lines || 'Trống'}`);
      return;
    }
    
    if (sub === 'inv') {
      if (!myClub) { 
        await message.reply('Bạn chưa thuộc club nào.'); 
        return; 
      }
      const lines = Object.entries(myClub.inventory).map(([k, v]) => `${k}: ${v}`).join('\n');
      await message.reply(lines || 'Kho club trống.');
      return;
    }
    
    if (sub === 'daily') {
      if (!myClub) { 
        await message.reply('Bạn chưa thuộc club nào.'); 
        return; 
      }
      const res = store.markClubDaily(myClub.name, message.author.id);
      // Nếu tất cả các thành viên đã điểm danh: thưởng 300 LVC cho tất cả
      if (res.completedAll) {
        for (const uid of myClub.members) {
          store.getUser(uid).balance += 300;
        }
        store.save();
        await message.reply(`Toàn bộ thành viên đã điểm danh! Mỗi người nhận 300 LVC.`);
      } else {
        await message.reply(res.message);
      }
      return;
    }
    
    if (sub === 'bxh') {
      // BXH: theo level campfire → tổng quỹ → số thành viên
      const clubs = Object.values((getStore() as any)['db'].clubs) as any[];
      const score = clubs.map((c) => ({
        name: c.name,
        level: c.campfire.level,
        funds: c.campfire.funds,
        members: c.members.length
      }));
      score.sort((a, b) => b.level - a.level || b.funds - a.funds || b.members - a.members);
      const lines = score.slice(0, 10).map((c, i) => 
        `${i + 1}. ${c.name} — Level ${c.level} — Quỹ: ${c.funds.toLocaleString()} LVC — ${c.members} thành viên`
      );
      await message.reply(lines.join('\n') || 'Chưa có club nào.');
      return;
    }
    
    if (sub === 'quest') {
      if (!myClub) { 
        await message.reply('Bạn chưa thuộc club nào.'); 
        return; 
      }
      const quests = store.getClubQuests(myClub.name);
      const lines = quests.map((q, i) => `Nhiệm vụ ${i + 1}: ${q.desc} — Thưởng ${q.reward} LVC — ${q.done ? 'Hoàn thành' : 'Chưa'}`);
      await message.reply(lines.join('\n'));
      return;
    }
    
    if (sub === 'info') {
      if (!myClub) { 
        await message.reply('Bạn chưa thuộc club nào.'); 
        return; 
      }
      
      const buffs = store.getCampfireBuffs(myClub.campfire.level);
      const nextLevelCost = store.getCampfireUpgradeCost(myClub.campfire.level + 1);
      const progress = myClub.campfire.funds;
      const progressPercent = nextLevelCost > 0 ? Math.round((progress / nextLevelCost) * 100) : 100;
      
      const embed = new EmbedBuilder()
        .setTitle(`🏠 Club: ${myClub.name}`)
        .setColor('#FF8C00')
        .addFields(
          { name: '👑 Chủ Club', value: `<@${myClub.ownerId}>`, inline: true },
          { name: '🔥 Campfire Level', value: `${myClub.campfire.level}/5`, inline: true },
          { name: '👥 Thành viên', value: `${myClub.members.length}/${buffs.memberSlots}`, inline: true },
          { name: '💰 Quỹ hiện tại', value: `${myClub.campfire.funds.toLocaleString()} LVC`, inline: true },
          { name: '📈 Tiến độ nâng cấp', value: `${progressPercent}% (${progress.toLocaleString()}/${nextLevelCost.toLocaleString()})`, inline: true },
          { name: '🎯 Buff hiện tại', value: [
            `• Thu nhập: +${buffs.incomeBonus}%`,
            `• Cooldown: -${buffs.cooldownReduction}%`,
            `• XP: +${buffs.xpBonus}%`
          ].join('\n'), inline: false }
        )
        .setTimestamp();
      
      await message.reply({ embeds: [embed] });
      return;
    }
    
    if (sub === 'donate') {
      if (!myClub) { 
        await message.reply('Bạn chưa thuộc club nào.'); 
        return; 
      }
      
      const amount = Number(args[1]);
      if (!Number.isFinite(amount) || amount <= 0) {
        await message.reply('Cú pháp: lv club donate <số tiền>');
        return;
      }
      
      const result = store.contributeToClub(myClub.name, message.author.id, amount);
      if (!result.success) {
        await message.reply(result.message);
        return;
      }
      
      let reply = result.message;
      if (result.upgraded) {
        const newLevel = myClub.campfire.level;
        const newBuffs = store.getCampfireBuffs(newLevel);
        reply += `\n\n🎉 **CLUB ĐÃ NÂNG CẤP LÊN LEVEL ${newLevel}!** 🎉\n`;
        reply += `• Slot thành viên: ${newBuffs.memberSlots}\n`;
        reply += `• Buff thu nhập: +${newBuffs.incomeBonus}%\n`;
        reply += `• Buff cooldown: -${newBuffs.cooldownReduction}%\n`;
        reply += `• Buff XP: +${newBuffs.xpBonus}%`;
      }
      
      await message.reply(reply);
      return;
    }
    
    await message.reply('Các lệnh: lv club create/add/remove/list/inv/daily/bxh/quest/info/donate');
  }
};

export const prefixes: PrefixCommand[] = [prefixClub];
