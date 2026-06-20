import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('dmwithrole')
    .setDescription('Erlaubt einer bestimmten Rolle, Befehle in den DMs zu nutzen.')
    .addRoleOption(option => 
      option.setName('rolle')
        .setDescription('Die Rolle, die für DM-Befehle freigeschaltet werden soll')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Nur für Admins sichtbar

  async execute(interaction, guildConfig, client) {
    const role = interaction.options.getRole('rolle');
    const guildId = interaction.guild.id;

    // Wir nutzen deine bestehende Postgres-Datenbank
    const { pool } = await import('../../utils/database.js'); 

    // Tabelle erstellen, falls sie noch nicht existiert
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guild_dm_roles (
        guild_id TEXT PRIMARY KEY,
        role_id TEXT NOT NULL
      );
    `);

    // Rolle in der Datenbank speichern oder aktualisieren
    await pool.query(`
      INSERT INTO guild_dm_roles (guild_id, role_id) 
      VALUES ($1, $2) 
      ON CONFLICT (guild_id) 
      DO UPDATE SET role_id = $2;
    `, [guildId, role.id]);

    await interaction.reply({
      content: `Erfolgreich eingerichtet! Mitglieder mit der Rolle **${role.name}** dürfen ab jetzt Einstellungen in den DMs machen.`,
      ephemeral: true
    });
  }
};
