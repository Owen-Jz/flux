import { describe, it, expect } from 'vitest';
import { Types } from 'mongoose';
import { canAccessBoard, canGuestAccessBoard, boardVisibilityFilter } from '../lib/board-access';

const ADMIN = { role: 'ADMIN' };
const EDITOR = { role: 'EDITOR' };
const VIEWER = { role: 'VIEWER' };

describe('canAccessBoard', () => {
    it('grants access to an open (WORKSPACE) board for any member', () => {
        const board = { visibility: 'WORKSPACE' as const, memberIds: [] };
        expect(canAccessBoard(board, 'user-1', VIEWER)).toBe(true);
        expect(canAccessBoard(board, 'user-1', EDITOR)).toBe(true);
        expect(canAccessBoard(board, 'user-1', ADMIN)).toBe(true);
    });

    it('treats a board with undefined visibility as open (legacy boards)', () => {
        const board = { memberIds: [] };
        expect(canAccessBoard(board, 'user-1', VIEWER)).toBe(true);
    });

    it('denies a restricted board to a non-listed member', () => {
        const board = {
            visibility: 'RESTRICTED' as const,
            memberIds: [{ toString: () => 'user-2' }],
        };
        expect(canAccessBoard(board, 'user-1', VIEWER)).toBe(false);
        expect(canAccessBoard(board, 'user-1', EDITOR)).toBe(false);
    });

    it('grants a restricted board to a listed member', () => {
        const board = {
            visibility: 'RESTRICTED' as const,
            memberIds: [{ toString: () => 'user-1' }, { toString: () => 'user-2' }],
        };
        expect(canAccessBoard(board, 'user-1', VIEWER)).toBe(true);
    });

    it('always grants a restricted board to an admin, even when not listed', () => {
        const board = {
            visibility: 'RESTRICTED' as const,
            memberIds: [{ toString: () => 'someone-else' }],
        };
        expect(canAccessBoard(board, 'admin-1', ADMIN)).toBe(true);
    });

    it('denies access to a non-member regardless of visibility', () => {
        const open = { visibility: 'WORKSPACE' as const, memberIds: [] };
        const restricted = { visibility: 'RESTRICTED' as const, memberIds: [] };
        expect(canAccessBoard(open, 'user-1', null)).toBe(false);
        expect(canAccessBoard(restricted, 'user-1', undefined)).toBe(false);
    });

    it('denies a restricted board when userId is missing', () => {
        const board = {
            visibility: 'RESTRICTED' as const,
            memberIds: [{ toString: () => 'user-1' }],
        };
        expect(canAccessBoard(board, null, VIEWER)).toBe(false);
    });
});

describe('canGuestAccessBoard', () => {
    it('lets guests see open boards', () => {
        expect(canGuestAccessBoard({ visibility: 'WORKSPACE' })).toBe(true);
        expect(canGuestAccessBoard({})).toBe(true);
    });

    it('never lets guests see restricted boards', () => {
        expect(canGuestAccessBoard({ visibility: 'RESTRICTED' })).toBe(false);
    });
});

describe('boardVisibilityFilter', () => {
    it('returns an empty filter for admins (sees all boards)', () => {
        expect(boardVisibilityFilter('admin-1', ADMIN)).toEqual({});
    });

    it('returns an $or of open boards and own restricted boards for non-admins', () => {
        const userId = new Types.ObjectId().toString();
        const filter = boardVisibilityFilter(userId, EDITOR) as {
            $or: Array<Record<string, unknown>>;
        };
        expect(filter.$or).toHaveLength(2);
        expect(filter.$or[0]).toEqual({ visibility: { $ne: 'RESTRICTED' } });
        // Second clause matches restricted boards the user belongs to.
        const memberClause = filter.$or[1] as { memberIds: Types.ObjectId };
        expect(memberClause.memberIds.toString()).toBe(userId);
    });

    it('omits the member clause when there is no valid user id', () => {
        const filter = boardVisibilityFilter(null, null) as {
            $or: Array<Record<string, unknown>>;
        };
        expect(filter.$or).toHaveLength(1);
        expect(filter.$or[0]).toEqual({ visibility: { $ne: 'RESTRICTED' } });
    });

    it('omits the member clause for an invalid (non-ObjectId) user id', () => {
        const filter = boardVisibilityFilter('not-an-object-id', VIEWER) as {
            $or: Array<Record<string, unknown>>;
        };
        expect(filter.$or).toHaveLength(1);
    });
});
