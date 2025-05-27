import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPurchaseDateToPortfolioItem1748339933328 implements MigrationInterface {
    name = 'AddPurchaseDateToPortfolioItem1748339933328'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolio_items" ADD "purchase_date" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "portfolio_items" DROP COLUMN "purchase_date"`);
    }

}
