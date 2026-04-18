import { logoutSession } from './database';

export async function logout() {
  await logoutSession();
  window.location.reload();
}
