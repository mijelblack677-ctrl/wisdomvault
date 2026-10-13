export const prerender = false;

import type { APIRoute } from 'astro';
import { requireVaultPro, jsonResponse } from '@lib/vaultproAuth';

export const GET: APIRoute = async ({ request }) => {
  try {
    const admin = await requireVaultPro(request);
    return jsonResponse({ success: true, admin });
  } catch (error) {
    if (error instanceof Response) return error;
    return jsonResponse({ success: false, message: (error as Error).message }, 500);
  }
};