import { Types } from 'mongoose';
import type { QueryFilter } from 'mongoose';
import type { BoardVisibility, IBoard } from '@/models/Board';

/**
 * Board-level access control.
 *
 * Visibility model:
 *  - WORKSPACE  → every workspace member can see the board. This is the default and
 *                 the implicit behaviour of legacy boards that predate this field.
 *  - RESTRICTED → only users listed in `memberIds`, plus workspace ADMINs, can see it.
 *
 * Workspace membership is a prerequisite for any access — these helpers assume the
 * caller has already resolved the user's membership via `isWorkspaceMember`.
 */

interface BoardAccessShape {
    visibility?: BoardVisibility;
    memberIds?: Array<{ toString(): string }>;
}

interface MemberShape {
    role?: string;
}

/**
 * Whether a specific board is visible to a given workspace member.
 *
 * @param board   Board document (or lean object) exposing `visibility` and `memberIds`.
 * @param userId  The acting user's id (string). May be null for unauthenticated callers.
 * @param member  The user's workspace membership, or null/undefined if not a member.
 */
export function canAccessBoard(
    board: BoardAccessShape,
    userId: string | null | undefined,
    member: MemberShape | null | undefined,
): boolean {
    // Non-members never have board access through this check. Public-access
    // workspaces are handled explicitly by callers via `canGuestAccessBoard`,
    // which only ever exposes WORKSPACE boards to guests.
    if (!member) {
        return false;
    }
    // Open boards are visible to every member.
    if (board.visibility !== 'RESTRICTED') {
        return true;
    }
    // Admins always retain oversight of every board.
    if (member.role === 'ADMIN') {
        return true;
    }
    if (!userId) {
        return false;
    }
    return (board.memberIds ?? []).some((id) => id.toString() === userId);
}

/**
 * Whether a public/guest viewer (non-member of a public-access workspace) may see a board.
 * Guests only ever see open boards, never restricted ones.
 */
export function canGuestAccessBoard(board: BoardAccessShape): boolean {
    return board.visibility !== 'RESTRICTED';
}

/**
 * A Mongo filter fragment that narrows a board query to the boards a user may see.
 * Merge it into a `Board.find({ workspaceId, ...filter })` query.
 *
 * - Admins see every board (empty fragment).
 * - Everyone else sees open boards plus restricted boards they're a member of.
 */
export function boardVisibilityFilter(
    userId: string | null | undefined,
    member: MemberShape | null | undefined,
): QueryFilter<IBoard> {
    if (member?.role === 'ADMIN') {
        return {};
    }

    const clauses: QueryFilter<IBoard>[] = [{ visibility: { $ne: 'RESTRICTED' } }];
    if (userId && Types.ObjectId.isValid(userId)) {
        clauses.push({ memberIds: new Types.ObjectId(userId) });
    }

    return { $or: clauses };
}
