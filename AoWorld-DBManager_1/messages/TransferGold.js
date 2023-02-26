module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        let id = reader.readInt32();
        let name = reader.readString();
        let amount = reader.readInt32();
        let npcIndex = reader.readInt16();

        const [acc1] = await trx('account').select('id', 'bank_gold').where({id: id});
        const [acc2] = await trx('character').select('account_id').where({deleted_at: null, character_name: name});
    
        if (!acc1 || !acc2) {
            writer.writeInt8(2); //El usuario no existe
        } else if (acc1.id == acc2.account_id) {
            writer.writeInt8(4); //Es la misma cuenta
        } else if (acc1.bank_gold < amount) {
            writer.writeInt8(3); //No tiene suficiente oro
        } else {

            await trx('account').update({bank_gold: knex.raw('bank_gold - ??', amount)}).where({id: acc1.id});
            await trx('account').update({bank_gold: knex.raw('bank_gold + ??', amount)}).where({id: acc2.account_id});

            writer.writeInt8(1); //Exitoso
            writer.writeString(name);
            writer.writeInt32(amount);
            writer.writeInt32(acc1.bank_gold - amount);
            writer.writeInt16(npcIndex);

        }

        await trx.commit();
        
        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

        writer.sendError(socket);
    }
}