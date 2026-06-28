import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget, BudgetExpense, BudgetAdjustment, AnnualBudget, BudgetAllocation } from './entities/budget.entity';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';

@Module({
  imports: [TypeOrmModule.forFeature([Budget, BudgetExpense, BudgetAdjustment, AnnualBudget, BudgetAllocation])],
  controllers: [BudgetController],
  providers: [BudgetService],
  exports: [BudgetService],
})
export class BudgetModule {}
