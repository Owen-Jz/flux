import { describe, it, expect } from 'vitest';
import { isWorkspaceMember, hasRole } from '../lib/workspace-utils';

describe('isWorkspaceMember', () => {
  it('returns member object when user is found in workspace.members', () => {
    const workspace = {
      members: [
        { userId: { toString: () => 'user-123' }, role: 'ADMIN' },
        { userId: { toString: () => 'user-456' }, role: 'EDITOR' },
      ],
    };
    const result = isWorkspaceMember(workspace, 'user-123');
    expect(result).toEqual({ userId: { toString: expect.any(Function) }, role: 'ADMIN' });
    expect(result?.userId.toString()).toBe('user-123');
  });

  it('returns undefined when user is not found', () => {
    const workspace = {
      members: [
        { userId: { toString: () => 'user-123' }, role: 'ADMIN' },
        { userId: { toString: () => 'user-456' }, role: 'EDITOR' },
      ],
    };
    const result = isWorkspaceMember(workspace, 'user-999');
    expect(result).toBeUndefined();
  });

  it('handles empty members array', () => {
    const workspace = { members: [] };
    const result = isWorkspaceMember(workspace, 'user-123');
    expect(result).toBeUndefined();
  });

  it('handles undefined members', () => {
    const workspace = { members: undefined };
    const result = isWorkspaceMember(workspace, 'user-123');
    expect(result).toBeUndefined();
  });

  it('handles workspace with no members property', () => {
    const workspace = {};
    const result = isWorkspaceMember(workspace, 'user-123');
    expect(result).toBeUndefined();
  });
});

describe('hasRole', () => {
  const roles = ['ADMIN', 'EDITOR', 'VIEWER'];

  describe.each(roles)('with role %s', (role) => {
    it('returns true when member has the specified role', () => {
      const member = { role };
      expect(hasRole(member, ...roles)).toBe(true);
    });

    it('returns true when member has one of multiple specified roles', () => {
      const member = { role };
      expect(hasRole(member, 'ADMIN', 'EDITOR', 'VIEWER')).toBe(true);
    });
  });

  it('returns false when member has none of the specified roles', () => {
    const member = { role: 'GUEST' };
    expect(hasRole(member, 'ADMIN', 'EDITOR', 'VIEWER')).toBe(false);
  });

  it('returns false when member has no role property', () => {
    const member = {};
    expect(hasRole(member, 'ADMIN', 'EDITOR', 'VIEWER')).toBe(false);
  });

  it('handles null member', () => {
    expect(hasRole(null, 'ADMIN', 'EDITOR', 'VIEWER')).toBe(false);
  });

  it('handles undefined member', () => {
    expect(hasRole(undefined, 'ADMIN', 'EDITOR', 'VIEWER')).toBe(false);
  });
});
