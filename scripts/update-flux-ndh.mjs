import mongoose from 'mongoose';
import dns from 'dns';

const MONGODB_URI = 'mongodb+srv://new_owen_user:0lLdhFMmLK582IDp@cluster0.zvxia6f.mongodb.net/?retryWrites=true&w=majority';
const WORKSPACE_ID = '69897f198fe1d26f0a629176';

dns.setServers(['8.8.8.8', '8.8.4.4']);

async function update() {
    try {
        await mongoose.connect(MONGODB_URI);
        
        const taskSchema = new mongoose.Schema({
            workspaceId: mongoose.Schema.Types.ObjectId,
            title: String,
            subtasks: [{ title: String, completed: Boolean }]
        }, { timestamps: true });

        const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

        const subtasks = [
            { title: "Address specific feedback from Mrs. Ineba", completed: false },
            { title: "Test all modules for end-to-end integration", completed: false },
            { title: "Auth: Logout Invalidation & Session Security", completed: false },
            { title: "Auth: Reset Password & Token Expiry Flow", completed: false },
            { title: "Auth: API Bypass & Input Validation (401/403)", completed: false },
            { title: "Vendor: IDOR & XSS Sanitization Tests", completed: false },
            { title: "Vendor: File Upload & Onboarding Persistence", completed: false },
            { title: "Vendor: Mobile Dashboard Responsiveness", completed: false },
            { title: "Marketplace: Search Injection & Rate Limiting", completed: false },
            { title: "Marketplace: Data Leakage & Filter Accuracy", completed: false },
            { title: "Interaction: Message Privacy & Review Integrity", completed: false },
            { title: "Payments: Price Tampering & Webhook Security", completed: false },
            { title: "Payments: Feature Gating & Error Handling", completed: false },
            { title: "Admin: PII Protection & Audit Trail Accuracy", completed: false },
            { title: "Admin: Bulk Actions & Approval Workflows", completed: false },
            { title: "General: Cross-Browser & Slow 3G Performance", completed: false }
        ];

        const res = await Task.findOneAndUpdate(
            { workspaceId: new mongoose.Types.ObjectId(WORKSPACE_ID), title: "NDH: Integration, Testing & Bug Fixes" },
            { subtasks: subtasks },
            { new: true }
        );

        if (res) {
            console.log('✅ Updated Flux subtasks for NDH!');
        } else {
            console.log('❌ Could not find NDH task in Flux.');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
}

update();
