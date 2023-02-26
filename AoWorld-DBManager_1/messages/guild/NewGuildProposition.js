module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        const guild_id = reader.readInt32();
        const guild_to = reader.readInt32();
        const relation_type = reader.readInt8();
        const details = reader.readString();

        if (guild_id == guild_to) {
            writer.writeInt8(2); //No se puede enviar una solicitud a la misma guild
            trx.commit();
            writer.send(socket);
            return;
        }

        const [guild] = await trx('guild').select().where({id: guild_id});
        if (!guild) {
            writer.writeInt8(3); //No existe la guild
            trx.commit();
            writer.send(socket);
            return;
        }

        const [guild2] = await trx('guild').select().where({id: guild_to});
        if (!guild2) {
            writer.writeInt8(4); //No existe la guild
            trx.commit();
            writer.send(socket);
            return;
        }

        const [relation] = await trx('guild-relation').select().where({guild_id: guild_id, guild_to: guild_to});
        if (relation) {
            writer.writeInt8(5); //Ya existe una relacion
            trx.commit();
            writer.send(socket);
            return;
        }

        const [relation2] = await trx('guild-relation').select().where({guild_id: guild_to, guild_to: guild_id});
        if (relation2) {
            writer.writeInt8(6); //Ya existe una relacion
            trx.commit();
            writer.send(socket);
            return;
        }

        const [proposition] = await trx('guild-proposition').select().where({guild_id: guild_id, guild_to: guild_to, pending: 1});
        if (proposition) {
            writer.writeInt8(7); //Ya existe una propuesta pendiente
            trx.commit();
            writer.send(socket);
            return;
        }

        data = {
            guild_id: guild_id,
            guild_to: guild_to,
            relation_type: relation_type,
            details: details,
            pending: 1,
            relation_at: knex.fn.now()
        }

        let [relation_id] = await trx('guild-proposition').insert(data);
        if (!relation_id) {
            writer.writeInt8(8); //Error al crear la propuesta
            trx.commit();
            writer.send(socket);
            return;
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