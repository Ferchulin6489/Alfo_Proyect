module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        const guild_id = reader.readInt32();
        const name = reader.readString();
        const details = reader.readString();
        
        const [request] = await trx('guild-request').select('id').where({ guild_id: guild_id, name: name });
        if (request) { 
            await trx('guild-request').where({ id: request.id }).update({ details: details });
            
            writer.writeInt8(1); //Solicitud actualizada
            writer.writeInt32(request.id);
            trx.commit();
            writer.send(socket);
            return;           
        }

        data = {
            guild_id: guild_id,
            request_at: knex.fn.now(),
            name: name,
            details: details
        }

        let [request_id] = await trx('guild-request').insert(data);
        if (!request_id) {
            writer.writeInt8(3); //Error
            trx.commit();
            writer.send(socket);
            return;
        }

        writer.writeInt8(1); //Solicitud enviada
        writer.writeInt32(request_id);
        await trx.commit();

        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

        writer.sendError(socket);
    }
}