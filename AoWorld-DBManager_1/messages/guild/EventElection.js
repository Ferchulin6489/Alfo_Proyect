module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        const guild_id = reader.readInt32();
        const open = reader.readInt8();

        const [guild] = await trx('guild').select('*').where({ guild_id: guild_id });
        if (!guild) {
            writer.writeInt8(2); //No existe
            trx.commit();
            writer.send(socket);
            return;
        }

        if (guild.open_election == open) {
            writer.writeInt8(1); //Ya esta en ese estado
            trx.commit();
            writer.send(socket);
            return;
        }

        if (open == 1) {
            await trc('guild-vote').remove().where({ guild_id: guild_id }); // remove all votes

            await trx('guild').update({ 
                open_election: 1, 
                end_election_at: knex.fn.now().addHours(24),
                last_election_at: knex.fn.now(),
            }).where({ guild_id: guild_id });
        } else {
            await trc('guild-vote').remove().where({ guild_id: guild_id }); // remove all votes

            await trx('guild').update({ 
                open_election: 0,
                end_election_at: '',
            }).where({ guild_id: guild_id });
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