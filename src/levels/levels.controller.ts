import { Body, Controller, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { CreateLevelDto } from './dto/create-level.dto';
import { LevelsService } from './levels.service';

@Controller('levels')
export class LevelsController {
  constructor(private readonly levelService: LevelsService) {}

  @Post('/submit')
  async createLevel(@Body() createLevelDto: CreateLevelDto) {
    try {
      return this.levelService.createLevel(createLevelDto);
    } catch (e: unknown) {
      if (e instanceof Error) return new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('/move')
  async movePlayer(@Body('levelId') levelId: number, @Body('direction') direction: number) {
    try {
      return await this.levelService.movePlayer(levelId, direction);
    } catch (e: unknown) {
      if (e instanceof Error) return new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('/:id/solution')
  findShortestSolution(@Param('id') levelId: number) {
    return this.levelService.findShortestSolution(levelId);
  }

  @Get('/:id')
  getLevel(@Param('id') levelId: number) {
    return this.levelService.getLevel(levelId);
  }
}

// [
// [1,1,1,3,1],
// [1,0,0,0,1],
// [1,2,1,0,1],
// [1,0,0,0,1],
// [1,1,1,1,1],
// ]
