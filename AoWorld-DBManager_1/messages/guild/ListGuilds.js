module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();
        
        const guilds = await trx("guild").select('*');

        writer.writeInt16(guilds.length);
        
        for (let guild of guilds) {
            writer.writeInt32(guild.guild_id);
            writer.writeString(guild.guild_at);
            writer.writeString(guild.guild_name);
            writer.writeInt8(guild.guild_level);
            writer.writeString(guild.founder);
            writer.writeString(guild.leader);
            writer.writeInt16(guild.antifaction);
            writer.writeString(guild.alignation);
            writer.writeInt16(guild.members);
            writer.writeString(guild.url);
            writer.writeString(guild.desc);
            writer.writeString(guild.codex);
        }
        
        await trx.commit();
        
        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

        writer.sendError(socket);
    }
}