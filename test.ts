import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnDestroy, OnInit, ViewChild } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormBuilder, FormControl, FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
// eslint-disable-next-line import/order
import { provideMomentDateAdapter } from '@angular/material-moment-adapter'
import { MatButtonModule } from '@angular/material/button'
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox'
import { provideNativeDateAdapter } from '@angular/material/core'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatDialog } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import moment from 'moment'
import { debounceTime, distinctUntilChanged, EMPTY, filter, merge, Observable } from 'rxjs'
import { AlertBoxComponent } from '../../../../utils/components/alert-box/alert-box.component'
import { TimeControlComponent } from '../../../../utils/components/time-control/time-control.component'
import { ToastService } from '../../../../utils/service/toast.service'
import { startEndDateTimeValidator } from '../../../validators/schedule-validate.service'
import * as models from '../../models'
import { FaaNotamModel } from '../../models'
import { NotamHubStore } from '../../store/notam-hub.store'
import { LocaltimeLookupDialogComponent } from '../localtime-lookup-dialog/localtime-lookup-dialog.component'
import { ScheduleTimeComponent } from './schedule-time.component'
@Component({
  standalone: true, selector: 'app-navaid-period-of-validity',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter(),
  provideMomentDateAdapter(undefined, { useUtc: true }),
  ],
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCheckboxModule,
    MatIconModule,
    MatDatepickerModule,
    TimeControlComponent,
    AlertBoxComponent,
    ScheduleTimeComponent
  ],
  templateUrl: './navaid-period-of-validity.component.html'
})
export class NavaidPeriodOfValidityComponent implements OnInit, OnDestroy {
  @ViewChild(ScheduleTimeComponent) scheduleTimeComponent!: ScheduleTimeComponent
  public form!: FormGroup
  public model = input<FaaNotamModel | null>()
  private destroyRef = inject(DestroyRef)
  private readonly dialog = inject(MatDialog)
  public constructor(
    private readonly formBuilder: FormBuilder,
    private readonly formGroupDirective: FormGroupDirective,
    private readonly notamHubStore: NotamHubStore,
    private readonly toastService: ToastService
  ) {
  }
public ngOnInit(): void {
    this.form = this.formGroupDirective.form
    this.buildForm()
    this.notamHubStore.povResponse$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(data => {
      if (data?.status === 'failure') {
        this.toastService.showToast(data.errors.map(error => error).join(', '), 'error')
        this.form.setErrors({ 'periodOfValidityError': true })
        return EMPTY
      }
      if (data?.status === 'correction') {
        this.form.patchValue({
          startTime: moment(data.data.startTime).utc(),
          endTime: moment(data.data.endTime).utc()
        })
        this.form.get('periodOfValidityError')?.setErrors(null)
        this.toastService.showToast('Period of Validity has been updated per schedule.', 'warning')
        return EMPTY
      }
      if (data?.status === 'success') {
        this.form.get('periodOfValidityError')?.setErrors(null)
        this.toastService.clearToast()
        return EMPTY
      }
      return EMPTY
    })
    this.notamHubStore.success$.pipe(
      takeUntilDestroyed(this.destroyRef),
      distinctUntilChanged()).subscribe(success => {
        if (success) {
          this.toastService.clearToast()
        }
      })
    const notamModel = this.model()!
    this.form.get('isStartUponActivation')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((value) => {
      if (value) {
        this.form.get('startTime')?.setValue('')
        this.form.get('startTime')?.disable()
      } else {
        this.form.get('startTime')?.enable()
      }
    })
    this.notamHubStore.success$.pipe(
      takeUntilDestroyed(this.destroyRef),
      filter(success => !!success)
    ).subscribe(() => {
      // once notam saved or submitted is success, then need to clear the time schedule
      if (this.scheduleTimeComponent) {
        this.scheduleTimeComponent.resetSchedule()
      }
    })
    this.form.patchValue({
      isStartUponActivation: notamModel?.isStartUponActivation,
      startTime: notamModel?.startTime ? moment(notamModel?.startTime).utc() : '',
      endTime: notamModel?.endTime ? moment(notamModel?.endTime).utc() : '',
      validity: notamModel?.scheduleData?.length > 0 ? true : false
    })
    if (this.form.get('validity')?.value === false) {
      this.notamHubStore.patchState({ isTimeScheduleValid: true })
    }
    merge(
      this.form.get('startTime')!.valueChanges,
      this.form.get('endTime')!.valueChanges
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(0) // Use debounceTime to wait for the event loop to update control validity
    ).subscribe(() => {
      if (this.form.get('startTime')!.valid || this.form.get('endTime')!.valid) {
        //calling get schedule days service
        this.setAndValidateScheduleData()
      }
    })
  }
public resetValidity(): void {
    this.form.get('isStartUponActivation')?.reset()
    this.form.get('startTime')?.reset()
    this.form.get('endTime')?.reset()
  }
public onCheckboxChange(event: MatCheckboxChange): void {
    this.notamHubStore.patchState({ isTimeScheduleValid: !event.checked })
    // calling get schedule days service when checkbox is checked
    if (event.checked) {
      this.getScheduleDays()
    }
  }
public openLocalTimeDialog(): void {
    const dialogRef = this.dialog.open(LocaltimeLookupDialogComponent, {
      minWidth: '60vw', minHeight: '30vh', panelClass: 'shared-dialog-panel',
      data: {
        startTime: this.form.get('startTime')?.value,
        endTime: this.form.get('endTime')?.value
      }
    })
    dialogRef.afterClosed()
  }
  public setAndValidateScheduleData(): void {
    if (this.form.get('validity')?.value) {
      this.getScheduleDays() // fetching scheduleDay based on POV start/End Date only if schedule is enable
    }
  }
  public ngOnDestroy(): void {
    this.toastService.clearToast()
  }
  public validatePeriodOfValidityData(): void {
    this.notamHubStore.resetPovResponse()
    const val = new models.PeriodOfValidityModel(this.form.value)
    this.notamHubStore.checkPeriodOfValidity(val)
  }
  private getScheduleDays(): void {
    const startTime = this.form.get('isStartUponActivation')?.value ? moment().toISOString() : this.form.get('startTime')?.value.toISOString()
    const endTime = this.form.get('endTime')?.value.toISOString()
    this.notamHubStore.fetchscheduleDays({ startTime: startTime, endTime: endTime })
  }
  private buildForm(): void {
    this.form = new FormGroup({
      isStartUponActivation: new FormControl({ value: true, disabled: true }),
      notMonitorCondition: new FormControl(false),
      startTime: new FormControl({ value: '', disabled: true }, {
        validators:
          [Validators.required, startEndDateTimeValidator('endTime', true)], updateOn: 'blur'
      }),
      endTime: new FormControl('', { validators: [Validators.required, startEndDateTimeValidator('startTime', false)], updateOn: 'blur' }),
      validity: new FormControl('')
    })
  }
}
