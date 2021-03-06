import { ExtractStylesOptions } from './utils/ast/extractStyles';
import type { Volume } from 'memfs';

export interface CacheObject {
  [key: string]: any;
}

export interface LoaderOptions extends ExtractStylesOptions {
  cacheFile?: string;
}

export interface PluginContext {
  cacheFile: string | null;
  cacheObject: CacheObject;
  memoryFS: MemoryFS;
  fileList: Set<string>;
}

export type MemoryFS = InstanceType<typeof Volume>;
