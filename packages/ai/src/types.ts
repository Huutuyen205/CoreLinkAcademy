import { z } from 'zod';

export type AiFeature =
  | 'AI-01'
  | 'AI-02'
  | 'AI-03'
  | 'AI-04'
  | 'AI-05'
  | 'AI-06'
  | 'AI-07'
  | 'AI-08'
  | 'AI-09'
  | 'AI-10'
  | 'AI-11'
  | 'AI-12'
  | 'AI-13'
  | 'AI-14'
  | 'DAILY_SUMMARY';

export interface Msg {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface FileRef {
  fileId?: string;
  buffer?: Uint8Array;
  mimeType: string;
  name?: string;
}

export interface AiResult {
  text: string;
  json?: any;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  model: string;
  provider: string;
}

export interface AiChunk {
  delta: string;
  isComplete: boolean;
  citedChunkIds?: string[];
}

export interface AiGatewayGenerateRequest {
  feature: AiFeature;
  system: string;
  messages: Msg[];
  json?: z.ZodSchema<any>;
  maxTokens?: number;
  actorId?: string;
  entity?: { type: string; id: string };
  branchId?: string;
}

export interface AiGateway {
  generate(req: AiGatewayGenerateRequest): Promise<AiResult>;
  stream(req: AiGatewayGenerateRequest): AsyncIterable<AiChunk>;
  embed(texts: string[]): Promise<number[][]>;
  transcribe(file: FileRef, lang: 'en' | 'vi'): Promise<{ text: string; seconds: number }>;
  tts(text: string, voice: string): Promise<FileRef>;
  image(prompt: string): Promise<FileRef>;
}
