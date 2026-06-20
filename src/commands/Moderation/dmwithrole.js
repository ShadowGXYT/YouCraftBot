import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('dmwithrole')
    .setDescription('Fügt eine Rolle hinzu, die Befehle in den DMs nutzen darf.')
    .addRoleOption(option => 
      option.setName('rolle')
        .setDescription('Die Rolle, die hinzugefügt werden soll')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, guildConfig, client) {
    const role = interaction.options.getRole('rolle');
    const guildId = interaction.guild.id;

    const { pool } = await import('../../utils/database.js'); 

    // Tabelle erstellen (Verwendet ein TEXT-Array für mehrere Rollen)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guild_dm_roles (
        guild_id TEXT PRIMARY KEY,
        role_ids TEXT[] NOT NULL
      );
    `);

    // Rolle zum Array hinzufügen (verhindert Duplikate durch array_append + distinct)
    await pool.query(`
      INSERT INTO guild_dm_roles (guild_id, role_ids) 
      VALUES ($1, ARRAY[$2]) 
      ON CONFLICT (guild_id) 
      DO UPDATE SET role_ids = ARRAY(SELECT DISTINCT x FROM unnest(array_append(guild_dm_roles.role_ids, $2)) AS x);
    `, [guildId, role.id]);

    await interaction.reply({
      content: `Erfolgreich hinzugefügt! Mitglieder mit der Rolle **${role.name}** dürfen nun DM-Befehle nutzen.`,
      ephemeral: true
    });
  }
};
