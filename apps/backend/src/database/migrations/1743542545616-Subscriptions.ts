import { MigrationInterface, QueryRunner } from 'typeorm';

export class Subscriptions1743542545616 implements MigrationInterface {
  name = 'Subscriptions1743542545616';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("id" character varying NOT NULL, "userId" character varying NOT NULL, "stripeCustomerId" character varying NOT NULL, "stripeSubscriptionId" character varying NOT NULL, "stripePriceId" character varying NOT NULL, "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'incomplete', "currentPeriodStart" TIMESTAMP NOT NULL, "currentPeriodEnd" TIMESTAMP, "cancelAtPeriodEnd" boolean, "canceledAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2b708d303a3196a61cc88d08931" UNIQUE ("stripeSubscriptionId"), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_fbdba4e2ac694cf8c9cecf4dc84" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_fbdba4e2ac694cf8c9cecf4dc84"`,
    );
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
  }
}
