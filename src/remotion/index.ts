// Entry point for Remotion - registers the root component
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);

// Re-export for convenience
export { TaskProgress, defaultProps } from './TaskProgress';
export type { Task, TaskStatus, TaskPriority, Subtask } from './TaskProgress';
