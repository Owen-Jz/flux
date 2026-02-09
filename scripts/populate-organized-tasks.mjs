import mongoose from 'mongoose';
import dns from 'dns';

const MONGODB_URI = 'mongodb+srv://new_owen_user:0lLdhFMmLK582IDp@cluster0.zvxia6f.mongodb.net/?retryWrites=true&w=majority';
const WORKSPACE_ID = '69897f198fe1d26f0a629176';
const BOARD_ID = '698a3589c9c70223ea327be4';
const OWNER_ID = '6988f8534dae4d868d436577';

dns.setServers(['8.8.8.8', '8.8.4.4']);

async function populate() {
    try {
        await mongoose.connect(MONGODB_URI);
        
        const taskSchema = new mongoose.Schema({
            workspaceId: mongoose.Schema.Types.ObjectId,
            boardId: mongoose.Schema.Types.ObjectId,
            title: String,
            description: String,
            status: String,
            priority: String,
            order: Number,
            assignees: [mongoose.Schema.Types.ObjectId],
            subtasks: [{ title: String, completed: Boolean }]
        }, { timestamps: true });

        const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

        const tasks = [
            {
                title: "Master Crypto Trading & AI Integration",
                description: "Deep dive into trading mechanics and AI automation.",
                status: "TODO",
                priority: "HIGH",
                subtasks: [
                    { title: "Learn fundamental technical analysis (RSI, candlesticks)", completed: false },
                    { title: "Research AI trading strategies (automated execution)", completed: false },
                    { title: "Set up crypto paper trading environment", completed: false },
                    { title: "Define risk management protocols", completed: false }
                ]
            },
            {
                title: "NDH: Integration, Testing & Bug Fixes",
                description: "Fixing problems specified by Mrs. Ineba and full testing.",
                status: "IN_PROGRESS",
                priority: "HIGH",
                subtasks: [
                    { title: "Address specific feedback from Mrs. Ineba", completed: false },
                    { title: "Test all modules for end-to-end integration", completed: false },
                    { title: "Audit authentication & access control modules", completed: false },
                    { title: "Final review of marketplace functionality", completed: false }
                ]
            },
            {
                title: "The Vibe Coding System: Logic & Dictionary",
                description: "Standardizing the Vibe Coding methodology.",
                status: "TODO",
                priority: "MEDIUM",
                subtasks: [
                    { title: "Define Vibe Coding terminology for UI/UX & Dev", completed: false },
                    { title: "Build Layout System to verify project standards", completed: false },
                    { title: "Create dictionary for Front-end & Back-end terms", completed: false }
                ]
            },
            {
                title: "Portfolio Refactor: Work Section",
                description: "Updating personal portfolio with latest projects.",
                status: "TODO",
                priority: "MEDIUM",
                subtasks: [
                    { title: "Curate top 5 impact projects", completed: false },
                    { title: "Update work section with Flux & Solana Sniper", completed: false },
                    { title: "Audit mobile responsiveness of detail pages", completed: false }
                ]
            },
            {
                title: "Numero Finance: Landing Page Upgrade",
                description: "Redesigning the Numero landing page for conversion.",
                status: "TODO",
                priority: "MEDIUM",
                subtasks: [
                    { title: "Implement Next.js 15 / Tailwind 4 redesign", completed: false },
                    { title: "Add Smart Budgeting value proposition copy", completed: false },
                    { title: "Create interactive dashboard preview component", completed: false }
                ]
            },
            {
                title: "Life Roadmap: AI-Integrated Goal Scaling",
                description: "Mapping out 2026 goals with AI integration.",
                status: "TODO",
                priority: "HIGH",
                subtasks: [
                    { title: "Map 2026 milestones as a technical roadmap", completed: false },
                    { title: "Automate daily priority locking (3 MITs)", completed: false },
                    { title: "Design Goal-to-Task AI agent logic", completed: false }
                ]
            },
            {
                title: "FluxBot: Admin Command Center",
                description: "Building the monitoring page for FluxBot.",
                status: "TODO",
                priority: "MEDIUM",
                subtasks: [
                    { title: "Design basic bot monitoring dashboard", completed: false },
                    { title: "Implement real-time log stream", completed: false },
                    { title: "Add Panic Switch to stop/start bot", completed: false }
                ]
            },
            {
                title: "Content Engine: Calendar & Automation",
                description: "Automating social media production.",
                status: "TODO",
                priority: "MEDIUM",
                subtasks: [
                    { title: "Design Dramatic content calendar (X/IG)", completed: false },
                    { title: "Automate build-in-public scheduling", completed: false },
                    { title: "Produce first 3 flagship posts", completed: false }
                ]
            },
            {
                title: "Final Year Yearbook & Nelson Branding",
                description: "Completion of university yearbook and client branding.",
                status: "TODO",
                priority: "HIGH",
                subtasks: [
                    { title: "Gather yearbook profile data & class info", completed: false },
                    { title: "Design yearbook cover art & layout", completed: false },
                    { title: "Finalize Nelson Branding assets & handoff", completed: false }
                ]
            }
        ];

        let order = 10000;
        for (const t of tasks) {
            await Task.create({
                ...t,
                workspaceId: new mongoose.Types.ObjectId(WORKSPACE_ID),
                boardId: new mongoose.Types.ObjectId(BOARD_ID),
                assignees: [new mongoose.Types.ObjectId(OWNER_ID)],
                order: order
            });
            order += 1000;
        }
        console.log('✅ Successfully populated Flux with organized tasks!');

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

populate();
