import { Injectable, Scope } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';

@Injectable({
  scope: Scope.REQUEST, // <-- VERY IMPORTANT to create one instance per request
})
export class UnitOfWorkService {
  private manager: EntityManager;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  getManager(): EntityManager {
    return this.manager;
  }

  async doTransactional<T>(
    fn: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return await this.dataSource.transaction(async (manager) => {
      this.manager = manager;
      return fn(manager);
    });
  }
}
