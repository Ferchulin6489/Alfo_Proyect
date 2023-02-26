module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        const guild_id = reader.readInt32();

        const propositions = await trx("guild-proposition").select('*').where({ guild_to: guild_id, pending: 1 });

        writer.writeInt16(propositions.length);

        for (let proposition of propositions) {
            writer.writeInt32(proposition.proposition_id);
            writer.writeString(proposition.proposition_at);
            writer.writeInt32(proposition.guild_id);
            writer.writeInt32(proposition.guild_to);
            writer.writeInt8(proposition.relation_type);
            writer.writeString(proposition.details);
        }

        await trx.commit();
        
        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

        writer.sendError(socket);
    }
}