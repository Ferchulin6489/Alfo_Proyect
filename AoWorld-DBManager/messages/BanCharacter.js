module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        let gmId = reader.readInt32();
        let name = reader.readString();
        let reason = reader.readString();

        let data;
        let insertId;

    
        const [char] = await trx('character').select('id', 'banned_penalty_id').where({deleted_at: null, character_name: name});
    
        if (!char) {
            writer.writeInt8(2); //El usuario no existe
        } else if (char.banned_penalty_id != null) {
            writer.writeInt8(3); //El usuario ya esta baneado
        } else {
            //Baneamos.
            data = {
                character_id: char.id,
                gm_id: gmId,
                description: reason,
                jail_time: 0,
                silence_time: 0,
                type: 4
            };

            [insertId] = await trx('character_penalty').insert(data);

            await trx('character').update({banned_penalty_id: insertId}).where({id: char.id});

            writer.writeInt8(1); //Usuario baneado
            writer.writeString(name);
            writer.writeString(reason);
        }

        await trx.commit();
        
        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

        writer.sendError(socket);
    }
}