module.exports = async (reader, writer, knex, socket) => {
    let trx;

    try {

        trx = await knex.transaction();
        
        let accountId = reader.readInt32();
        let characterId = reader.readInt32();
        let loginId = reader.readInt32();
        let logout = reader.readInt8();
        let ip = reader.readString();
        let name = reader.readString();

        if (logout == 2) { //Es un new user..
            const [char] = await trx('character').select('id').where({deleted_at: null, character_name: name});
            if (char) { //Ya existe
                writer.writeInt8(3); 
                trx.commit();
                writer.send(socket);
                return;
            }

            const [count] = await trx('character').count('id', {as: 'count'}).where({deleted_at: null, account_id: accountId});
            if (count.count >= 10) { //Ya llego al limite
                writer.writeInt8(4); 
                trx.commit();
                writer.send(socket);
                return;
            }
        }


        let data = {
            level: reader.readInt8(), 
            exp: reader.readInt32(), 
            genre_id: reader.readInt8(), 
            race_id: reader.readInt8(), 
            class_id: reader.readInt8(), 
            city_id: reader.readInt8(),
            description: reader.readString(),
            gold: reader.readInt32(), 
            free_skillpoints: reader.readInt16(), 
            pos_map: reader.readInt16(), 
            pos_x: reader.readInt16(), 
            pos_y: reader.readInt16(), 
            body_id: reader.readInt16(), 
            head_id: reader.readInt16(), 
            wear_id: reader.readInt16(), 
            weapon_id: reader.readInt16(), 
            helmet_id: reader.readInt16(), 
            shield_id: reader.readInt16(), 
            ship_object_id: reader.readInt16(), 
            heading: reader.readInt8(), 
            min_hp: reader.readInt16(), 
            max_hp: reader.readInt16(), 
            min_man: reader.readInt16(), 
            max_man: reader.readInt16(), 
            min_sta: reader.readInt16(), 
            max_sta: reader.readInt16(), 
            min_hunger: reader.readInt16(), 
            max_hunger: reader.readInt16(), 
            min_thirst: reader.readInt16(), 
            max_thirst: reader.readInt16(), 
            min_hit: reader.readInt16(), 
            max_hit: reader.readInt16(), 
            invent_level: reader.readInt8(), 
            vault_level: reader.readInt8(), 
            guild_id: reader.ZeroNull(reader.readInt16()),
            return_map: reader.readInt16(), 
            return_x: reader.readInt16(), 
            return_y: reader.readInt16(), 
            faction: reader.readInt8(), 
            faction_reward: reader.readInt8(), 
            faction_entry_users: reader.readInt32(), 
            killed_npcs: reader.readInt32(), 
            killed_users: reader.readInt32(), 
            killed_citizens: reader.readInt32(), 
            killed_criminals: reader.readInt32(), 
            deaths_npcs: reader.readInt32(), 
            deaths_users: reader.readInt32(), 
            deaths: reader.readInt32(), 
            steps: reader.readInt32(), 
            is_poisoned: reader.readInt8(), 
            is_incinerated: reader.readInt8(), 
            is_sailing: reader.readInt8(), 
            is_paralyzed: reader.readInt8(), 
            is_silenced: reader.readInt8(), 
            is_mounted: reader.readInt8(), 
            chat_global: reader.readInt8(), 
            chat_combate: reader.readInt8(), 
            fishing_points: reader.readInt32(), 
            elo: reader.readInt32(), 
            time_played: reader.readInt32(),
            jail_time: reader.readInt16(),
            silence_time: reader.readInt16()
        }

        if (logout == 1) {
            data.last_logout_at = knex.fn.now();
            data.is_logged = 0;
        }
        
        if (logout == 2) {
            data.account_id = accountId;
            data.character_name = name;
            data.last_ip = ip;
            data.previous_ip = ip;
            data.is_logged = 1;
            data.is_published = 0;
            data.is_locked = 0;
            [characterId] = await trx('character').insert(data);
        } else {
            await trx('character').update(data).where({ id: characterId, account_id: accountId });
        }


        let tmpLength = 0;


        let spells = [];
    
        tmpLength = reader.readInt8();
        for (let i = 1; i <= tmpLength; i++) {
            spells.push({
                character_id: characterId,
                position: reader.readInt8(),
                spell_id: reader.readInt8()
            })
        }

        

        let invent = [];

        tmpLength = reader.readInt8();
        for (let i = 1; i <= tmpLength; i++) {
            invent.push({
                character_id: characterId,
                position: i,
                object_id: reader.readInt16(),
                amount: reader.readInt16(),
                equipped: reader.readInt8(),
            })
        }



        let vault = [];
            
        tmpLength = reader.readInt8();
        for (let i = 1; i <= tmpLength; i++) {
            vault.push({
                character_id: characterId,
                position: i,
                object_id: reader.readInt16(),
                amount: reader.readInt16()
            })
        }


        let skills = [];

        tmpLength = reader.readInt8();
        for (let i = 1; i <= tmpLength; i++) {
            skills.push({
                character_id: characterId,
                skill_id: i,
                value: reader.readInt8(),
                assigned: reader.readInt8()
            })
        }


        let quests = [];

        //Abiertas
        tmpLength = reader.readInt8();
        for (let i = 1; i <= tmpLength; i++) {
            quests.push({
                character_id: characterId,
                quest_id: reader.readInt16(),
                completed: 0,
                data: reader.readString()
            })
        }

        //Completadas
        tmpLength = reader.readInt16();
        for (let i = 1; i <= tmpLength; i++) {
            quests.push({
                character_id: characterId,
                quest_id: reader.readInt16(),
                completed: 1,
                data: null
            })
        }

        if (spells.length > 0) await trx('character_spell').insert(spells).onConflict('character_id', 'spell_id', 'position').merge();
        await trx('character_inventory').insert(invent).onConflict('character_id', 'position').merge();
        await trx('character_vault').insert(vault).onConflict('character_id', 'position').merge();
        await trx('character_skill').insert(skills).onConflict('character_id', 'skill_id').merge();
        if (logout == 1) {
            await trx('login_log').update({ended_at: knex.fn.now()}).where({ id: loginId });
        }
        if (quests.length > 0) await trx('character_quest').insert(quests).onConflict('character_id', 'quest_id').merge();

        await trx.commit();

            
        //CHARACTER
        writer.writeInt8(logout); 
        writer.writeInt32(characterId); 
        writer.writeInt32(accountId); 
        
    
        writer.send(socket);

    } catch (ex) {
        console.log(ex);
        if (trx) trx.rollback();

        writer.sendError(socket);
    }
}