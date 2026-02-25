import { loadEnvConfig } from '@next/env';
import mongoose, { Types } from 'mongoose';
import { connectDB } from '../lib/db';
import { Workspace } from '../models/Workspace';
import { Board } from '../models/Board';
import { Task, TaskPriority, TaskStatus } from '../models/Task';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const TASKS_TO_ADD = [
    { title: "Separate Active Vendors Analytics", description: "The client wants to separate 'Active Vendors by Views' from 'Active Vendors by Enquiries'. Currently, they are grouped together with views as the primary set, which is causing lack of clarity.", status: "TODO", priority: "HIGH" },
    { title: "Track Enquiries by Chats Started", description: "Enquiries should be specifically counted by the 'number of chats started' on the analytics dashboard.", status: "TODO", priority: "HIGH" },
    { title: "Add 7-Day Analytics Filter", description: "The client needs the ability to filter analytics by the last 7 days as well as the 30-day view, as the current longer-term views are often perceived as incorrect or not recent enough.", status: "TODO", priority: "HIGH" },
    { title: "Add Event Timing Context to Analytics", description: "There is a lack of 'event timing' for data points. Investigate displaying exactly when an inquiry happened on the dashboard.", status: "TODO", priority: "MEDIUM" },
    { title: "Fix Mobile vs Desktop Filter Parity", description: "The '7 days' filter is currently showing on desktop but was removed from mobile, causing confusion. Ensure consistency across platforms.", status: "TODO", priority: "MEDIUM" },
    { title: "Audit and Fix General Vendor Dashboard Errors", description: "The client noted that logging into the vendor dashboard reveals several 'errors' in the analytics that need to be audited and fixed.", status: "TODO", priority: "HIGH" },
    { title: "Finalize Homepage Imagery", description: "The homepage is still awaiting the final images the client has 'chosen' so it can be finalized.", status: "TODO", priority: "LOW" }
];

async function run() {
    try {
        await connectDB();
        console.log('🔌 Connected to MongoDB');

        const workspaceSlug = 'ndh-workspace-149';
        console.log(`🔍 Finding workspace: ${workspaceSlug}`);
        const workspace = await Workspace.findOne({ slug: workspaceSlug });

        if (!workspace) {
            console.error(`❌ Workspace '${workspaceSlug}' not found!`);
            process.exit(1);
        }

        console.log(`🔍 Finding default board for workspace...`);
        let board = await Board.findOne({ workspaceId: workspace._id });
        if (!board) {
            console.log(`⚠️ No board found. Creating default board...`);
            board = await Board.create({
                workspaceId: workspace._id,
                name: 'Main Board',
                slug: 'main',
                description: 'Default project board',
                color: '#4f46e5'
            });
        }

        console.log('📋 Adding Tasks...');

        // Determine starting order
        const highestOrderTask = await Task.findOne({ boardId: board._id, status: 'TODO' }).sort({ order: -1 });
        let currentOrder = (highestOrderTask?.order || 0) + 1000;

        for (const taskData of TASKS_TO_ADD) {
            await Task.create({
                workspaceId: workspace._id,
                boardId: board._id,
                title: taskData.title,
                description: taskData.description,
                status: taskData.status as TaskStatus,
                priority: taskData.priority as TaskPriority,
                order: currentOrder,
                assignees: [], // can be assigned later
                tags: ['NDH Updates'],
                subtasks: [],
            });
            currentOrder += 1000;
            console.log(`   Created task: ${taskData.title}`);
        }

        console.log('✅ Tasks imported successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed:', error);
        process.exit(1);
    }
}

run();
