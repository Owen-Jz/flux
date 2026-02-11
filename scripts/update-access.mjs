import mongoose from 'mongoose';
import dns from 'dns';

const MONGODB_URI = 'mongodb+srv://new_owen_user:0lLdhFMmLK582IDp@cluster0.zvxia6f.mongodb.net/?retryWrites=true&w=majority';
const WORKSPACE_ID = '69897f198fe1d26f0a629176';

dns.setServers(['8.8.8.8', '8.8.4.4']);

async function update() {
    try {
        await mongoose.connect(MONGODB_URI);
        const workspaceSchema = new mongoose.Schema({ 
            settings: { publicAccess: Boolean }
        });
        const Workspace = mongoose.models.Workspace || mongoose.model('Workspace', workspaceSchema);
        
        await Workspace.findByIdAndUpdate(WORKSPACE_ID, { 'settings.publicAccess': true });
        console.log('✅ Updated workspace to Public View (Read-only for others)');
        
        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

update();
