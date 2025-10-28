import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BorrowService } from '../../../../core/services/borrow.service';
import { ReservationService } from '../../../../core/services/reservation.service';
import { FineService } from '../../../../core/services/fine.service';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';

interface ActivityItem {
  type: 'borrow' | 'reservation' | 'return';
  title: string;
  subtitle: string;
  time: string;
  color: string;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
  currentTime = new Date();
  currentUser: User | null = null;
  
  // Stats
  booksBorrowed = 0;
  seatReservations = 0;
  dueSoon = 0;
  totalFines = 0;
  
  // Activity
  recentActivity: ActivityItem[] = [];
  
  // Loading
  loading = true;

  constructor(
    private borrowService: BorrowService,
    private reservationService: ReservationService,
    private fineService: FineService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Get current user
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
    
    // Update time every minute
    setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
    
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    
    let borrowsLoaded = false;
    let reservationsLoaded = false;
    let finesLoaded = false;

    const checkAllLoaded = () => {
      if (borrowsLoaded && reservationsLoaded && finesLoaded) {
        this.loading = false;
      }
    };
    
    // Fetch all data in parallel
    this.borrowService.getMyBorrows().subscribe({
      next: (borrows) => {
        borrowsLoaded = true;
        
        if (borrows && Array.isArray(borrows)) {
          // Count active borrows
          this.booksBorrowed = borrows.filter(b => b.status === 'ACTIVE').length;
          
          // Count due soon (within 7 days)
          const now = new Date();
          const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          this.dueSoon = borrows.filter(b => {
            if (b.status !== 'ACTIVE') return false;
            const dueDate = new Date(b.dueDate);
            return dueDate <= in7Days && dueDate >= now;
          }).length;
          
          // Process borrows for activity
          this.processActivities(borrows);
        }
        
        checkAllLoaded();
      },
      error: (error) => {
        console.error('Error loading borrows:', error);
        borrowsLoaded = true;
        checkAllLoaded();
      }
    });

    this.reservationService.getMyReservations().subscribe({
      next: (response) => {
        reservationsLoaded = true;
        
        if (response && response.reservations && Array.isArray(response.reservations)) {
          // Count active reservations
          this.seatReservations = response.reservations.filter(
            r => r.status === 'PENDING' || r.status === 'APPROVED'
          ).length;
          
          // Process reservations for activity
          this.processReservationActivities(response.reservations);
        }
        
        checkAllLoaded();
      },
      error: (error) => {
        console.error('Error loading reservations:', error);
        reservationsLoaded = true;
        checkAllLoaded();
      }
    });

    this.fineService.getMyFines().subscribe({
      next: (fines) => {
        finesLoaded = true;
        
        if (fines && Array.isArray(fines)) {
          // Calculate total unpaid fines
          this.totalFines = fines
            .filter(f => f.status === 'PENDING')
            .reduce((sum, fine) => sum + fine.amount, 0);
        }
        
        checkAllLoaded();
      },
      error: (error) => {
        console.error('Error loading fines:', error);
        finesLoaded = true;
        checkAllLoaded();
      }
    });
  }

  processActivities(borrows: any[]) {
    const activities: ActivityItem[] = [];
    
    if (!borrows || !Array.isArray(borrows)) return;
    
    // Add borrow activities
    borrows.slice(0, 5).forEach(borrow => {
      if (borrow && borrow.book && borrow.book.title) {
        activities.push({
          type: 'borrow',
          title: `Borrowed "${borrow.book.title}"`,
          subtitle: `Due: ${new Date(borrow.dueDate).toLocaleDateString()}`,
          time: this.getRelativeTime(new Date(borrow.borrowDate)),
          color: 'from-indigo-50 to-purple-50'
        });
      }
    });
    
    // Add return activities for returned books
    borrows.filter(b => b && b.status === 'RETURNED' && b.book && b.book.title).slice(0, 2).forEach(borrow => {
      activities.unshift({
        type: 'return',
        title: `Returned "${borrow.book.title}"`,
        subtitle: borrow.returnDate ? `On: ${new Date(borrow.returnDate).toLocaleDateString()}` : 'On time',
        time: borrow.returnDate ? this.getRelativeTime(new Date(borrow.returnDate)) : '',
        color: 'from-emerald-50 to-teal-50'
      });
    });
    
    this.recentActivity = activities.slice(0, 3);
  }

  processReservationActivities(reservations: any[]) {
    if (this.recentActivity.length >= 3) return;
    if (!reservations || !Array.isArray(reservations)) return;
    
    reservations.slice(0, 2).forEach(reservation => {
      if (this.recentActivity.length >= 3) return;
      if (!reservation || !reservation.seat) return;
      
      this.recentActivity.push({
        type: 'reservation',
        title: `Reserved Seat #${reservation.seat?.seatNumber}`,
        subtitle: `${new Date(reservation.startTime).toLocaleTimeString()} - ${new Date(reservation.endTime).toLocaleTimeString()}`,
        time: this.getRelativeTime(new Date(reservation.createdAt)),
        color: 'from-purple-50 to-pink-50'
      });
    });
    
    this.recentActivity = this.recentActivity.slice(0, 3);
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  }
}
