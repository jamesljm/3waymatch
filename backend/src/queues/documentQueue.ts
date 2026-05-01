import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config';

export enum ProcessingStage {
  CLASSIFYING = 'CLASSIFYING',
  EXTRACTING = 'EXTRACTING',
  RESOLVING = 'RESOLVING',
  SAVING = 'SAVING',
}

export interface DocumentJobData {
  documentId: string;
  filePath: string;
  originalFileName: string;
  attempt?: number;
}

let connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(config.redisUrl, { maxRetriesPerRequest: null });
  }
  return connection;
}

export const QUEUE_NAME = 'document-processing';

let queue: Queue<DocumentJobData> | null = null;

export function getDocumentQueue(): Queue<DocumentJobData> {
  if (!queue) {
    queue = new Queue<DocumentJobData>(QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 200 },
      },
    });
  }
  return queue;
}

export async function enqueueDocument(data: DocumentJobData): Promise<string> {
  const q = getDocumentQueue();
  const job = await q.add('process-document', data, {
    jobId: `doc-${data.documentId}`,
  });
  return job.id!;
}
