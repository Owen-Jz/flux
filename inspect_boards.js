
const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = "mongodb://new_owen_user:0lLdhFMmLK582IDp@ac-8fpezwt-shard-00-00.zvxia6f.mongodb.net:27017,ac-8fpezwt-shard-00-01.zvxia6f.mongodb.net:27017,ac-8fpezwt-shard-00-02.zvxia6f.mongodb.net:27017/?ssl=true&replicaSet=atlas-3ud85q-shard-0&authSource=admin&retryWrites=true&w=majority";

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined');
    process.exit(1);
}

// Define Schemas (simplified versions just for reading)
const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    color: { type: String, required: true },
});

const BoardSchema = new mongoose.Schema(
    {
        workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
        name: { type: String, required: true },
        slug: { type: String, required: true },
        description: { type: String },
        color: { type: String, default: '#6366f1' },
        icon: { type: String },
        categories: { type: [CategorySchema], default: [] },
    },
    { timestamps: true }
);

const Board = mongoose.models.Board || mongoose.model('Board', BoardSchema);

const WorkspaceSchema = new mongoose.Schema({
    name: String,
    slug: String,
});
const Workspace = mongoose.models.Workspace || mongoose.model('Workspace', WorkspaceSchema);

async function checkBoards() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const workspaceSlug = 'closet-full-of-coco';
        const workspace = await Workspace.findOne({ slug: workspaceSlug });

        if (!workspace) {
            console.log(`Workspace ${workspaceSlug} not found`);
            return;
        }

        console.log(`Workspace found: ${workspace.name} (${workspace._id})`);

        const boards = await Board.find({ workspaceId: workspace._id });
        console.log(`Found ${boards.length} boards`);

        boards.forEach(board => {
            console.log('------------------------------------------------');
            console.log(`Board: ${board.name} (Slug: ${board.slug})`);
            console.log(`ID: ${board._id}`);
            console.log(`Categories: ${board.categories.length}`);
            board.categories.forEach(cat => {
                console.log(` - ${cat.name} (${cat.color}) ID: ${cat._id}`);
            });
            // console.log('Raw Categories:', JSON.stringify(board.categories, null, 2));
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkBoards();
