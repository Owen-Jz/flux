import { loadEnvConfig } from '@next/env';
import mongoose, { Types } from 'mongoose';
import { connectDB } from '../lib/db';
import { Workspace } from '../models/Workspace';
import { Issue, IssuePriority, IssueStatus, IssueType } from '../models/Issue';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const ISSUES_TO_ADD = [
    { title: "Separate Active Vendors Analytics", description: "The client wants to separate 'Active Vendors by Views' from 'Active Vendors by Enquiries'. Currently, they are grouped together with views as the primary set, which is causing lack of clarity.", status: "OPEN", priority: "HIGH", type: "FEATURE" },
    { title: "Track Enquiries by Chats Started", description: "Enquiries should be specifically counted by the 'number of chats started' on the analytics dashboard.", status: "OPEN", priority: "HIGH", type: "FEATURE" },
    { title: "Add 7-Day Analytics Filter", description: "The client needs the ability to filter analytics by the last 7 days as well as the 30-day view, as the current longer-term views are often perceived as incorrect or not recent enough.", status: "OPEN", priority: "HIGH", type: "FEATURE" },
    { title: "Add Event Timing Context to Analytics", description: "There is a lack of 'event timing' for data points. Investigate displaying exactly when an inquiry happened on the dashboard.", status: "OPEN", priority: "MEDIUM", type: "IMPROVEMENT" },
    { title: "Fix Mobile vs Desktop Filter Parity", description: "The '7 days' filter is currently showing on desktop but was removed from mobile, causing confusion. Ensure consistency across platforms.", status: "OPEN", priority: "MEDIUM", type: "BUG" },
    { title: "Audit and Fix General Vendor Dashboard Errors", description: "The client noted that logging into the vendor dashboard reveals several 'errors' in the analytics that need to be audited and fixed.", status: "OPEN", priority: "HIGH", type: "BUG" },
    { title: "Finalize Homepage Imagery", description: "The homepage is still awaiting the final images the client has 'chosen' so it can be finalized.", status: "OPEN", priority: "LOW", type: "IMPROVEMENT" }
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

        console.log('📋 Adding Issues...');

        // Grab the first member of the workspace to act as the reporter
        const reporterId = workspace.members.length > 0 ? workspace.members[0].userId : new Types.ObjectId();

        for (const issueData of ISSUES_TO_ADD) {
            await Issue.create({
                workspaceId: workspace._id,
                title: issueData.title,
                description: issueData.description,
                status: issueData.status as IssueStatus,
                priority: issueData.priority as IssuePriority,
                type: issueData.type as IssueType,
                reporterId: reporterId, // Every issue needs a reporter
            });
            console.log(`   Created issue: ${issueData.title}`);
        }

        console.log('✅ Issues imported successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed:', error);
        process.exit(1);
    }
}

run();
