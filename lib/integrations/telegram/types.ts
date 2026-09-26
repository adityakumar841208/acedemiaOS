export interface TelegramDestination {
  id: string;
  name: string;
  chatId: string;
  departmentId?: string;
  semesterId?: string;
  batchId?: string;
  enabled: boolean;
}

export interface TelegramMessageResult {
  messageId: number;
  chatId: string;
}

export interface TelegramApiResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
  parameters?: {
    retry_after?: number;
  };
}
