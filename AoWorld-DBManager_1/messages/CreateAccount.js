module.exports = async (reader, writer, knex, socket) => {
    let trx;
    try {
        trx = await knex.transaction();

        let email = reader.readString();
        let password = reader.readString();
        let firstName = reader.readString();
        let lastName = reader.readString();
        let ip = reader.readString();

        let data;
        let insertId;


        const [acc] = await trx('account').select('id').where({email: email});
        if (acc) { //Ya existe
            writer.writeInt8(2); 
            trx.commit();
            writer.send(socket);
            return;
        }

        let validationCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        data = {
            email: email,
            password: password,
            first_name: firstName,
            last_name: lastName,
            validated: 1,
            validation_code: validationCode,
            last_ip: ip,
            previous_ip: ip,
            is_banned: 0,
            last_login_at: knex.fn.now(),
            bank_gold: 0
        };

        [insertId] = await trx('account').insert(data);
        
        writer.writeInt8(1); //Cuenta creada
        writer.writeString(email);
        writer.writeInt32(insertId);

        await trx.commit();
        
        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

        writer.sendError(socket);
    }
}