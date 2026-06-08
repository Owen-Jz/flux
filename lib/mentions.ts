/**
 * Mention chip helpers.
 *
 * The comment composer stores mentions inline as opaque chip tokens:
 *   - `@[user:<24-hex-objectid>]`  — a workspace member
 *   - `@[subtask:<id>]`            — a subtask on the same task
 *
 * The rich React renderer (task-detail-modal) turns these into styled chips.
 * But anywhere we surface the *raw* comment text outside that renderer —
 * notification emails, push notification snippets, plain-text previews — the
 * tokens must be converted to human-readable labels first, otherwise the user
 * sees the literal `@[user:6a17...]` string. This module is the single source
 * of truth for that conversion and is safe to import on the server (no React).
 */

// `gi` so multiple mentions in one comment are all replaced. 24-hex objectid.
const USER_CHIP_REGEX = /@\[user:([a-f\d]{24})\]/gi;
// Subtask ids are not constrained to hex, so match anything up to the closing
// bracket. The explicit `subtask:` prefix keeps this from eating user chips.
const SUBTASK_CHIP_REGEX = /@\[subtask:([^\]]+)\]/g;

type NameLookup =
    | Map<string, string | null | undefined>
    | Record<string, string | null | undefined>;

function lookup(source: NameLookup, key: string): string | null | undefined {
    return source instanceof Map ? source.get(key) : source[key];
}

/**
 * Replace composer chip tokens with readable plain text.
 *   `@[user:<id>]`    -> `@Name`        (or `@someone` when the name is unknown)
 *   `@[subtask:<id>]` -> `"Subtask title"` (or `a subtask` when unknown)
 *
 * @param content            Raw comment/reply text as stored.
 * @param userNamesById      Map/record of userId -> display name.
 * @param subtaskTitlesById  Map/record of subtaskId -> title (optional).
 */
export function renderMentionsToPlainText(
    content: string,
    userNamesById: NameLookup = {},
    subtaskTitlesById: NameLookup = {},
): string {
    if (!content) return content;
    return content
        .replace(USER_CHIP_REGEX, (_match, id: string) => {
            const name = lookup(userNamesById, id);
            return name ? `@${name}` : '@someone';
        })
        .replace(SUBTASK_CHIP_REGEX, (_match, id: string) => {
            const title = lookup(subtaskTitlesById, id);
            return title ? `"${title}"` : 'a subtask';
        });
}

/** Extract the userIds referenced by `@[user:<id>]` chips in `content`. */
export function extractUserChipIds(content: string): string[] {
    if (!content) return [];
    const ids: string[] = [];
    let match: RegExpExecArray | null;
    USER_CHIP_REGEX.lastIndex = 0;
    while ((match = USER_CHIP_REGEX.exec(content)) !== null) {
        ids.push(match[1]);
    }
    return Array.from(new Set(ids));
}
