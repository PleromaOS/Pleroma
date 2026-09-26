// What a door says when it refuses. `code` is the door's reason, e.g.
// "email_required_first"; lib/messages.ts turns it into words for the client.
export class DoorError extends Error {
  constructor(public code: string, public status: number) {
    super(code);
  }
}
