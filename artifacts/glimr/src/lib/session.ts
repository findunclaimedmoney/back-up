export function getSessionId(personaId: string): string {
  const key = `companion_session_${personaId}`;
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}
