import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { distributeCommissions } from '../modules/mlm/mlm.service.js';

let worker: Worker | null = null;

export const initializeMlmWorker = () => {
  if (!env.REDIS_URL) {
    logger.info('[Worker] No REDIS_URL found. MLM Background Worker not started.');
    return;
  }

  const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

  worker = new Worker('commission-queue', async (job: Job) => {
    const { agentId, amount, receiptNo } = job.data;
    logger.info(`[Worker] Executing background commission calculation for receipt ${receiptNo}`);
    
    // The intensive 5-level deep recursive DB insertion loop runs here in the background
    await distributeCommissions(agentId, amount, receiptNo);
    
  }, { connection });

  worker.on('completed', (job) => {
    logger.info(`[Worker] Successfully completed commission distribution for job: ${job?.id}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[Worker] Commission distribution failed for job ${job?.id}:`, err);
  });

  logger.info('[Worker] Background Commission Queue Worker initialized.');
};
