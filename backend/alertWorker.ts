import 'dotenv/config';
import cron from 'node-cron';
import alertEngine from './services/alertEngine';
import logger from './utils/logger';
import { config } from './config';

const schedule = '0 * * * *';

const startWorker = async () => {
    logger.info('🚀 Starting alert worker');

    if (config.NODE_ENV === 'test') {
        logger.info('Alert worker disabled in test environment');
        return;
    }

    cron.schedule(schedule, async () => {
        logger.info('Running scheduled alert engine from worker...');
        try {
            await alertEngine.runAlertEngine();
        } catch (error: any) {
            logger.error('Alert engine worker error', { error: error.message });
        }
    });

    setTimeout(async () => {
        logger.info('Running initial alert engine check from worker...');
        try {
            await alertEngine.runAlertEngine();
        } catch (error: any) {
            logger.error('Initial alert engine startup error', { error: error.message });
        }
    }, 30000);
};

startWorker().catch((error: any) => {
    logger.error('Failed to start alert worker', { error: error?.message || error });
    process.exit(1);
});
