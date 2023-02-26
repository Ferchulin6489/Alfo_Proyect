module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        let name = reader.readString();

        const [char] = await trx('character').select('id').where({deleted_at: null, character_name: name});
    
        if (!char) {
            writer.writeInt8(2); //El usuario no existe
        } else {

            const penalties = await trx({cp: 'character_penalty'}).select('cp.*', 'character.character_name as gm').leftJoin('character', 'character.id', 'cp.gm_id').where({character_id: char.id});
            
            writer.writeInt8(1); //Success
            
            writer.writeInt16(penalties.length);

            for (let penalty of penalties) {
                

                let str = '';

                if (penalty.type == 1) {
                    str = `[WARNING] [${penalty.gm}] - ${penalty.created_at}: ${penalty.description}`;
                } else if (penalty.type == 2) {
                    str = `[SILENCED] [${penalty.gm}] - ${penalty.created_at} (${penalty.silence_time}min): ${penalty.description}`;
                } else if (penalty.type == 3) {
                    str = `[JAIL] [${penalty.gm}] - ${penalty.created_at} (${penalty.jail_time}min): ${penalty.description}`;
                } else if (penalty.type == 4) {
                    str = `[BAN] [${penalty.gm}] - ${penalty.created_at} / ${penalty.unban_at ? penalty.unban_at : 'Indeterminado'}: ${penalty.description}`;
                }  else if (penalty.type == 5) {
                    str = `[UNBAN] [${penalty.gm}] - ${penalty.created_at}: ${penalty.description}`;
                }  else if (penalty.type == 6) {
                    str = `[RENAME] [${penalty.gm}] - ${penalty.created_at}: ${penalty.description}`;
                }

                writer.writeString(str);
            }


        }

        await trx.commit();
        
        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

        writer.sendError(socket);
    }
}