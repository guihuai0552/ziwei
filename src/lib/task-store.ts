// Simple in-memory store for tasks
// WARNING: This only works on single-instance deployments (like standard Zeabur/Docker).
// It will NOT work on Vercel Serverless functions as state is lost between requests.

type TaskStatus = 'pending' | 'completed' | 'failed';

interface Task {
    id: string;
    status: TaskStatus;
    result?: any;
    error?: string;
    createdAt: number;
}

const tasks = new Map<string, Task>();

export const taskStore = {
    create: (id: string) => {
        tasks.set(id, { id, status: 'pending', createdAt: Date.now() });
        // Cleanup old tasks occasionally (1% chance)
        if (Math.random() < 0.01) taskStore.cleanup();
    },

    update: (id: string, data: Partial<Task>) => {
        const task = tasks.get(id);
        if (task) {
            tasks.set(id, { ...task, ...data });
        }
    },

    get: (id: string) => {
        return tasks.get(id);
    },

    cleanup: () => {
        const now = Date.now();
        // Keep tasks for 10 minutes
        const TTL = 10 * 60 * 1000;
        for (const [id, task] of tasks) {
            if (now - task.createdAt > TTL) {
                tasks.delete(id);
            }
        }
    }
};
