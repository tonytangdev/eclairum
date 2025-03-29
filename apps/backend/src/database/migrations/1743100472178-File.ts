import { MigrationInterface, QueryRunner } from 'typeorm';

export class File1743100472178 implements MigrationInterface {
  name = 'File1743100472178';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "files" ("id" uuid NOT NULL, "path" text NOT NULL, "bucketName" text NOT NULL, "quizGenerationTaskId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "REL_68f07fc8fb0d258ced03fb223d" UNIQUE ("quizGenerationTaskId"), CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_generation_tasks" ADD "fileId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_generation_tasks" ADD CONSTRAINT "UQ_0d2038ec7dcbbadfdf3fec3b33c" UNIQUE ("fileId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD CONSTRAINT "FK_68f07fc8fb0d258ced03fb223d0" FOREIGN KEY ("quizGenerationTaskId") REFERENCES "quiz_generation_tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_generation_tasks" ADD CONSTRAINT "FK_0d2038ec7dcbbadfdf3fec3b33c" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_generation_tasks" DROP CONSTRAINT "FK_0d2038ec7dcbbadfdf3fec3b33c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT "FK_68f07fc8fb0d258ced03fb223d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_generation_tasks" DROP CONSTRAINT "UQ_0d2038ec7dcbbadfdf3fec3b33c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_generation_tasks" DROP COLUMN "fileId"`,
    );
    await queryRunner.query(`DROP TABLE "files"`);
  }
}
