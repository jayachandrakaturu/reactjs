<form [formGroup]="scheduleForm">
  <mat-card-title class="pt-5 pb-3">
    Time Schedule
  </mat-card-title>
  <div class="flex">
    <div formArrayName="scheduleData">
      @for(schedule of scheduleGroup.controls; track schedule; let i = $index; let last = $last)
      {
      <div [formGroupName]="i">
        <div class="flex-faa flex-row">
          <mat-form-field>
            <mat-label>Day</mat-label>
            <mat-select formControlName="scheduleDays">
              <mat-option value="DLY"
                [disabled]="scheduleGroup.controls[0].get('scheduleDays')?.value !== '' && i !== 0 && !isDailySelected">Daily</mat-option>
              @for (day of scheduleDays$ | async; track $index) {
              <mat-option value="{{day.substring(0,3).toUpperCase()}}" [disabled]="i !== 0 && isDailySelected">{{ day
                }}</mat-option>
              }
            </mat-select>
            @if (schedule.hasError('required', 'scheduleDays')) {
            <mat-error>Day is <strong>required</strong></mat-error>
            }
          </mat-form-field>
          <!--Start Time-->
          <mat-form-field class="schedule-time-width">
            <mat-label>Start Time (UTC)</mat-label>
            <input type="text" placeholder="Start Time (UTC)" matInput [formControlName]="'scheduleStartTimeUTC'"
              [matAutocomplete]="auto" maxlength="5">
            <mat-autocomplete autoActiveFirstOption #auto="matAutocomplete">
              @for(option of customOptions; track option)
              {
              <mat-option [value]="option.value"> {{ option.label + ' - ' + option.value }}</mat-option>
              }
              @for(hour of timeRange; track hour){
              <mat-option [value]="hour">{{ hour }}</mat-option>
              }
            </mat-autocomplete>
            <mat-icon matSuffix>schedule</mat-icon>
            @if(schedule.hasError('invalidScheduleStartTimeUTC', 'scheduleStartTimeUTC')){
            <mat-error>Start time must be before End time</mat-error>
            }
            @if(schedule.hasError('isValidSchedule', 'scheduleStartTimeUTC')){
            <mat-error>Conflicts with existing schedule</mat-error>
            }
          </mat-form-field>
          <!--End Time-->
          <mat-form-field class="schedule-time-width">
            <mat-label>End Time (UTC)</mat-label>
            <input type="text" placeholder="End Time (UTC)" matInput [formControlName]="'scheduleEndTimeUTC'"
              [matAutocomplete]="auto" maxlength="5">
            <mat-autocomplete autoActiveFirstOption #auto="matAutocomplete">
              @for(option of customOptions; track option)
              {
              <mat-option [value]="option.value"> {{ option.label + ' - ' + option.value }}</mat-option>
              }
              @for(hour of timeRange; track hour){
              <mat-option [value]="hour">{{ hour }}</mat-option>
              }
            </mat-autocomplete>
            <mat-icon matSuffix>schedule</mat-icon>
            @if(schedule.hasError('invalidScheduleEndTimeUTC', 'scheduleEndTimeUTC')){
            <mat-error>End time must be after Start time</mat-error>
            }
            @if(schedule.hasError('isValidSchedule', 'scheduleEndTimeUTC')){
            <mat-error>Conflict with existing schedule</mat-error>
            }
          </mat-form-field>
          <div class="flex-faa flex-row align-items-center input-box-sized-div">
            <button type="button" mat-icon-button (click)="deleteScheduleGroup(i)">
              <mat-icon svgIcon="delete" title="Delete"></mat-icon></button>
            <button type="button" mat-icon-button (click)="addScheduleGroup()"><mat-icon svgIcon="add"
                title="Add"></mat-icon></button>
            @if (last) {
            <button type="button" mat-stroked-button (click)="resetSchedule()" title="Reset Schedule"
              class="ml-2">Reset
              Schedule</button>
            <button type="button" mat-stroked-button [disabled]="(isTimeScheduleValid$ | async) === true"
              (click)="validateScheduleOnClick()">Validate Schedule</button>
            }
          </div>
        </div>
      </div>
      }
    </div>
  </div>
</form>

