import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Level } from './entity/level.entity';
import { LevelsController } from './levels.controller';
import { LevelsService } from './levels.service';
import { LevelsValidator } from './levels.validator';

@Module({
  imports: [TypeOrmModule.forFeature([Level])],
  controllers: [LevelsController],
  providers: [LevelsService, LevelsValidator],
})
export class LevelsModule {}
