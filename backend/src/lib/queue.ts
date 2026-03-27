import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { distributeCommissions } from '../modules/mlm/mlm.service.js';

// BullMQ requires maxRetriesPerRequest set to null
const connection = env.REDIS_URL ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: null }) : null;

export const commissionQueue = connection ? new Queue('commission-queue', { connection }) : null;

/**
 * Pushes a commission calculation job to the background queue.
 * If Redis/BullMQ is unavailable, it gracefully degrades to synchronous execution.
 */
export const addCommissionJob = async (agentId: string, amount: number, receiptNo: string): Promise<void> => {
  if (commissionQueue) {
    try {
      await commissionQueue.add(
        'distribute', 
        { agentId, amount, receiptNo }, 
        {
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 }
        }
      );
      logger.info(`[Queue] Added commission job for receipt ${receiptNo}`);
    } catch (error) {
      logger.error('[Queue] Failed to add to BullMQ, falling back to sync execution:', error);
      await distributeCommissions(agentId, amount, receiptNo);
    }
  } else {
    logger.warn('[Queue] Redis unavailable. Processing commission synchronously.');
    await distributeCommissions(agentId, amount, receiptNo);
  }
};
