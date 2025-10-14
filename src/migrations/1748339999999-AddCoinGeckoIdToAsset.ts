import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCoinGeckoIdToAsset1748339999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'asset',
      new TableColumn({
        name: 'coinGeckoId',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('asset', 'coinGeckoId');
  }
}
