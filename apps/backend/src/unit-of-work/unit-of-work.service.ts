import { Injectable, Scope } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';

@Injectable({
  scope: Scope.REQUEST, // <-- VERY IMPORTANT to create one instance per request
})
export class UnitOfWorkService {
  private manager: EntityManager;
  private isInTransaction = false;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    // Initialize the manager in the constructor
    this.manager = this.dataSource.manager;
  }

  getManager(): EntityManager {
    return this.manager;
  }

  async doTransactional<T>(
    fn: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    if (this.isInTransaction) {
      // Already in a transaction, use current manager
      return fn(this.manager);
    }

    try {
      this.isInTransaction = true;
      return await this.dataSource.transaction(async (manager) => {
        this.manager = manager;
        return fn(manager);
      });
    } finally {
      // Reset back to the default manager when transaction is done
      this.isInTransaction = false;
      this.manager = this.dataSource.manager;
    }
  }
}
