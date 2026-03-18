import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MinimaxClient, createMinimaxClient } from '../lib/llm/client';

// Mock crypto.randomUUID
vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => 'test-uuid-123')
}));

// Mock fetch
global.fetch = vi.fn();

describe('MinimaxClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Constructor', () => {
    it('should throw error when API key is not provided', () => {
      expect(() => new MinimaxClient({ apiKey: '' })).toThrow('Minimax API key is required');
    });

    it('should throw error when API key is undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => new MinimaxClient({ apiKey: undefined as any })).toThrow('Minimax API key is required');
    });

    it('should create client with default values', () => {
      const client = new MinimaxClient({ apiKey: 'test-key' });
      expect(client).toBeDefined();
    });

    it('should accept custom baseUrl and model', () => {
      const client = new MinimaxClient({
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com',
        model: 'custom-model'
      });
      expect(client).toBeDefined();
    });
  });

  describe('createMinimaxClient', () => {
    it('should throw error when MINIMAX_API_KEY is not set', () => {
      // Save original env
      const originalEnv = process.env.MINIMAX_API_KEY;
      delete process.env.MINIMAX_API_KEY;

      expect(() => createMinimaxClient()).toThrow('MINIMAX_API_KEY environment variable is required');

      // Restore
      if (originalEnv !== undefined) {
        process.env.MINIMAX_API_KEY = originalEnv;
      }
    });

    it('should create client from environment variable', () => {
      const originalEnv = process.env.MINIMAX_API_KEY;
      process.env.MINIMAX_API_KEY = 'env-test-key';

      const client = createMinimaxClient();
      expect(client).toBeDefined();

      // Restore
      if (originalEnv !== undefined) {
        process.env.MINIMAX_API_KEY = originalEnv;
      } else {
        delete process.env.MINIMAX_API_KEY;
      }
    });
  });

  describe('parseResponse', () => {
    it('should parse valid LLM response', () => {
      const client = new MinimaxClient({ apiKey: 'test-key' });

      const mockResponse = {
        id: 'test-id',
        choices: [{
          message: {
            content: JSON.stringify({
              taskId: 'task-123',
              summary: 'Test summary',
              subtasks: [
                {
                  title: 'Subtask 1',
                  description: 'Description 1',
                  estimatedHours: 2,
                  priority: 'High'
                }
              ]
            })
          }
        }]
      };

      const result = client.parseResponse(mockResponse as any);
      expect(result.taskId).toBe('task-123');
      expect(result.summary).toBe('Test summary');
      expect(result.subtasks).toHaveLength(1);
      expect(result.subtasks[0].title).toBe('Subtask 1');
    });

    it('should parse JSON from markdown code blocks', () => {
      const client = new MinimaxClient({ apiKey: 'test-key' });

      const mockResponse = {
        id: 'test-id',
        choices: [{
          message: {
            content: '```json\n{\n  "taskId": "task-456",\n  "summary": "Summary from code block",\n  "subtasks": []\n}\n```'
          }
        }]
      };

      const result = client.parseResponse(mockResponse as any);
      expect(result.taskId).toBe('task-456');
      expect(result.summary).toBe('Summary from code block');
    });

    it('should throw error when no content in response', () => {
      const client = new MinimaxClient({ apiKey: 'test-key' });

      const mockResponse = {
        id: 'test-id',
        choices: [{
          message: {
            content: ''
          }
        }]
      };

      expect(() => client.parseResponse(mockResponse as any)).toThrow('No content in LLM response');
    });

    it('should throw error when response is not valid JSON', () => {
      const client = new MinimaxClient({ apiKey: 'test-key' });

      const mockResponse = {
        id: 'test-id',
        choices: [{
          message: {
            content: 'not valid json'
          }
        }]
      };

      expect(() => client.parseResponse(mockResponse as any)).toThrow('Failed to parse LLM response as JSON');
    });

    it('should generate taskId if not provided', () => {
      const client = new MinimaxClient({ apiKey: 'test-key' });

      const mockResponse = {
        id: 'test-id',
        choices: [{
          message: {
            content: JSON.stringify({
              summary: 'Test summary',
              subtasks: [
                {
                  title: 'Subtask 1',
                  description: 'Description 1',
                  estimatedHours: 2,
                  priority: 'High'
                }
              ]
            })
          }
        }]
      };

      const result = client.parseResponse(mockResponse as any);
      expect(result.taskId).toBe('test-uuid-123');
    });

    it('should throw error when subtasks is missing', () => {
      const client = new MinimaxClient({ apiKey: 'test-key' });

      const mockResponse = {
        id: 'test-id',
        choices: [{
          message: {
            content: JSON.stringify({
              taskId: 'task-123',
              summary: 'Test summary'
            })
          }
        }]
      };

      expect(() => client.parseResponse(mockResponse as any)).toThrow('Response missing required field: subtasks');
    });

    it('should throw error when priority is invalid', () => {
      const client = new MinimaxClient({ apiKey: 'test-key' });

      const mockResponse = {
        id: 'test-id',
        choices: [{
          message: {
            content: JSON.stringify({
              taskId: 'task-123',
              summary: 'Test summary',
              subtasks: [
                {
                  title: 'Subtask 1',
                  description: 'Description 1',
                  estimatedHours: 2,
                  priority: 'Invalid'
                }
              ]
            })
          }
        }]
      };

      expect(() => client.parseResponse(mockResponse as any)).toThrow('Invalid priority value');
    });
  });

  describe('callAPI timeout', () => {
    it('should timeout after 15 seconds', async () => {
      const client = new MinimaxClient({ apiKey: 'test-key' });

      // Mock fetch to reject with AbortError (simulating a timeout)
      const abortError = new Error('The operation was aborted.');
      abortError.name = 'AbortError';
      vi.mocked(fetch).mockRejectedValue(abortError);

      const messages = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' }
      ];

      await expect(client.callAPI(messages)).rejects.toThrow('Request timed out after 15 seconds');
    }, 20000);

    it('should handle API errors', async () => {
      const client = new MinimaxClient({ apiKey: 'test-key' });

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue('Unauthorized')
      } as any);

      const messages = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' }
      ];

      await expect(client.callAPI(messages)).rejects.toThrow('Minimax API error: 401 - Unauthorized');
    });
  });

  describe('decomposesTask', () => {
    it('should decompose task and return response', async () => {
      const client = new MinimaxClient({ apiKey: 'test-key' });

      const mockResponse = {
        id: 'test-id',
        choices: [{
          message: {
            content: JSON.stringify({
              taskId: 'task-789',
              summary: 'Decomposed task',
              subtasks: [
                {
                  title: 'Step 1',
                  description: 'First step',
                  estimatedHours: 1,
                  priority: 'Medium'
                }
              ]
            })
          }
        }]
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse)
      } as any);

      const request = {
        taskTitle: 'Build a feature',
        taskDescription: 'Build a new feature for the app',
        contextLinks: ['https://docs.example.com'],
        requestedCompletionDate: '2024-12-31'
      };

      const result = await client.decomposesTask(request);
      expect(result.taskId).toBe('task-789');
      expect(result.summary).toBe('Decomposed task');
      expect(result.subtasks).toHaveLength(1);
    });
  });
});
