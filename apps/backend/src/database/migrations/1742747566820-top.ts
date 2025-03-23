import { MigrationInterface, QueryRunner } from "typeorm";

export class Top1742747566820 implements MigrationInterface {
    name = 'Top1742747566820'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quiz_generation_tasks" ADD "title" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quiz_generation_tasks" DROP COLUMN "title"`);
    }

}
