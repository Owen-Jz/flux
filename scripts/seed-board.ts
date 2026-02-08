
import { loadEnvConfig } from '@next/env';
import mongoose, { Types } from 'mongoose';
import { connectDB } from '../lib/db';
import { User } from '../models/User';
import { Workspace } from '../models/Workspace';
import { Board } from '../models/Board';
import { Task, TaskPriority, TaskStatus } from '../models/Task';

// Load environment variables
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const REALISTIC_USERS = [
    { name: 'Sarah Chen', email: 'sarah.chen@example.com', image: 'https://i.pravatar.cc/150?u=sarah' },
    { name: 'Marcus Johnson', email: 'marcus.j@example.com', image: 'https://i.pravatar.cc/150?u=marcus' },
    { name: 'Emma Wilson', email: 'emma.w@example.com', image: 'https://i.pravatar.cc/150?u=emma' },
    { name: 'David Kim', email: 'david.k@example.com', image: 'https://i.pravatar.cc/150?u=david' },
    { name: 'Sofia Rodriguez', email: 'sofia.r@example.com', image: 'https://i.pravatar.cc/150?u=sofia' },
];

const REALISTIC_TASKS = [
    { title: 'Design System - Dark Mode', description: 'Create color tokens and component variants for dark mode support across the entire platform.', status: 'IN_PROGRESS', priority: 'HIGH', tags: ['Design', 'UI'] },
    { title: 'API Authentication Refactor', description: 'Migrate from JWT to OAuth2 for better security and third-party integration.', status: 'TODO', priority: 'HIGH', tags: ['Backend', 'Security'] },
    { title: 'User Onboarding Flow', description: 'Redesign the first-time user experience to improve conversion rates. Focus on the "Aha!" moment.', status: 'BACKLOG', priority: 'MEDIUM', tags: ['Product', 'UX'] },
    { title: 'Fix Mobile Navigation Glitch', description: 'The hamburger menu closes unexpectedly on iOS Safari 16+. Needs debugging.', status: 'TODO', priority: 'MEDIUM', tags: ['Bug', 'Mobile'] },
    { title: 'Quarterly Analytics Report', description: 'Compile user growth, retention, and engagement metrics for the Q1 board meeting.', status: 'DONE', priority: 'MEDIUM', tags: ['Analytics'] },
    { title: 'Integrate Stripe Payments', description: 'Implement subscription billing and checkout flow using Stripe Elements.', status: 'IN_PROGRESS', priority: 'HIGH', tags: ['Backend', 'Payments'] },
    { title: 'Update Landing Page Copy', description: 'Refresh the value proposition based on recent customer feedback interviews.', status: 'DONE', priority: 'LOW', tags: ['Marketing'] },
    { title: 'Optimize Database Queries', description: 'Analyze slow queries in the dashboard analytics endpoint and add necessary indexes.', status: 'BACKLOG', priority: 'HIGH', tags: ['Performance', 'Backend'] },
    { title: 'Accessibility Audit (WCAG 2.1)', description: 'Run a full audit of the main application flows ensuring keyboard navigation and screen reader support.', status: 'TODO', priority: 'LOW', tags: ['Accessibility'] },
    { title: 'Implement File Uploads', description: 'Allow users to attach images and PDFs to tasks. Use S3 for storage.', status: 'IN_PROGRESS', priority: 'MEDIUM', tags: ['Feature', 'Frontend'] },
    { title: 'Internal Admin Dashboard', description: 'Build a simple admin panel to manage user accounts and view system health.', status: 'BACKLOG', priority: 'LOW', tags: ['Internal'] },
    { title: 'Setup CI/CD Pipeline', description: 'Automate testing and deployment to staging environment on every PR merge.', status: 'DONE', priority: 'HIGH', tags: ['DevOps'] },
    { title: 'Refactor Redux Store', description: 'Simplify state management by moving to React Context or Zustand where appropriate.', status: 'BACKLOG', priority: 'LOW', tags: ['Refactor'] },
    { title: 'Write E2E Tests', description: 'Cover critical user paths (Sign up, Create Project, Invite Member) with Cypress tests.', status: 'TODO', priority: 'MEDIUM', tags: ['Testing'] },
    { title: 'Social Media Sharing', description: 'Add OpenGraph tags and social share buttons to public project pages.', status: 'BACKLOG', priority: 'LOW', tags: ['Marketing'] },
];

