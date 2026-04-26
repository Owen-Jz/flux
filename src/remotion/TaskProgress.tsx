import { Composition, useCurrentFrame, useVideoConfig } from 'remotion';
import { AbsoluteFill, interpolate, spring } from 'remotion';
import { useMemo } from 'react';

// Task type matching Flux schema.ts
type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'ARCHIVED';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

interface Subtask {
  title: string;
  completed: boolean;
}

interface Task {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  subtasks: Subtask[];
}

interface TaskProgressProps {
  tasks: Task[];
}

const ANIMATION_DURATION = 150; // frames (5 seconds at 30fps)
const PADDING = 20;

const statusColors: Record<TaskStatus, string> = {
  BACKLOG: '#6B7280',
  TODO: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  REVIEW: '#8B5CF6',
  DONE: '#10B981',
  ARCHIVED: '#9CA3AF',
};

const priorityColors: Record<TaskPriority, string> = {
  LOW: '#6B7280',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
};

const springConfig = {
  damping: 12,
  stiffness: 100,
  mass: 1,
};

const getProgress = (task: Task): number => {
  if (!task.subtasks || task.subtasks.length === 0) {
    return task.status === 'DONE' ? 100 : 0;
  }
  const completed = task.subtasks.filter((s) => s.completed).length;
  return Math.round((completed / task.subtasks.length) * 100);
};

interface TaskRowProps {
  task: Task;
  index: number;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = getProgress(task);

  // Spring animation for entry
  const entrySpringValue = useMemo(() => {
    return spring({
      frame,
      fps,
      config: springConfig,
    });
  }, [frame, fps]);

  const entryProgress = interpolate(entrySpringValue, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Delayed spring for progress bar fill
  const delayFrames = (index + 1) * 10;
  const adjustedFrame = Math.max(0, frame - delayFrames);

  const progressSpringValue = useMemo(() => {
    return spring({
      frame: adjustedFrame,
      fps,
      config: { ...springConfig, damping: 15, stiffness: 80 },
    });
  }, [adjustedFrame, fps]);

  const progressFill = interpolate(progressSpringValue, [0, 1], [0, progress], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(entryProgress, [0, 1], [50, 0]);
  const opacity = interpolate(entryProgress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: PADDING,
        backgroundColor: '#1F2937',
        borderRadius: 8,
        marginBottom: 12,
        transform: `translateY(${translateY}px)`,
        opacity,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: statusColors[task.status],
            }}
          />
          <span style={{ color: '#F9FAFB', fontSize: 16, fontWeight: 500 }}>
            {task.title}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              color: priorityColors[task.priority],
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            {task.priority}
          </span>
          <span style={{ color: '#9CA3AF', fontSize: 12 }}>{progress}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 8,
          backgroundColor: '#374151',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progressFill}%`,
            height: '100%',
            backgroundColor: statusColors[task.status],
            borderRadius: 4,
          }}
        />
      </div>

      {/* Subtask count */}
      {task.subtasks.length > 0 && (
        <div style={{ marginTop: 6, color: '#6B7280', fontSize: 12 }}>
          {task.subtasks.filter((s) => s.completed).length} / {task.subtasks.length} subtasks
        </div>
      )}
    </div>
  );
};

const TaskProgress: React.FC<TaskProgressProps> = ({ tasks }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Overall container spring
  const containerSpringValue = useMemo(() => {
    return spring({
      frame,
      fps,
      config: { damping: 14, stiffness: 90 },
    });
  }, [frame, fps]);

  const containerScale = interpolate(containerSpringValue, [0, 1], [0.95, 1]);
  const containerOpacity = interpolate(containerSpringValue, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#111827',
        padding: 40,
        transform: `scale(${containerScale})`,
        opacity: containerOpacity,
      }}
    >
      {/* Title */}
      <div
        style={{
          color: '#F9FAFB',
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 24,
        }}
      >
        Task Progress
      </div>

      {/* Task list */}
      <div>
        {tasks.map((task, index) => (
          <TaskRow key={index} task={task} index={index} />
        ))}
      </div>

      {/* Overall progress */}
      <div
        style={{
          marginTop: 24,
          padding: PADDING,
          backgroundColor: '#1F2937',
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <span style={{ color: '#F9FAFB', fontWeight: 600 }}>Overall</span>
          <span style={{ color: '#9CA3AF' }}>
            {tasks.length} tasks
          </span>
        </div>
        <div
          style={{
            height: 12,
            backgroundColor: '#374151',
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${interpolate(frame, [0, ANIMATION_DURATION], [0, 100])}%`,
              height: '100%',
              backgroundColor: '#3B82F6',
              borderRadius: 6,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Default props for the composition
const defaultProps: TaskProgressProps = {
  tasks: [
    {
      title: 'Design review',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      subtasks: [
        { title: 'Review mockups', completed: true },
        { title: 'Collect feedback', completed: true },
        { title: 'Implement changes', completed: false },
      ],
    },
    {
      title: 'API integration',
      status: 'TODO',
      priority: 'MEDIUM',
      subtasks: [
        { title: 'Setup endpoints', completed: false },
        { title: 'Test connection', completed: false },
      ],
    },
    {
      title: 'Documentation',
      status: 'DONE',
      priority: 'LOW',
      subtasks: [
        { title: 'Write docs', completed: true },
      ],
    },
  ],
};

export { TaskProgress, defaultProps };
