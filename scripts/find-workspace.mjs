import mongoose from 'mongoose';
import dns from 'dns';

const MONGODB_URI = 'mongodb+srv://new_owen_user:0lLdhFMmLK582IDp@cluster0.zvxia6f.mongodb.net/?retryWrites=true&w=majority';
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function findWorkspace() {
    try {
        await mongoose.connect(MONGODB_URI);
        
        // Define schemas only if they haven't been defined
        const workspaceSchema = new mongoose.Schema({ name: String, slug: String, ownerId: mongoose.Schema.Types.ObjectId });
        const boardSchema = new mongoose.Schema({ workspaceId: mongoose.Schema.Types.ObjectId, name: String, slug: String });
        
        const Workspace = mongoose.models.Workspace || mongoose.model('Workspace', workspaceSchema);
        const Board = mongoose.models.Board || mongoose.model('Board', boardSchema);
        
        const workspaces = await Workspace.find({ name: /Owen/i });
        console.log('Workspaces found:', JSON.stringify(workspaces, null, 2));

        if (workspaces.length > 0) {
            for (const ws of workspaces) {
                const boards = await Board.find({ workspaceId: ws._id });
                console.log(`Boards for workspace ${ws.name}:`, JSON.stringify(boards, null, 2));
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

findWorkspace();
