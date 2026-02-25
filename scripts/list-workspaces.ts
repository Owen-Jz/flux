import { loadEnvConfig } from '@next/env';
import mongoose from 'mongoose';
import { connectDB } from '../lib/db';
import { Workspace } from '../models/Workspace';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function listWorkspaces() {
    await connectDB();
    const workspaces = await Workspace.find({}, 'name slug _id');
    console.log("Workspaces:");
    workspaces.forEach(w => console.log(`- ${w.name} (slug: ${w.slug})`));
    process.exit(0);
}

listWorkspaces();
