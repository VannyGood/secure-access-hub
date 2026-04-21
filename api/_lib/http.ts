export type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  query?: Record<string, string | string[]>;
};

export type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

export function allowJson(res: ApiResponse) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
}

