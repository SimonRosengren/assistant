/**
 * Tool Definitions for Anthropic API
 * Defines the schema for tools that Claude can use to manage tasks
 */

import type { Tool } from '@anthropic-ai/sdk/resources/messages.mjs'

/**
 * Tool for creating a new task
 * Use this when the user wants to add, create, or remember something to do
 */
export const addTaskTool: Tool = {
  name: 'add_task',
  description: 
    'Creates a new task and saves it to storage. Use this tool when the user wants to add a new task, ' +
    'create a todo item, or remember something they need to do. The task will be created with a pending status. ' +
    'You can optionally set a priority level (low, medium, or high) and add a description for more details.',
  input_schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'The title or name of the task. Should be clear and concise.',
      },
      description: {
        type: 'string',
        description: 'Optional detailed description of the task. Use this to provide additional context or notes.',
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'Optional priority level for the task. Defaults to medium if not specified.',
      },
    },
    required: ['title'],
  },
}

/**
 * Tool for listing tasks with optional filtering
 * Use this when the user wants to see their tasks or check what needs to be done
 */
export const listTasksTool: Tool = {
  name: 'list_tasks',
  description:
    'Retrieves a list of tasks from storage, optionally filtered by status. Use this tool when the user ' +
    'wants to see their tasks, check what needs to be done, or review completed items. You can filter by ' +
    '"pending" to see only incomplete tasks, "completed" to see finished tasks, or "all" to see everything.',
  input_schema: {
    type: 'object',
    properties: {
      filter: {
        type: 'string',
        enum: ['all', 'pending', 'completed'],
        description: 'Filter tasks by status. Use "pending" for incomplete tasks, "completed" for finished tasks, or "all" to see everything. Defaults to "all".',
      },
    },
    required: [],
  },
}

/**
 * Tool for updating an existing task
 * Use this when the user wants to modify, change, or edit a task
 */
export const updateTaskTool: Tool = {
  name: 'update_task',
  description:
    'Updates the properties of an existing task. Use this tool when the user wants to modify, change, or edit ' +
    'a task. You can update the title, description, and/or priority. To mark a task as complete, use the ' +
    'complete_task tool instead. You must provide the task ID along with the fields to update.',
  input_schema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'The UUID of the task to update.',
      },
      title: {
        type: 'string',
        description: 'New title for the task.',
      },
      description: {
        type: 'string',
        description: 'New description for the task.',
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: 'New priority level for the task.',
      },
    },
    required: ['id'],
  },
}

/**
 * Tool for marking a task as completed
 * Use this when the user indicates they finished or completed a task
 */
export const completeTaskTool: Tool = {
  name: 'complete_task',
  description:
    'Marks a task as completed and records the completion timestamp. Use this tool when the user indicates ' +
    'they have finished, completed, or done a task. The task status will be changed to "completed" and the ' +
    'completion time will be recorded. You must provide the task ID.',
  input_schema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'The UUID of the task to mark as completed.',
      },
    },
    required: ['id'],
  },
}

/**
 * Tool for deleting a task permanently
 * Use this when the user wants to remove or delete a task
 */
export const deleteTaskTool: Tool = {
  name: 'delete_task',
  description:
    'Permanently deletes a task from storage. Use this tool when the user wants to remove or delete a task. ' +
    'This action cannot be undone. The task will be completely removed from the system. You must provide the task ID.',
  input_schema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'The UUID of the task to delete.',
      },
    },
    required: ['id'],
  },
}

/**
 * Array of all available tools to pass to the Anthropic API
 */
export const tools: Tool[] = [
  addTaskTool,
  listTasksTool,
  updateTaskTool,
  completeTaskTool,
  deleteTaskTool,
]
