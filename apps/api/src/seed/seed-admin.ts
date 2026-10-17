import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('--- KHỞI TẠO TÀI KHOẢN ADMIN ĐẦU TIÊN (SEED:ADMIN) ---');

  const defaultBranch = await prisma.branches.findFirst();
  if (!defaultBranch) {
    console.error('Lỗi: Chưa có cơ sở (branch) nào trong CSDL');
    process.exit(1);
  }

  const adminRole = await prisma.roles.findUnique({
    where: { code: 'admin' },
  });
  if (!adminRole) {
    console.error('Lỗi: Chưa có vai trò admin trong CSDL');
    process.exit(1);
  }

  const phone = process.env.ADMIN_PHONE || '+84999999999';
  const email = process.env.ADMIN_EMAIL || 'admin@corelink.edu.vn';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123456';

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const existing = await prisma.users.findFirst({
    where: {
      OR: [{ phone }, { email }, { username: 'admin' }],
    },
  });

  if (existing) {
    console.log(`Tài khoản Admin đã tồn tại (ID: ${existing.id}). Cập nhật mật khẩu...`);
    await prisma.users.update({
      where: { id: existing.id },
      data: {
        password_hash: passwordHash,
        status: 'active',
        failed_login_count: 0,
        locked_until: null,
        must_change_password: false,
      },
    });

    // Đảm bảo gán vai trò admin
    const hasRole = await prisma.user_roles.findUnique({
      where: {
        user_id_role_id: { user_id: existing.id, role_id: adminRole.id },
      },
    });
    if (!hasRole) {
      await prisma.user_roles.create({
        data: { user_id: existing.id, role_id: adminRole.id },
      });
    }

    console.log(`Đã cập nhật Admin thành công!`);
    console.log(`Đăng nhập: ${email} hoặc ${phone} / Mật khẩu: ${password}`);
    return;
  }

  const adminUser = await prisma.users.create({
    data: {
      branch_id: defaultBranch.id,
      full_name: 'Quản trị viên Hệ thống',
      phone,
      email,
      username: 'admin',
      password_hash: passwordHash,
      must_change_password: false,
      status: 'active',
    },
  });

  await prisma.user_roles.create({
    data: {
      user_id: adminUser.id,
      role_id: adminRole.id,
    },
  });

  // Tự động tạo bản ghi đồng ý xử lý dữ liệu cho Admin
  await prisma.consents.create({
    data: {
      user_id: adminUser.id,
      scope: 'data_processing',
      policy_version: 'v1.0',
    },
  });

  console.log('Tạo tài khoản Admin thành công:');
  console.log(`- ID: ${adminUser.id}`);
  console.log(`- Email: ${email}`);
  console.log(`- SĐT: ${phone}`);
  console.log(`- Mật khẩu: ${password}`);
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed Admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
