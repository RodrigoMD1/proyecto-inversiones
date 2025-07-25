import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSubscriptionsAndPaymentsTables1753415278805 implements MigrationInterface {
    name = 'CreateSubscriptionsAndPaymentsTables1753415278805'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_plan_enum" AS ENUM('free', 'premium')`);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('active', 'cancelled', 'expired', 'pending')`);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" SERIAL NOT NULL, "plan" "public"."subscriptions_plan_enum" NOT NULL DEFAULT 'free', "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'active', "expires_at" TIMESTAMP, "mercadopago_subscription_id" character varying, "asset_limit" integer NOT NULL DEFAULT '10', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'approved', 'rejected', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" SERIAL NOT NULL, "mercadopago_payment_id" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending', "preference_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, "subscription_id" integer, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_427785468fb7d2733f59e7d7d39" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_75848dfef07fd19027e08ca81d2" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_75848dfef07fd19027e08ca81d2"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_427785468fb7d2733f59e7d7d39"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_d0a95ef8a28188364c546eb65c1"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_plan_enum"`);
    }

}
