export interface Table {
  id: string;
  tournament_id: string;
  table_number: number;
  table_name: string | null;
  max_seats: number;
  is_active: boolean;
}

export interface SeatAssignment {
  table_id: string;
  table_number: number;
  seat_number: number;
  player_id: string;
  player_name: string;
}
