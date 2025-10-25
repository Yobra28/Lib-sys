/* eslint-disable prettier/prettier */
export interface UserStatsDto {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: {
    admin: number;
    librarian: number;
    student: number;
  };
}