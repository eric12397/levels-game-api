import { Injectable } from '@nestjs/common';
import { CreateLevelDto } from './dto/create-level.dto';

@Injectable()
export class LevelsValidator {
  private readonly validMoves: Set<number> = new Set<number>([0, 1, 2, 3]);

  validateCreateLevelRequest(dto: CreateLevelDto): string {
    if (!dto) return 'Missing request body.';
    if (!dto.map) return 'Missing map property in request body.';

    const { map } = dto;
    const firstRowLength = map[0].length;

    for (let row = 0; row < map.length; row++) {
      // Maps can not be larger than 100 in any dimension
      if (map.length > 100) return 'Maps cannot have more than 100 rows.';
      if (map[row].length > 100) return 'Maps cannot have more than 100 columns.';

      // Maps must be rectangular
      if (map[row].length !== firstRowLength) return 'Maps must be rectangular in size.';

      for (let col = 0; col < map[row].length; col++) {
        // Map spaces can not use values other than the numbers 0-3 above
        if (!this.validMoves.has(map[row][col]))
          return 'Maps can only have the following values: 0,1,2,3';
      }
    }

    return null;
  }
}
