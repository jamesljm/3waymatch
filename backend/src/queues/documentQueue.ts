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

function createRedisConnection(): IORedis {
  const conn = new IORedis(config.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  conn.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });
  return conn;
}

// BullMQ requires separate connections for Queue and Worker
export function getWorkerConnection(): IORedis {
  return createRedisConnection();
}

export const QUEUE_NAME = 'document-processing';

let queue: Queue<DocumentJobData> | null = null;

export function getDocumentQueue(): Queue<DocumentJobData> {
  if (!queue) {
    queue = new Queue<DocumentJobData>(QUEUE_NAME, {
      connection: createRedisConnection(),
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
