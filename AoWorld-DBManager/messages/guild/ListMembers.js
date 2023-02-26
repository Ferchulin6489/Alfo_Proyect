module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        const guild_id = reader.readInt32();

        const [members] = await trx('guild-member').select('*').where({ guild_id: guild_id });
        if (!members) {
            writer.writeInt8(2); //No existe
            trx.commit();
            writer.send(socket);
            return;
        }

        writer.writeInt8(1); //Existe
        writer.writeInt16(members.length);
        
        for (let member of members) {
            writer.writeInt32(member.member_id);
            writer.writeString(member.member_at);
            writer.writeString(member.name);
        }

        await trx.commit();

        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

        writer.sendError(socket);
    }
}