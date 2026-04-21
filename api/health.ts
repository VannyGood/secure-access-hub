import type { ApiRequest, ApiResponse } from './_lib/http';
import { allowJson } from './_lib/http';

export default function handler(_req: ApiRequest, res: ApiResponse) {
  allowJson(res);
  res.status(200).json({ ok: true });
}

