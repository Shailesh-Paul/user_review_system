export function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!base64) return null;
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isJwtExpired(payload) {
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now();
}
