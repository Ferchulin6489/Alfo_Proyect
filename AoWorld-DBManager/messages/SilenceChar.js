module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        let gmId = reader.readInt32();
        let name = reader.readString();
        let time = reader.readInt16();

        let data;
    
        const [char] = await trx('character').select('id').where({deleted_at: null, character_name: name});
    
        if (char) {
            //Silenciamos
            if (time > 0) {
                data = {
                    character_id: char.id,
                    gm_id: gmId,
                    description: 'Silenced for ' + time,
                    jail_time: 0,
                    silence_time: time,
                    type: 2
                };
                
                await trx('character_penalty').insert(data);

            }

            await trx('character').update(
                {
                    is_silenced: time > 0 ? 1 : 0,
                    silence_time: time
                }
            ).where({id: char.id});
        }

        await trx.commit();

    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();
    }
}