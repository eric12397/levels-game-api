import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Level {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { array: true })
  map: number[][];

  @Column()
  player_row_pos: number;

  @Column()
  player_col_pos: number;
}
