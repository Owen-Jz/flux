
const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = "mongodb://new_owen_user:0lLdhFMmLK582IDp@ac-8fpezwt-shard-00-00.zvxia6f.mongodb.net:27017,ac-8fpezwt-shard-00-01.zvxia6f.mongodb.net:27017,ac-8fpezwt-shard-00-02.zvxia6f.mongodb.net:27017/?ssl=true&replicaSet=atlas-3ud85q-shard-0&authSource=admin&retryWrites=true&w=majority";

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    color: { type: String, required: true },
});

const ParentSchema = new mongoose.Schema({
    categories: { type: [CategorySchema], default: [] }
});

const Parent = mongoose.models.Parent || mongoose.model('Parent', ParentSchema);

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);

        // Create doc
        const p = new Parent({
            categories: [{ name: 'Test', color: 'red' }]
        });
        await p.save();

        // Find lean
        const pLean = await Parent.findById(p._id).lean();
        console.log('Lean result:', JSON.stringify(pLean, null, 2));

        if (pLean.categories && pLean.categories[0]._id) {
            console.log('Category has _id:', pLean.categories[0]._id);
        } else {
            console.log('Category MISSING _id');
        }

        // Clean up
        await Parent.findByIdAndDelete(p._id);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

run();
