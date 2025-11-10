<form [formGroup]="form">
      <div class="viewer-body">
        <app-alert-box displayAlertWithIcon='true'></app-alert-box>
        <div class="validity-wrapper flex-faa flex-wrap flex-row">
          <div class="flex-faa align-items-end">
            <div class="flex-faa flex-column">
              <mat-checkbox formControlName="isStartUponActivation" (change)="validatePeriodOfValidityData()">Start upon
                Activation</mat-checkbox>
              <!-- start date -->
              <mat-form-field>
                <mat-label>Start Date</mat-label>
                <input matInput [matDatepicker]="startDatePicker" formControlName="startTime" title="Start Date (EST)">
                <mat-hint>MM/DD/YYYY</mat-hint>
                @if (form.hasError('invalidStartTime', 'startTime')) {
                <mat-error>Start Date/Time should be before End Date/Time</mat-error>
                }
                @if (form.hasError('required', 'startTime')) {
                <mat-error>Start Date is <strong>required</strong></mat-error>
                }
    <mat-datepicker-toggle matIconSuffix aria-label="Open calendar for Start Date"
                  [for]="startDatePicker"></mat-datepicker-toggle>
                <mat-datepicker #startDatePicker></mat-datepicker>
              </mat-form-field>
            </div>
            <app-time label="Start Time (UTC)" control="startTime" class="time-style"></app-time>
          </div>
          <div class="flex-faa align-items-end">
            <div class="flex-faa flex-column">
              <mat-form-field>
                <mat-label>End Date</mat-label>
                <input matInput [matDatepicker]="endDatePicker" formControlName="endTime" title="End Date (EST)">
                <mat-hint>MM/DD/YYYY</mat-hint>
    <mat-datepicker-toggle matIconSuffix aria-label="Open calendar for End Date"
                  [for]="endDatePicker"></mat-datepicker-toggle>
                <mat-datepicker #endDatePicker></mat-datepicker>
                @if (form.hasError('invalidEndTime', 'endTime')) {
                <mat-error>End Date/Time should be after Start Date/Time</mat-error>
                }
                @if(form.hasError('required', 'endTime')){
                <mat-error>End Date is <strong>required</strong></mat-error>
                }
              </mat-form-field>
            </div>
    <app-time label="End Time (UTC)" control="endTime" class="time-style"></app-time>
            <div class="flex-faa flex-row align-items-center input-box-sized-div">
              <button mat-icon-button matSuffix type="button" (click)="openLocalTimeDialog()" aria-label="Local time"
                matTooltip="Local Time" class="circle-button btn-gray-border"><mat-icon class="material-symbols-outlined"
                  matSuffix>travel_explore</mat-icon></button>
              <button type="button" mat-stroked-button (click)="resetValidity()">Reset Validity</button>
            </div>
          </div>
        </div>
        <div class="pt-3">
          <mat-checkbox formControlName="validity" (change)="onCheckboxChange($event)"> Check here if NOTAM is relevant only
            during specific time within the
            overall
            period of validity</mat-checkbox>
    </div>
        @if(form.get('validity')?.value){
        <app-schedule-time [model]="model()"></app-schedule-time>
        }
      </div>
    </form>
