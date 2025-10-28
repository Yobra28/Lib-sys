import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { SeatService } from '../../../../core/services/seat.service';
import { ReservationService } from '../../../../core/services/reservation.service';
import { Seat } from '../../../../core/models/seat.model';

@Component({
  selector: 'app-seat-reservation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatPaginatorModule
  ],
  template: `
    <div class="p-6">
      <h1 class="text-3xl font-bold text-gray-800 mb-6">Reserve a Seat</h1>

      <!-- Reservation Form -->
      <mat-card class="mb-6">
        <mat-card-header>
          <mat-card-title>Select Date & Time</mat-card-title>
        </mat-card-header>
        <mat-card-content class="pt-4">
          <form [formGroup]="reservationForm">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Reservation Date</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="reservationDate" [min]="minDate">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-error *ngIf="reservationForm.get('reservationDate')?.hasError('required')">
                  Date is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Time Slot</mat-label>
                <mat-select formControlName="slot">
                  <mat-option *ngFor="let slot of slots" [value]="slot.label">
                    {{slot.label}}
                  </mat-option>
                </mat-select>
                <mat-error>Time slot is required</mat-error>
              </mat-form-field>
            </div>

            <div class="mt-4">
              <button mat-raised-button color="primary" 
                      [disabled]="reservationForm.invalid || checking"
                      (click)="checkAvailability()">
                <mat-icon>search</mat-icon>
                Check Availability
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Loading -->
      <div *ngIf="checking" class="flex justify-center py-10">
        <mat-spinner></mat-spinner>
      </div>

      <!-- Available Seats -->
      <mat-card *ngIf="!checking && availableSeats.length > 0">
        <mat-card-header>
          <mat-card-title>Available Seats ({{availableSeats.length}}/{{totalSeats}})</mat-card-title>
        </mat-card-header>
        <mat-card-content class="pt-4">
          <!-- Filter by Section -->
          <mat-form-field appearance="outline" class="mb-4">
            <mat-label>Filter by Section</mat-label>
            <mat-select [(value)]="selectedSection" (selectionChange)="filterSeats()">
              <mat-option [value]="null">All Sections</mat-option>
              <mat-option *ngFor="let section of sections" [value]="section">
                {{section}}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Seats Grid -->
          <div class="grid grid-cols-5 md:grid-cols-10 gap-3">
            <button *ngFor="let seat of filteredSeats"
                    class="aspect-square rounded flex flex-col items-center justify-center cursor-pointer transition"
                    [class.bg-green-200]="!isSelected(seat)"
                    [class.hover:bg-green-300]="!isSelected(seat)"
                    [class.bg-blue-500]="isSelected(seat)"
                    [class.text-white]="isSelected(seat)"
                    (click)="toggleSeatSelection(seat)">
              <span class="text-xs font-semibold">{{seat.seatNumber}}</span>
              <span class="text-[10px]">{{seat.section}}</span>
            </button>
          </div>

          <!-- Legend -->
          <div class="flex gap-6 mt-6 text-sm">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 bg-green-200 rounded"></div>
              <span>Available</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 bg-blue-500 rounded"></div>
              <span>Selected</span>
            </div>
          </div>

          <!-- Reserve Button -->
          <div class="mt-6" *ngIf="selectedSeat">
            <mat-card class="bg-blue-50">
              <mat-card-content>
                <div class="flex justify-between items-center">
                  <div>
                    <p class="font-semibold">Selected Seat: {{selectedSeat.seatNumber}}</p>
                    <p class="text-sm text-gray-600">{{selectedSeat.section}} - Floor {{selectedSeat.floor}}</p>
                  </div>
                  <button mat-raised-button color="primary" 
                          [disabled]="reserving"
                          (click)="reserveSeat()">
                    <mat-icon>event_seat</mat-icon>
                    Reserve Seat
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Conflicting Reservations -->
      <mat-card *ngIf="!checking && conflictingReservations.length > 0" class="mt-6">
        <mat-card-header>
          <mat-card-title>Seats Already Booked ({{conflictingReservations.length}})</mat-card-title>
        </mat-card-header>
        <mat-card-content class="pt-4">
          <div class="grid grid-cols-5 md:grid-cols-10 gap-3">
            <div *ngFor="let conflict of conflictingReservations"
                 class="aspect-square rounded flex flex-col items-center justify-center bg-red-200 text-red-800 cursor-pointer hover:bg-red-300 transition"
                 [title]="getConflictTooltip(conflict)">
              <span class="text-xs font-semibold">{{conflict.seatNumber}}</span>
              <span class="text-[10px]">{{conflict.section}}</span>
            </div>
          </div>
          
          <!-- Legend -->
          <div class="flex gap-6 mt-6 text-sm">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 bg-green-200 rounded"></div>
              <span>Available</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 bg-blue-500 rounded"></div>
              <span>Selected</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 bg-red-200 rounded"></div>
              <span>Already Booked</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- No Available Seats -->
      <mat-card *ngIf="!checking && availableSeats.length === 0 && searchPerformed">
        <mat-card-content class="text-center py-10">
          <mat-icon class="text-gray-300 text-8xl">event_busy</mat-icon>
          <h2 class="text-2xl text-gray-600 mt-4">No seats available</h2>
          <p class="text-gray-500 mt-2">Try a different date or time</p>
        </mat-card-content>
      </mat-card>

      <!-- My Reservations -->
      <mat-card class="mt-6">
        <mat-card-header>
          <mat-card-title>My Reservations ({{paginationInfo?.total || 0}} total)</mat-card-title>
        </mat-card-header>
        <mat-card-content class="pt-4">
          <div *ngIf="myReservations.length === 0" class="text-center py-8 text-gray-500">
            <mat-icon class="text-6xl text-gray-300">event_note</mat-icon>
            <p class="mt-4">No reservations yet</p>
          </div>

          <div *ngIf="myReservations.length > 0" class="space-y-4">
            <mat-card *ngFor="let reservation of myReservations" class="hover:shadow-lg transition">
              <mat-card-content class="flex justify-between items-center">
                <div>
                  <p class="font-semibold">Seat: {{reservation.seat?.seatNumber}}</p>
                  <p class="text-sm text-gray-600">{{reservation.seat?.section}} - Floor {{reservation.seat?.floor}}</p>
                  <p class="text-sm text-gray-600">
                    {{reservation.reservationDate | date}} • 
                    {{reservation.startTime | date:'shortTime'}} - {{reservation.endTime | date:'shortTime'}}
                  </p>
                  <mat-chip-set class="mt-2">
                    <mat-chip [class]="getStatusClass(reservation.status)">
                      {{reservation.status}}
                    </mat-chip>
                  </mat-chip-set>
                </div>
                <button mat-icon-button 
                        *ngIf="reservation.status === 'PENDING' || reservation.status === 'APPROVED'"
                        (click)="cancelReservation(reservation.id)"
                        color="warn">
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-card-content>
            </mat-card>
          </div>

          <!-- Pagination Controls -->
          <div *ngIf="paginationInfo && paginationInfo.totalPages > 1" class="mt-6 flex justify-between items-center">
            <div class="text-sm text-gray-600">
              Showing {{((paginationInfo.page - 1) * paginationInfo.limit) + 1}} - 
              {{Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.total)}} of 
              {{paginationInfo.total}} reservations
            </div>
            
            <div class="flex gap-2">
              <button mat-button 
                      [disabled]="!paginationInfo.hasPrev"
                      (click)="goToPage(paginationInfo.page - 1)">
                <mat-icon>chevron_left</mat-icon>
                Previous
              </button>
              
              <span class="flex items-center px-4 text-sm">
                Page {{paginationInfo.page}} of {{paginationInfo.totalPages}}
              </span>
              
              <button mat-button 
                      [disabled]="!paginationInfo.hasNext"
                      (click)="goToPage(paginationInfo.page + 1)">
                Next
                <mat-icon>chevron_right</mat-icon>
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class SeatReservationComponent implements OnInit {
  reservationForm: FormGroup;
  availableSeats: Seat[] = [];
  filteredSeats: Seat[] = [];
  conflictingReservations: any[] = [];
  myReservations: any[] = [];
  paginationInfo: any = null;
  currentPage = 1;
  pageSize = 5;
  sections: string[] = [];
  selectedSection: string | null = null;
  selectedSeat: Seat | null = null;
  checking = false;
  reserving = false;
  searchPerformed = false;
  minDate = new Date();
  totalSeats = 0;
  Math = Math; // Expose Math to template

  // Fixed time slots
  readonly slots = [
    { label: '07:00 - 10:00', start: '07:00', end: '10:00' },
    { label: '10:00 - 13:00', start: '10:00', end: '13:00' },
    { label: '13:00 - 16:00', start: '13:00', end: '16:00' },
    { label: '16:00 - 19:00', start: '16:00', end: '19:00' },
  ];

  constructor(
    private fb: FormBuilder,
    private seatService: SeatService,
    private reservationService: ReservationService,
    private toastr: ToastrService
  ) {
    this.reservationForm = this.fb.group({
      reservationDate: ['', Validators.required],
      slot: [this.slots[0].label, Validators.required]
    });
  }

  ngOnInit() {
    this.loadMyReservations();
    this.loadSections();
  }

  loadSections() {
    this.seatService.getSections().subscribe({
      next: (sections: string[]) => {
        this.sections = sections;
      }
    });
  }

  loadMyReservations(page: number = 1) {
    this.reservationService.getMyReservations(page, this.pageSize).subscribe({
      next: (response: any) => {
        this.myReservations = response.reservations;
        this.paginationInfo = response.pagination;
        this.currentPage = page;
      }
    });
  }

  checkAvailability() {
    if (this.reservationForm.invalid) {
      this.toastr.error('Please fill in all required fields');
      return;
    }

    const chosen = this.getChosenRange();
    if (!chosen) { 
      this.toastr.error('Please select a valid time slot or custom time'); 
      return; 
    }
    if (this.isRangePast(chosen.end)) { 
      this.toastr.error('Selected time has already passed for today'); 
      return; 
    }

    this.checking = true;
    this.searchPerformed = true;
    const formValue = this.reservationForm.value;
    const date = new Date(formValue.reservationDate).toISOString().split('T')[0];
    const startTime = `${date}T${chosen.start}:00Z`;
    const endTime = `${date}T${chosen.end}:00Z`;

    this.seatService.searchAvailableSeatsByTimeRange(
      date, 
      startTime, 
      endTime, 
      undefined, 
      this.selectedSection || undefined
    ).subscribe({
      next: (response: any) => {
        this.availableSeats = response.availableSeats;
        this.filteredSeats = response.availableSeats;
        this.conflictingReservations = response.conflictingReservations;
        this.totalSeats = response.totalSeats;
        this.checking = false;
        this.selectedSeat = null;
        
        if (response.availableSeats.length === 0) {
          this.toastr.info(`No seats available for the selected time slot. ${response.conflictingReservations.length} seats are already booked.`);
        } else {
          this.toastr.success(`${response.availableSeats.length} seats available out of ${response.totalSeats} total seats`);
        }
      },
      error: (_error: any) => {
        this.toastr.error('Failed to check availability');
        this.checking = false;
      }
    });
  }

  filterSeats() {
    if (this.selectedSection) {
      this.filteredSeats = this.availableSeats.filter(
        seat => seat.section === this.selectedSection
      );
    } else {
      this.filteredSeats = this.availableSeats;
    }
  }

  toggleSeatSelection(seat: Seat) {
    if (this.selectedSeat?.id === seat.id) {
      this.selectedSeat = null;
    } else {
      this.selectedSeat = seat;
    }
  }

  isSelected(seat: Seat): boolean {
    return this.selectedSeat?.id === seat.id;
  }

  reserveSeat() {
    if (!this.selectedSeat) {
      this.toastr.error('Please select a seat');
      return;
    }

    const chosen = this.getChosenRange();
    if (!chosen) { this.toastr.error('Please select a valid time slot or custom time'); return; }
    if (this.isRangePast(chosen.end)) { this.toastr.error('Selected time has already passed for today'); return; }

    this.reserving = true;
    const formValue = this.reservationForm.value;
    const date = new Date(formValue.reservationDate).toISOString().split('T')[0];

    this.reservationService.create({
      seatId: this.selectedSeat.id,
      reservationDate: date,
      startTime: `${date}T${chosen.start}:00Z`,
      endTime: `${date}T${chosen.end}:00Z`
    }).subscribe({
      next: (_response: any) => {
        this.toastr.success('Seat reserved successfully');
        this.reserving = false;
        this.selectedSeat = null;
        this.loadMyReservations(this.currentPage);
        this.checkAvailability(); // Refresh available seats
      },
      error: (error: any) => {
        this.toastr.error(error.error?.message || 'Failed to reserve seat');
        this.reserving = false;
      }
    });
  }

  cancelReservation(id: string) {
    if (confirm('Are you sure you want to cancel this reservation?')) {
      this.reservationService.cancel(id).subscribe({
      next: () => {
          this.toastr.success('Reservation cancelled');
          this.loadMyReservations(this.currentPage);
        },
        error: (_error: any) => {
          this.toastr.error('Failed to cancel reservation');
        }
      });
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= (this.paginationInfo?.totalPages || 1)) {
      this.loadMyReservations(page);
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  }

  private getChosenRange(): { start: string; end: string } | null {
    const label = this.reservationForm.value.slot as string;
    const slot = this.slots.find(s => s.label === label);
    return slot ? { start: slot.start, end: slot.end } : null;
  }

  private isRangePast(endHHMM: string): boolean {
    const selected: Date = this.reservationForm.value.reservationDate;
    if (!selected) return false;
    const now = new Date();
    const isToday = selected.toDateString() === now.toDateString();
    if (!isToday) return false;
    const [eh, em] = endHHMM.split(':').map(Number);
    const endDate = new Date(selected);
    endDate.setHours(eh, em, 0, 0);
    return now.getTime() >= endDate.getTime();
  }

  getConflictTooltip(conflict: any): string {
    const reservations = conflict.reservations.map((res: any) => {
      const start = new Date(res.startTime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      const end = new Date(res.endTime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      return `${start}-${end} (${res.user.firstName} ${res.user.lastName})`;
    }).join(', ');
    
    return `Booked: ${reservations}`;
  }
}
