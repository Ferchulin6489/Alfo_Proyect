module.exports = async (reader, writer, knex, socket) => {
    let trx;

    try {
        trx = await knex.transaction();

        let email = reader.readString();
        let password = reader.readString();
        let ip = reader.readString();

        if (password.length != 32) {
            writer.writeInt8(2);
            trx.commit();
            writer.send(socket);
            return;
        }

        const [account] = await trx('account').select().where({email: email, password: password});
    
        if (!account) { //No existe...
            writer.writeInt8(2);
            trx.commit();
            writer.send(socket);
            return;
        }

        const chars = await trx('character').select('id', 'character_name', 'head_id', 'class_id', 'wear_id', 'pos_map', 'pos_x', 'pos_y', 'level', 'faction', 'helmet_id', 'shield_id', 'weapon_id', 'guild_id', 'min_hp', 'is_sailing').where({deleted_at: null, account_id: account.id});
    
        if (chars.length > 10) {
            writer.writeInt8(3);
            trx.commit();
            writer.send(socket);
            return;
        }

        //Actualizamos el last login y las ip de la cuenta
        await trx('account').update(
            {
                last_login_at: knex.fn.now(),
                previous_ip: knex.ref('last_ip'),
                last_ip: ip
            }
        ).where({id: account.id});

        //Registramos el accesso en el log
        await trx('login_log').insert(
            {
                account_id: account.id,
                ip: ip
            }
        );


        writer.writeInt8(1);
        writer.writeInt32(account.id);
        writer.writeInt8(chars.length);

        for (let char of chars) {
            if (char.is_sailing || char.min_hp == 0) {
                char.head_id = 0;
            }
            writer.writeString(char.character_name);
            writer.writeInt16(char.head_id);
            writer.writeInt16(char.class_id);
            writer.writeInt16(char.wear_id);
            writer.writeInt16(char.pos_map);
            writer.writeInt16(char.pos_x);
            writer.writeInt16(char.pos_y);
            writer.writeInt16(char.level);
            writer.writeInt16(char.faction);
            writer.writeInt16(char.helmet_id);
            writer.writeInt16(char.shield_id);
            writer.writeInt16(char.weapon_id);
            writer.writeInt16(char.guild_id);
        }

        trx.commit();

        writer.send(socket);
    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

        writer.sendError(socket);
    }
}