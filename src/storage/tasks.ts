/**
 * Task Storage Layer
 * Handles reading/writing tasks to data/tasks.json
 * All functions are pure and return Result types for error handling
 */

import { promises as fs } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Task, TaskFilter, CreateTaskInput, Result } from '../types/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_DIR = join(__dirname, '../../data')
const TASKS_FILE = join(DATA_DIR, 'tasks.json')

// ============================================================================
// Private Helper Functions
// ============================================================================

/**
 * Ensures the data directory exists
 */
async function ensureDataDir(): Promise<Result<void>> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to create data directory'),
    }
  }
}

/**
 * Generates a unique ID for tasks using UUID v4
 */
function generateId(): string {
  return randomUUID()
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Loads all tasks from storage
 * Returns empty array if file doesn't exist
 */
export async function loadTasks(): Promise<Result<readonly Task[]>> {
  try {
    const content = await fs.readFile(TASKS_FILE, 'utf-8')
    const tasks = JSON.parse(content) as Task[]
    return { success: true, data: tasks }
  } catch (error) {
    // If file doesn't exist, return empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { success: true, data: [] }
    }
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to load tasks'),
    }
  }
}

/**
 * Saves tasks to storage
 * Ensures data directory exists before writing
 */
export async function saveTasks(tasks: readonly Task[]): Promise<Result<void>> {
  const dirResult = await ensureDataDir()
  if (!dirResult.success) {
    return dirResult
  }

  try {
    const content = JSON.stringify(tasks, null, 2)
    await fs.writeFile(TASKS_FILE, content, 'utf-8')
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to save tasks'),
    }
  }
}

/**
 * Creates a new task and persists it to storage
 */
export async function createTask(input: CreateTaskInput): Promise<Result<Task>> {
  const tasksResult = await loadTasks()
  if (!tasksResult.success) {
    return tasksResult
  }

  const now = new Date().toISOString()
  const newTask: Task = {
    id: generateId(),
    title: input.title,
    description: input.description,
    priority: input.priority ?? 'medium',
    status: 'pending',
    createdAt: now,
  }

  const updatedTasks = [...tasksResult.data, newTask]
  const saveResult = await saveTasks(updatedTasks)
  
  if (!saveResult.success) {
    return saveResult
  }

  return { success: true, data: newTask }
}

/**
 * Updates an existing task
 * Returns error if task not found
 */
export async function updateTask(
  id: string,
  updates: Partial<Omit<Task, 'id' | 'createdAt'>>
): Promise<Result<Task>> {
  const tasksResult = await loadTasks()
  if (!tasksResult.success) {
    return tasksResult
  }

  const taskIndex = tasksResult.data.findIndex((t) => t.id === id)
  if (taskIndex === -1) {
    return {
      success: false,
      error: new Error(`Task with id ${id} not found`),
    }
  }

  const existingTask = tasksResult.data[taskIndex]!
  const updatedTask: Task = {
    ...existingTask,
    ...updates,
  }

  const updatedTasks = [
    ...tasksResult.data.slice(0, taskIndex),
    updatedTask,
    ...tasksResult.data.slice(taskIndex + 1),
  ]

  const saveResult = await saveTasks(updatedTasks)
  if (!saveResult.success) {
    return saveResult
  }

  return { success: true, data: updatedTask }
}

/**
 * Marks a task as completed
 */
export async function completeTask(id: string): Promise<Result<Task>> {
  return updateTask(id, {
    status: 'completed',
    completedAt: new Date().toISOString(),
  })
}

/**
 * Deletes a task by ID
 */
export async function deleteTask(id: string): Promise<Result<void>> {
  const tasksResult = await loadTasks()
  if (!tasksResult.success) {
    return tasksResult
  }

  const taskExists = tasksResult.data.some((t) => t.id === id)
  if (!taskExists) {
    return {
      success: false,
      error: new Error(`Task with id ${id} not found`),
    }
  }

  const updatedTasks = tasksResult.data.filter((t) => t.id !== id)
  return saveTasks(updatedTasks)
}

/**
 * Finds a task by ID
 * Returns null if not found
 */
export async function findTaskById(id: string): Promise<Result<Task | null>> {
  const tasksResult = await loadTasks()
  if (!tasksResult.success) {
    return tasksResult
  }

  const task = tasksResult.data.find((t) => t.id === id)
  return { success: true, data: task ?? null }
}

/**
 * Filters tasks by status
 */
export async function filterTasks(filter: TaskFilter): Promise<Result<readonly Task[]>> {
  const tasksResult = await loadTasks()
  if (!tasksResult.success) {
    return tasksResult
  }

  if (filter === 'all') {
    return tasksResult
  }

  const filtered = tasksResult.data.filter((t) => t.status === filter)
  return { success: true, data: filtered }
}
