import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { ToastrService } from 'ngx-toastr';
import { SeatService } from '../../../../core/services/seat.service';
import { Seat, SeatStatus } from '../../../../core/models/seat.model';
import { AutoFocusDirective } from '../../../../shared/directives/auto-focus.directive';

@Component({
  selector: 'app-seat-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    AutoFocusDirective
  ],
  templateUrl: './seat-form.component.html',
  styleUrls: ['./seat-form.component.css']
})
export class SeatFormComponent implements OnInit {
  seatForm: FormGroup;
  isEditMode = false;
  loading = false;
  statuses = Object.values(SeatStatus);

  constructor(
    private fb: FormBuilder,
    private seatService: SeatService,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<SeatFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { seat?: Seat }
  ) {
    this.isEditMode = !!data?.seat;
    this.seatForm = this.fb.group({
      seatNumber: ['', [Validators.required, Validators.pattern(/^[A-Z]-\d{3}$/)]],
      floor: [1, [Validators.required, Validators.min(1)]],
      section: ['', Validators.required],
      status: [SeatStatus.AVAILABLE, Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    if (this.isEditMode && this.data.seat) {
      this.seatForm.patchValue(this.data.seat);
    }
  }

  onSubmit() {
    if (this.seatForm.valid) {
      this.loading = true;
      const seatData = this.seatForm.value;

      const operation = this.isEditMode
        ? this.seatService.update(this.data.seat!.id, seatData)
        : this.seatService.create(seatData);

      operation.subscribe({
        next: () => {
          this.toastr.success(
            this.isEditMode ? 'Seat updated successfully' : 'Seat created successfully'
          );
          this.dialogRef.close(true);
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}