import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20251125160809 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "chat_message" ("id" text not null, "order_id" text not null, "sender_type" text check ("sender_type" in ('customer', 'admin')) not null, "content" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "chat_message_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_chat_message_deleted_at" ON "chat_message" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "chat_message" cascade;`);
  }

}
