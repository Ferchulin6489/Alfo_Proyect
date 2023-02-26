module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        let gmId = reader.readInt32();
        let name = reader.readString();
        let newName = reader.readString();

        let data;
    
        const [char] = await trx('character').select('id').where({deleted_at: null, character_name: name});
        const [char2] = await trx('character').select('id').where({deleted_at: null, character_name: newName});
    
        if (!char) {
            writer.writeInt8(2); //El usuario no existe
        } else if (char2) {
            writer.writeInt8(3); //El nuevo nombre ya existe
        } else {
            //Agregamos una pena de que se cambio el name.
            data = {
                character_id: char.id,
                gm_id: gmId,
                description: `Se cambio el nombre de '${name}' a '${newName}'`,
                jail_time: 0,
                silence_time: 0,
                type: 6
            };
            
            await trx('character_penalty').insert(data)

            await trx('character').update({character_name: newName}).where({id: char.id});

            writer.writeInt8(1); //Exitoso
            writer.writeString(name);
            writer.writeString(newName);
        }

        await trx.commit();
        
        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

        writer.sendError(socket);
    }
}