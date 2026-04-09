export function isWorkspaceMember(workspace: { members?: { userId?: { toString: () => string } }[] }, userId: string) {
  return workspace.members?.find((m) => m.userId?.toString() === userId);
}

export function hasRole(member: { role?: string } | null | undefined, ...roles: string[]): boolean {
  return !!member && roles.includes(member.role as string);
}
