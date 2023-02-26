module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        const guild_id = reader.readInt32();

        const relations = await trx("guild-relation").select('*').where({ guild_id: guild_id }).orWhere({ guild_to: guild_id });

        writer.writeInt16(relations.length);

        for (let relation of relations) {
            writer.writeInt32(relation.relation_id);
            writer.writeInt32(relation.guild_id);
            writer.writeInt32(relation.guild_to);
            writer.writeInt8(relation.relation_type);
        }

        await trx.commit();
        
        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

        writer.sendError(socket);
    }
}