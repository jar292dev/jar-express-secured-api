export interface RequestContext {
  actorId: string | null;
  actorEmail?: string;
  actorRole?: string;
  ipAddress?: string;
  userAgent?: string;
}
