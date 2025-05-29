import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNullableTickerToPortfolioItem1748485284379 implements MigrationInterface {
    name = 'AddNullableTickerToPortfolioItem1748485284379'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolio_items" ADD "ticker" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolio_items" DROP COLUMN "ticker"`);
    }

}
