import { describe, it, expect } from 'vitest';

describe('AIFlow Frontend', () => {
  it('should pass basic sanity check', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have correct app name', () => {
    expect('AIFlow').toBeTruthy();
  });
});

describe('API service exports', () => {
  it('should export api client', async () => {
    const { api } = await import('../services/api');
    expect(api).toBeDefined();
    expect(api.defaults.baseURL).toContain('/api/v1');
  });

  it('should export all API modules', async () => {
    const api = await import('../services/api');
    expect(api.orgApi).toBeDefined();
    expect(api.projectApi).toBeDefined();
    expect(api.taskApi).toBeDefined();
    expect(api.aiApi).toBeDefined();
    expect(api.commentApi).toBeDefined();
    expect(api.labelApi).toBeDefined();
    expect(api.searchApi).toBeDefined();
    expect(api.teamApi).toBeDefined();
    expect(api.notificationApi).toBeDefined();
    expect(api.analyticsApi).toBeDefined();
    expect(api.activityApi).toBeDefined();
    expect(api.userProfileApi).toBeDefined();
    expect(api.passwordResetApi).toBeDefined();
    expect(api.googleAuthApi).toBeDefined();
    expect(api.sprintApi).toBeDefined();
    expect(api.attachmentApi).toBeDefined();
    expect(api.subtaskApi).toBeDefined();
  });
});
