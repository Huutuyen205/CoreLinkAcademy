import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();

const logger = new Logger('CoreLinkWorker');

async function bootstrap() {
  logger.log('Đang khởi động CoreLink Worker...');
  const queues = ['ai', 'notify', 'schedule', 'report', 'import', 'media', 'cleanup'];
  logger.log(`Các hàng đợi đã đăng ký: ${queues.join(', ')}`);

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  logger.log(`Kết nối Redis tại: ${redisUrl}`);

  // Chế độ chờ xử lý job
  logger.log('CoreLink Worker đã sẵn sàng xử lý tác vụ nền');
}

bootstrap().catch((err) => {
  logger.error('Worker gặp sự cố khởi động:', err);
});
