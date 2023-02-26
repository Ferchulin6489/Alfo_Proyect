module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        const guild_id = reader.readInt32();

        const [guild] = await trx("guild").select('*').where({ guild_id: guild_id });
        if (!guild) {
            writer.writeInt8(2); //No existe
            trx.commit();
            writer.send(socket);
            return;
        }

        writer.writeInt8(1); // Exito

        writer.WriteInt32(guild.guild_id);
        writer.WriteString(guild.guild_at);
        writer.WriteString(guild.guild_name);

        writer.WriteString(guild.founder);
        writer.WriteString(guild.leader);
        writer.WriteInt16(guild.antifaction);
        writer.WriteString(guild.alignation);
        writer.WriteInt16(guild.members);

        writer.WriteString(guild.last_election_at);
        writer.WriteInt8(guild.open_election);
        writer.WriteString(guild.end_election_at);

        const last_election = new Date(guild.last_election_at);
        const today = new Date();
        const diffTime = Math.abs(today - last_election);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        writer.WriteInt16(diffDays); // days from last election

        writer.WriteInt16(guild.guild_level);
        writer.WriteInt16(guild.current_exp);
        writer.WriteInt16(guild.next_level_exp);

        writer.WriteString(guild.url);
        writer.WriteString(guild.guild_news);
        writer.WriteString(guild.desc);
        writer.WriteString(guild.codex);

        await trx.commit();
        
        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

    }
}