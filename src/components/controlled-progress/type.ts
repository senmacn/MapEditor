export interface ProgressMessage {
  type: 'error' | 'success';
  content: string;
}

export interface ProgressEventPayload {
  type: 'start' | 'progress';
  count?: number;
  message?: ProgressMessage;
}
