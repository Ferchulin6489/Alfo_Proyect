module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        const guild_id = reader.readInt32();
        const action = reader.readString();

        let [guild] = await trx("guild").select('*').where({ guild_id: guild_id });
        if (!guild) {
            writer.writeInt8(2); //No existe
            trx.commit();
            writer.send(socket);
            return;
        }

        let changed = false;

        if (action == 'desc') {
            guild.desc = reader.readString();
            changed = true;
        } else if (action == 'codex') {
            guild.codex = reader.readString();
            changed = true;
        // } else if (action == 'elections') {
        //     guild.last_election_at = reader.readString();
        //     guild.open_election = reader.readInt8();
        //     guild.end_election_at = reader.readString();
        //     changed = true;
        } else if (action == 'news') {
            guild.guild_news = reader.readString();
            changed = true;
        } else if (action == 'url') {
            guild.url = reader.readString();
            changed = true;
        } else if (action == 'leader') {
            let newLeader = reader.readString();
            const [member] = await trx('guild-member').select('*').where({ guild_id: guild_id, name: newLeader });
            if (!member) {
                writer.writeInt8(2); //No existe
                trx.commit();
                writer.send(socket);
                return;
            }

            guild.leader = newLeader;
            changed = true;
        } else if (action == 'antifaction') {
            guild.antifaction = reader.readInt16();
            changed = true;
        } else if (action == 'alignation') {
            guild.alignation = reader.readString();
            changed = true;
        } else if (action == 'actual_exp') {
            guild.current_exp = reader.readInt16();
            changed = true;
        } else if (action == 'next_level_exp') {
            guild.next_level_exp = reader.readInt16();
            changed = true;
        } else if (action == 'level') {
            guild.guild_level = reader.readInt16();
            changed = true;
        }

        if (!changed) {
            writer.writeInt8(2); //No hubo cambios
            trx.commit();
            writer.send(socket);
            return;
        }

        await trx("guild").update(guild).where({ guild_id: guild_id });

        writer.writeInt8(1); // Exito
        await trx.commit();
        
        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

    }
}