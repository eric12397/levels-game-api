import { Injectable } from '@nestjs/common';
import { LevelsValidator } from './levels.validator';
import { Level } from './entity/level.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateLevelDto } from './dto/create-level.dto';
import { Position } from './entity/position.entity';

@Injectable()
export class LevelsService {
  constructor(
    @InjectRepository(Level) private readonly levelRepository: Repository<Level>,
    private readonly levelValidator: LevelsValidator,
    private dataSource: DataSource,
  ) {}

  public getLevel(levelId: number): Promise<Level> {
    return this.levelRepository.findOne({ where: { id: levelId } });
  }

  public createLevel(createLevelDto: CreateLevelDto): Promise<Level> {
    const errorMsg = this.levelValidator.validateCreateLevelRequest(createLevelDto);
    if (errorMsg) {
      throw new Error(errorMsg);
    }

    // Find the player's starting position on the map
    const { map } = createLevelDto;
    let playerStartRow = 0;
    let playerStartCol = 0;
    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        if (map[row][col] === 2) {
          playerStartRow = row;
          playerStartCol = col;
        }
      }
    }

    // Save map into DB
    const newLevel = new Level();
    newLevel.map = createLevelDto.map;
    newLevel.player_row_pos = playerStartRow;
    newLevel.player_col_pos = playerStartCol;
    return this.levelRepository.save(newLevel);
  }

  public async movePlayer(levelId: number, direction: number): Promise<number[][]> {
    let updatedLevel: Level;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    // Create transaction scope here.
    await queryRunner.startTransaction();
    try {
      // Equivalent of using SELECT.. FOR UPDATE query in Postgres. Locks row to prevent concurrent updates.
      const level = await queryRunner.manager
        .getRepository(Level)
        .createQueryBuilder('level')
        .setLock('pessimistic_write')
        .where('level.id = :id', { id: levelId })
        .getOne();

      const { map, player_row_pos, player_col_pos } = level;

      // Map direction to new coordinates.
      const directions = [
        [0, -1], // 0 - left
        [-1, 0], // 1 - up
        [0, 1], // 2 - right
        [1, 0], // 3 - down
      ];
      const [dx, dy] = directions[direction];
      const newRow = player_row_pos + dx;
      const newCol = player_col_pos + dy;

      // Throw error if move goes out of bounds of map.
      if (newRow < 0 || newCol < 0 || newRow >= map.length || newCol >= map[0].length)
        throw new Error('Invalid move: You went out of bounds.');

      // Throw error if move hits wall.
      if (map[newRow][newCol] === 1) throw new Error('Invalid move: You hit a wall.');

      level.map[newRow][newCol] = 2;
      level.map[player_row_pos][player_col_pos] = 0;
      level.player_row_pos = newRow;
      level.player_col_pos = newCol;

      updatedLevel = await queryRunner.manager.getRepository(Level).save(level);
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new Error(err.message);
    } finally {
      await queryRunner.release();
    }
    return updatedLevel.map;
  }

  public async findShortestSolution(levelId: number): Promise<number[]> {
    const { map, player_row_pos, player_col_pos } = await this.getLevel(levelId);

    const directions = [
      [0, -1], // 0 - left
      [-1, 0], // 1 - up
      [0, 1], // 2 - right
      [1, 0], // 3 - down
    ];

    const playerStartPos = new Position(player_row_pos, player_col_pos, null, null);
    const queue = [playerStartPos];
    const visited = new Map<string, Position>();
    visited.set(playerStartPos.row + ',' + playerStartPos.col, playerStartPos);

    // Start BFS here.
    while (queue.length > 0) {
      const { row, col } = queue.shift();
      const adj: Position[] = []; // store open adjacent positions here

      for (let i = 0; i < directions.length; i++) {
        // Look at neighbors in up, down, right, and left directions.
        const [dx, dy] = directions[i];
        const newRow = row + dx;
        const newCol = col + dy;

        // Skip if out of bounds.
        if (newRow < 0 || newRow >= map.length || newCol < 0 || newCol >= map[0].length) {
          continue;
        }

        // Skip if wall.
        if (map[newRow][newCol] === 1) {
          continue;
        }

        // Reached the exit.
        if (map[newRow][newCol] === 3) {
          const playerEndPos = new Position(newRow, newCol, row + ',' + col, i);
          return this.constructPath(visited, playerStartPos, playerEndPos);
        }

        // Open position.
        if (map[newRow][newCol] === 0) {
          const playerNewPos = new Position(newRow, newCol, row + ',' + col, i);
          adj.push(playerNewPos);
        }
      }

      for (const pos of adj) {
        const key = pos.row + ',' + pos.col;
        if (!visited.has(key)) {
          visited.set(key, pos); // mark as "visited"
          queue.push(pos); // keep BFS going
        }
      }
    }

    return [];
  }

  private constructPath(visited: Map<string, Position>, start: Position, end: Position): number[] {
    const path = [end.directionFromPrevPosition];

    // Reconstruct path using the ending position's prevCoordinates, then work our way backwards to the starting position
    while (end.prevCoordinates !== null) {
      const prevPos: Position = visited.get(end.prevCoordinates);
      path.push(prevPos.directionFromPrevPosition);
      end = prevPos;
    }
    path.pop();
    path.reverse();
    return path;
  }
}
