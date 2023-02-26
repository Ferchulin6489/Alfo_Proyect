module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        const request_id = reader.readInt32();
        const event = reader.readString();

        const [request] = await trx('guild-request').select('*').where({ request_id: request_id });
        if (!request) {
            writer.writeInt8(2); //No existe
            trx.commit();
            writer.send(socket);
            return;
        }

        if (event == 'accept') {

            const [guild] = await trx('guild').select('*').where({ guild_id: request.guild_id });
            if (!guild) {
                writer.writeInt8(3); //No existe
                trx.commit();
                writer.send(socket);
                return;
            }

            data = {
                guild_id: request.guild_id,
                member_at: knex.fn.now(),
                name: request.name,
            }

            const [member_id] = await trx('guild-member').insert(data);
            if (!member_id) {
                writer.writeInt8(3); //Error
                trx.commit();
                writer.send(socket);
                return;
            }

            await trx('guild').where({ guild_id: request.guild_id }).update({ members: guild.members + 1 });

            await trx('guild-request').remove().where({ name: request.name }); // Borramos todas las solicitudes del usuario

            const [char] = await trx('character').select().where({deleted_at: null, character_name: request.name});
            if (char) {
                await trx('character').where({ character_id: char.character_id }).update({ guild_id: request.guild_id });
            }

        } else if (event == 'reject') {

            await trx('guild-request').remove().where({ request_id: request_id });

        }

        writer.writeInt8(1); // Exito
        await trx.commit();
        
        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

        writer.sendError(socket);
    }
}