import { NamingStrategyInterface, DefaultNamingStrategy } from 'typeorm';

/**
 * TypeORM CamelCaseNamingStrategy
 * 
 * Problem: Entities use camelCase field names but database uses snake_case columns.
 * 
 * Strategy: When @Column has explicit `name: 'xxx'`, use that.
 * When no explicit name: use property name converted to snake_case.
 * 
 * This ensures all queries map camelCase fields -> snake_case columns automatically.
 */
export class CamelCaseNamingStrategy extends DefaultNamingStrategy {
  columnName(
    propertyName: string,
    customName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _embeddedPrefixes: any[],
  ): string {
    // If @Column({ name: 'xxx' }) is specified, use that
    if (customName) return customName;
    // Otherwise, convert camelCase to snake_case for DB
    return this.toSnakeCase(propertyName);
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    // Use the referenced column name (from @JoinColumn({ name: 'xxx' }))
    // If no explicit name, convert relation name to snake_case
    return this.toSnakeCase(referencedColumnName || relationName);
  }

  joinTableName(firstTableName: string, secondTableName: string): string {
    return `${this.toSnakeCase(firstTableName)}_${this.toSnakeCase(secondTableName)}`;
  }

  joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName: string,
  ): string {
    // Use the column name from the referenced side
    return columnName ? columnName : this.toSnakeCase(propertyName);
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }
}
