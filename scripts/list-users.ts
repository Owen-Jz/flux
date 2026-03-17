import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://new_owen_user:0lLdhFMmLK582IDp@ac-8fpezwt-shard-00-00.zvxia6f.mongodb.net:27017,ac-8fpezwt-shard-00-01.zvxia6f.mongodb.net:27017,ac-8fpezwt-shard-00-02.zvxia6f.mongodb.net:27017/?ssl=true&replicaSet=atlas-3ud85q-shard-0&authSource=admin&retryWrites=true&w=majority';

async function listUsers() {
    await mongoose.connect(MONGODB_URI);
    const users = await mongoose.connection.db.collection('users').find({}).limit(10).toArray();
    console.log('\n=== Users in database ===');
    console.log('Total found:', users.length);
    users.forEach(u => {
        console.log(`- Name: ${u.name || 'No name'}`);
        console.log(`  Email: ${u.email}`);
        console.log(`  ID: ${u._id}`);
        console.log('');
    });
    await mongoose.disconnect();
}

listUsers().catch(console.error);
