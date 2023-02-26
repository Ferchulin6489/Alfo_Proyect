module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();
        
        let guild_name = reader.readString();
        let founder = reader.readString();
        let antifaction = reader.readInt16();
        let alignation = reader.readString();
        let desc = reader.readString();

        const [char] = await trx('character').select().where({deleted_at: null, character_name: founder});
        if (!char) {
            writer.writeInt8(2); //No existe el personaje
            trx.commit();
            writer.send(socket);
            return;
        }

        if (char.guild_id != 0) {
            writer.writeInt8(3); //Ya pertenece a una guild
            trx.commit();
            writer.send(socket);
            return;
        }
      
        const [guild] = await trx('guild').select('id').whereRaw(`LOWER(guild_name) LIKE ?;`, [`%${guild_name}%`]);
        if (guild) { 
            writer.writeInt8(4); //Ya existe una guild con ese nombre
            trx.commit();
            writer.send(socket);
            return;
        }
      
        data = {
            guild_name: guild_name,
            guild_at: knex.fn.now(),
            founder: founder,
            leader: founder,
            antifaction: antifaction,
            alignation: alignation,
            last_election_at: knex.fn.now(),
            open_election: 0,
            members: 1,
            desc: desc
        }
      
        let [guild_id] = await trx('guild').insert(data);
        if (!guild_id) { 
            writer.writeInt8(5); //Error al crear la guild
            trx.commit();
            writer.send(socket);
            return;
        }
        
        member = {
            guild_id: guild_id,
            member_at: knex.fn.now(),
            name: founder
        }
        
        const [member_id] = await trx('guild-member').insert(member);

        await trx('character').where({ character_id: char.character_id }).update({ guild_id: request.guild_id });
      
        writer.writeInt8(1); //Guild creada con exito
        writer.writeInt16(guild_id);
        await trx.commit();
        
        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

    }
}