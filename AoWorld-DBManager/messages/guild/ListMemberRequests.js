module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        const guild_id = reader.readInt32();

        const members = await trx("guild-request").select('*').where({ guild_id: guild_id });

        writer.writeInt16(members.length);
        
        for (let member of members) {
            writer.writeInt32(member.request_id);
            writer.writeString(member.request_at);
            writer.writeString(member.name);
            writer.writeString(member.details);
        }

        await trx.commit();
        
        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

        writer.sendError(socket);
    }
}