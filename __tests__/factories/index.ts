// Factory types matching the models
export interface MockUser {
  _id: { toString: () => string };
  name: string;
  email: string;
  image?: string;
  password?: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  subscriptionStatus: 'active' | 'inactive' | 'cancelled' | 'past_due';
  // ... other fields
}

export interface MockWorkspace {
  _id: { toString: () => string };
  name: string;
  slug: string;
  ownerId: { toString: () => string };
  members: Array<{ userId: { toString: () => string }; role: string }>;
  // ... other fields
}

export interface MockTask {
  _id: { toString: () => string };
  workspaceId: { toString: () => string };
  boardId: { toString: () => string };
  title: string;
  status: string;
  priority: string;
  // ... other fields
}

// Factory functions with TypeScript generics
export function createMockUser(overrides?: Partial<MockUser>): MockUser {
  return {
    _id: { toString: () => 'mock-user-id' },
    name: 'Test User',
    email: 'test@example.com',
    plan: 'free',
    subscriptionStatus: 'inactive',
    ...overrides,
  };
}

export function createMockWorkspace(overrides?: Partial<MockWorkspace>): MockWorkspace {
  return {
    _id: { toString: () => 'mock-workspace-id' },
    name: 'Test Workspace',
    slug: 'test-workspace',
    ownerId: { toString: () => 'mock-owner-id' },
    members: [],
    ...overrides,
  };
}

export function createMockTask(overrides?: Partial<MockTask>): MockTask {
  return {
    _id: { toString: () => 'mock-task-id' },
    workspaceId: { toString: () => 'mock-workspace-id' },
    boardId: { toString: () => 'mock-board-id' },
    title: 'Test Task',
    status: 'BACKLOG',
    priority: 'MEDIUM',
    ...overrides,
  };
}