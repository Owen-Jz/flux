import mongoose from 'mongoose';
import dns from 'dns';

const MONGODB_URI = 'mongodb+srv://new_owen_user:0lLdhFMmLK582IDp@cluster0.zvxia6f.mongodb.net/?retryWrites=true&w=majority';
const WORKSPACE_ID = '69897f198fe1d26f0a629176';
const OWNER_ID = '6988f8534dae4d868d436577';

dns.setServers(['8.8.8.8', '8.8.4.4']);

async function populate() {
    try {
        await mongoose.connect(MONGODB_URI);
        
        const boardSchema = new mongoose.Schema({ 
            workspaceId: mongoose.Schema.Types.ObjectId, 
            name: String, 
            slug: String, 
            color: String,
            categories: [{ name: String, color: String }]
        }, { timestamps: true });
        
        const taskSchema = new mongoose.Schema({
            workspaceId: mongoose.Schema.Types.ObjectId,
            boardId: mongoose.Schema.Types.ObjectId,
            title: String,
            description: String,
            status: String,
            priority: String,
            order: Number,
            assignees: [mongoose.Schema.Types.ObjectId]
        }, { timestamps: true });

        const Board = mongoose.models.Board || mongoose.model('Board', boardSchema);
        const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

        // 1. Create Main Board
        const mainBoard = await Board.create({
            workspaceId: new mongoose.Types.ObjectId(WORKSPACE_ID),
            name: 'Strategy & Execution',
            slug: 'strategy-execution',
            color: '#10b981', // Emerald Green
            categories: [
                { name: 'Solana Sniper', color: '#6366f1' },
                { name: 'Product', color: '#ec4899' },
                { name: 'Personal', color: '#f59e0b' }
            ]
        });
        console.log('✅ Created Board:', mainBoard.name);

        const tasks = [
            {
                title: 'Implement Sell Signal Detection',
                description: 'Current monitor only tracks buys. Add logic to track when smart wallets exit positions in monitor.js.',
                status: 'IN_PROGRESS',
                priority: 'HIGH',
                order: 1000
            },
            {
                title: 'Expand Smart Wallet Watchlist',
                description: 'Scan trending tokens on DexScreener to find wallets with >60% win rate. Target: 20 active wallets.',
                status: 'TODO',
                priority: 'HIGH',
                order: 2000
            },
            {
                title: 'Numero Finance: Multi-tenant Refactor',
                description: 'Complete the migration to Next.js 15 Serverless and implement tenant isolation logic.',
                status: 'TODO',
                priority: 'MEDIUM',
                order: 3000
            },
            {
                title: 'Move Out Logistics & Budget',
                description: 'Define target date, location options in Port Harcourt, and initial setup costs.',
                status: 'TODO',
                priority: 'MEDIUM',
                order: 4000
            },
            {
                title: 'Daily Protocol Consistency Check',
                description: 'Strict adherence to 2000 kcal high-protein diet and 6-day workout split.',
                status: 'TODO',
                priority: 'HIGH',
                order: 5000
            },
            {
                title: 'Draft "Dramatic" Build Content',
                description: 'Plan 3 posts for X/IG showing the "Chaos to Clarity" journey of building Flux.',
                status: 'TODO',
                priority: 'MEDIUM',
                order: 6000
            }
        ];

        for (const t of tasks) {
            await Task.create({
                ...t,
                workspaceId: new mongoose.Types.ObjectId(WORKSPACE_ID),
                boardId: mainBoard._id,
                assignees: [new mongoose.Types.ObjectId(OWNER_ID)]
            });
        }
        console.log('✅ Successfully populated workspace with', tasks.length, 'tasks!');

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

populate();
