import mongoose from 'mongoose';
import { Admin, AdminRole } from '../models/Admin';

const MONGODB_URI = 'mongodb://new_owen_user:0lLdhFMmLK582IDp@ac-8fpezwt-shard-00-00.zvxia6f.mongodb.net:27017,ac-8fpezwt-shard-00-01.zvxia6f.mongodb.net:27017,ac-8fpezwt-shard-00-02.zvxia6f.mongodb.net:27017/?ssl=true&replicaSet=atlas-3ud85q-shard-0&authSource=admin&retryWrites=true&w=majority';

async function createAdmin() {
    await mongoose.connect(MONGODB_URI);

    const userId = '6988f8534dae4d868d436577'; // owendigitals@gmail.com
    const email = 'owendigitals@gmail.com';

    console.log(`Creating admin for user: ${email} (ID: ${userId})`);

    // Check if already an admin
    const existingAdmin = await mongoose.connection.db.collection('admins').findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (existingAdmin) {
        console.log('User is already an admin!');
        console.log('Role:', existingAdmin.role);
        await mongoose.disconnect();
        return;
    }

    // Create admin
    const admin = await mongoose.connection.db.collection('admins').insertOne({
        userId: new mongoose.Types.ObjectId(userId),
        role: 'SUPER_ADMIN',
        permissions: {
            users: true,
            workspaces: true,
            analytics: true,
            settings: true,
            billing: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
    });

    console.log('\n✅ Admin created successfully!');
    console.log('   Admin ID:', admin.insertedId);
    console.log('   Role: SUPER_ADMIN');
    console.log('   User Email:', email);
    console.log('\nYou can now access /admin with this account.');

    await mongoose.disconnect();
}

createAdmin().catch(console.error);
