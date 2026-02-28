const mongoose = require('mongoose');

const uri = "mongodb://new_owen_user:0lLdhFMmLK582IDp@ac-8fpezwt-shard-00-00.zvxia6f.mongodb.net:27017,ac-8fpezwt-shard-00-01.zvxia6f.mongodb.net:27017,ac-8fpezwt-shard-00-02.zvxia6f.mongodb.net:27017/?ssl=true&replicaSet=atlas-3ud85q-shard-0&authSource=admin&retryWrites=true&w=majority";

async function run() {
    try {
        // Fix for DNS in Windows
        require('dns').setServers(['8.8.8.8', '8.8.4.4']);

        const conn = await mongoose.connect(uri);
        // User is probably in "users" collection
        const users = await conn.connection.db.collection('users').find({}).toArray();
        console.log(JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
