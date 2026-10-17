import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      try {
        await this.$executeRawUnsafe("SET time_zone = '+00:00';");
      } catch (tzErr) {
        this.logger.warn('Ghi chú thiết lập time_zone: ' + (tzErr as any)?.message);
      }
      this.logger.log('Đã kết nối MySQL thành công');
    } catch (error) {
      this.logger.error('Lỗi kết nối MySQL:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Đã ngắt kết nối MySQL');
  }
}
