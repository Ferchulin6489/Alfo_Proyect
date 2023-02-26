module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        let name = reader.readString();
        let faction = reader.readInt8();

        
        const [char] = await trx('character').select('id', 'faction').where({deleted_at: null, character_name: name});

        if (!char) {
            writer.writeInt8(2); //El usuario no existe
        } else if (!(char.faction == faction || (char.faction == 2 && faction == 6) || (char.faction == 3 && faction == 6))) {
            writer.writeInt8(3); //No pertenece a la faccion
        } else {
            if (faction == 2) {
                faction = 0; //Si era caos ahora es crimi
            } else if (faction == 3) {
                faction = 1; //Si era armada ahora es ciuda
            } else if (char.faction == 4 && faction == 6) {
                faction = 2; //Si era concilo ahora es caos
            } else if (char.faction == 5 && faction == 6) {
                faction = 3; //Si era consejo ahora es armada
            }

            await trx('character').update({faction: faction}).where({id: char.id});

            writer.writeInt8(1); //Success
        }


        await trx.commit();

        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();
        writer.sendError(socket);
    }
}