async function seed() {
    try {
        await connectDB();
        console.log('🔌 Connected to MongoDB');

        const workspaceSlug = 'closetfullofcoco';
        const boardSlug = 'general';

        console.log(`🔍 Finding workspace: ${workspaceSlug}`);
        const workspace = await Workspace.findOne({ slug: workspaceSlug });
        if (!workspace) {
            console.error(`❌ Workspace '${workspaceSlug}' not found! Please create it first.`);
            process.exit(1);
        }

        console.log(`🔍 Finding board: ${boardSlug}`);
        const board = await Board.findOne({ workspaceId: workspace._id, slug: boardSlug });
        if (!board) {
            console.error(`❌ Board '${boardSlug}' not found! Please create it first.`);
            process.exit(1);
        }

        // 1. Create/Get Users
        console.log('👥 Seeding Fake Users...');
        const userIds: Types.ObjectId[] = [];

        // Add existing members to the pool
        workspace.members.forEach((m: any) => userIds.push(m.userId));

        // Fix any existing 'OWNER' roles to 'ADMIN' to match new schema
        workspace.members.forEach((m: any) => {
            if (m.role === 'OWNER') {
                console.log(`   Migrating role for user ${m.userId} from OWNER to ADMIN`);
                m.role = 'ADMIN';
            }
        });

        for (const userData of REALISTIC_USERS) {
            let user = await User.findOne({ email: userData.email });
            if (!user) {
                user = await User.create({
                    ...userData,
                    password: 'password123' // Dummy password
                });
                console.log(`   Created user: ${user.name}`);
            } else {
                console.log(`   Found existing user: ${user.name}`);
            }

            // check if in workspace
            const isMember = workspace.members.some((m: any) => m.userId.toString() === user!._id.toString());
            if (!isMember) {
                workspace.members.push({
                    userId: user._id,
                    role: 'EDITOR',
                    joinedAt: new Date()
                });
                console.log(`   Added ${user.name} to workspace`);
            }
            if (!userIds.some(id => id.toString() === user!._id.toString())) {
                userIds.push(user._id);
            }
        }
        await workspace.save();

        // 2. Clear existing tasks on this board (optional? No, better append or user asked to "fill")
        // User said "Generate a script to fill this board". I'll add to it to avoid destructive data loss if they have something.

        console.log('📋 Seeding Tasks...');

        // Determine starting order
        const highestOrderTask = await Task.findOne({ boardId: board._id }).sort({ order: -1 });
        let currentOrder = (highestOrderTask?.order || 0) + 1000;

        for (const taskData of REALISTIC_TASKS) {
            // Random assignees (0 to 3)
            const numAssignees = Math.floor(Math.random() * 3); // 0, 1, or 2
            const shuffledUsers = [...userIds].sort(() => 0.5 - Math.random());
            const assignees = shuffledUsers.slice(0, numAssignees);

            // Random subtasks
            const subtasks = [];
            const numSubtasks = Math.floor(Math.random() * 4); // 0 to 3
            if (numSubtasks > 0) {
                for (let i = 0; i < numSubtasks; i++) {
                    subtasks.push({
                        title: `Subtask ${i + 1} for ${taskData.title.substring(0, 10)}...`,
                        completed: Math.random() > 0.5
                    });
                }
            }

            await Task.create({
                workspaceId: workspace._id,
                boardId: board._id,
                title: taskData.title,
                description: taskData.description,
                status: taskData.status as TaskStatus,
                priority: taskData.priority as TaskPriority,
                order: currentOrder,
                assignees: assignees,
                tags: taskData.tags,
                subtasks: subtasks,
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000)), // Random date in last 10 days
            });
            currentOrder += 1000;
            console.log(`   Created task: ${taskData.title}`);
        }

        console.log('✅ Board seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
