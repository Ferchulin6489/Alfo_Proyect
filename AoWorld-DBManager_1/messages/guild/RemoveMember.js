module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        const guild_id = reader.readInt32();
        const member_id = reader.readInt32();

        const [member] = await trx('guild-member').select('*').where({ member_id: member_id });
        if (!member) {
            writer.writeInt8(2); //No existe
            trx.commit();
            writer.send(socket);
            return;
        }

        // only can remove members if aren't the owner
        const [guild] = await trx('guild').select('*').where({ guild_id: guild_id });
        if (!guild) {
            writer.writeInt8(3); //No existe
            trx.commit();
            writer.send(socket);
            return;
        }

        if (guild.leader == member.name) {
            writer.writeInt8(4); //Es lider
            trx.commit();
            writer.send(socket);
            return;
        }


        await trx('guild-member').remove().where({ member_id: member_id });

        writer.writeInt8(1); // Exito
        await trx.commit();

        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

        writer.sendError(socket);
    }
}