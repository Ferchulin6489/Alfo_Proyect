module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        let gmId = reader.readInt32();
        let name = reader.readString();
        let reason = reader.readString();
        let type = reader.readInt8();
        let time = reader.readInt16();
        

        let data;
    
        const [char] = await trx('character').select('id').where({deleted_at: null, character_name: name});
    
        if (char) {

            data = {
                character_id: char.id,
                gm_id: gmId,
                description: reason,
                jail_time: time,
                silence_time: 0,
                type: type
            };

            await trx('character_penalty').insert(data)

            //Si tiene tiempo de carcel..
            if (time > 0) {
                await trx('character').update(
                    {
                        jail_time: time,
                        pos_map: 1,
                        pos_x: 350,
                        pos_y: 276
                    }
                ).where({id: char.id});
            }
        }

        await trx.commit();

    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

    }
}