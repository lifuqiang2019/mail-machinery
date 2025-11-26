import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251125200000 extends Migration {

  override async up(): Promise<void> {
    // 确保之前的表被清理
    this.addSql(`drop table if exists "message" cascade;`);
    this.addSql(`drop table if exists "chat_message" cascade;`);

    // 重新创建符合当前模型的 message 表
    // 注意：user_id 字段必须有，且 metadata 字段必须有
    this.addSql(`
      create table if not exists "message" (
        "id" text not null, 
        "order_id" text null, 
        "user_id" text not null, 
        "sender_type" text check ("sender_type" in ('customer', 'admin', 'system')) not null, 
        "content" text not null, 
        "metadata" jsonb null,
        "created_at" timestamptz not null default now(), 
        "updated_at" timestamptz not null default now(), 
        "deleted_at" timestamptz null, 
        constraint "message_pkey" primary key ("id")
      );
    `);
    
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_message_deleted_at" ON "message" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_message_user_id" ON "message" ("user_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "message" cascade;`);
  }

}

