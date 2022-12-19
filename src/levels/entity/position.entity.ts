export class Position {
  constructor(
    public row: number,
    public col: number,
    public prevCoordinates: string,
    public directionFromPrevPosition: number,
  ) {}
}
