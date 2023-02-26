module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        const proposition_id = reader.readInt32();
        const accept = reader.readInt8();

        const [proposition] = await trx('guild-proposition').select('*').where({ proposition_id: proposition_id });
        if (!proposition) {
            writer.writeInt8(2); //No existe
            trx.commit();
            writer.send(socket);
            return;
        }

        if (proposition.pending == 0) {
            writer.writeInt8(3); //Ya fue respondida
            trx.commit();
            writer.send(socket);
            return;
        }

        if (accept == 1) {
            await trx('guild-proposition').update({ pending: 0 }).where({ proposition_id: proposition_id });

            await trx('guild-relation').insert({
                guild_id: proposition.guild_id,
                guild_to: proposition.guild_to,
                relation_type: proposition.relation_type,
                details: proposition.details
            });
            
            await trx('guild-relation').insert({
                guild_id: proposition.guild_to,
                guild_to: proposition.guild_id,
                relation_type: proposition.relation_type,
                details: proposition.details
            });
        } else if (accept == 0) {
            await trx('guild-proposition').update({ pending: 0 }).where({ proposition_id: proposition_id });
        }

        writer.writeInt8(1); //OK
        await trx.commit();
        
        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

        writer.sendError(socket);
    }
}