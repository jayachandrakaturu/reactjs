import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatButtonModule } from '@angular/material/button'
import { MatCardTitle } from '@angular/material/card'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatTimepickerOption } from '@angular/material/timepicker'
import { distinctUntilChanged, Observable } from 'rxjs'
import { ToastService } from '../../../../utils/service/toast.service'
import { startEndDateTimeValidator } from '../../../validators/schedule-validate.service'
import * as models from '../../models'
import { FaaNotamModel, PreviewModel } from '../../models'
import { NotamHubStore } from '../../store/notam-hub.store'

@Component({
  standalone: true,
  selector: 'app-schedule-time',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatAutocompleteModule,
    MatCardTitle
  ],
  templateUrl: './schedule-time.component.html'
})
export class ScheduleTimeComponent implements OnInit {
  public scheduleForm!: FormGroup
  public model = input<FaaNotamModel | null>()
  public scheduleDays$: Observable<string[]> | undefined
  public validScheduleData$!: Observable<PreviewModel | null>
  public errorMessage$!: Observable<string | null>
  public isTimeScheduleValid$!: Observable<boolean>
  public isDailySelected = false
  public customOptions: MatTimepickerOption[] = [
    { label: 'Sunrise', value: 'SR' },
    { label: 'Sunset', value: 'SS' }
  ]
  public timeRange: string[] = []
  private destroyRef = inject(DestroyRef)

  public constructor(
    private readonly formBuilder: FormBuilder,
    private readonly notamHubStore: NotamHubStore,
    private readonly toastService: ToastService
  ) {
  }

  public ngOnInit(): void {
    this.setTimeRange()
    this.buildForm()
    this.scheduleDays$ = this.notamHubStore.scheduleDays$
    this.validScheduleData$ = this.notamHubStore.previewState$
    this.errorMessage$ = this.notamHubStore.errorMessage$
    this.isTimeScheduleValid$ = this.notamHubStore.isTimeScheduleValid$

    const notamModel = this.model()!
    this.setNotamScheduleModel(notamModel)

    this.scheduleGroup?.controls[0]?.get('scheduleDays')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.setDailySelected()
      this.setScheduleDay()
    })

    this.scheduleGroup?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      distinctUntilChanged()
    ).subscribe(() => {
      this.notamHubStore.patchState({ isTimeScheduleValid: false })
    })
  }

  public addScheduleGroup(): void {
    this.scheduleGroup.push(this.createScheduleGroup())
  }

  public deleteScheduleGroup(index: number): void {
    this.scheduleGroup.removeAt(index)
    if (this.scheduleGroup.length === 0) {
      this.resetSchedule()
    }
  }

  public resetSchedule(): void {
    this.scheduleForm.removeControl('scheduleData')
    const group = this.createScheduleGroup()
    this.buildScheduleForm(group)
  }

  public get scheduleGroup(): FormArray {
    return this.scheduleForm.get('scheduleData') as FormArray
  }

  public validateScheduleOnClick(): void {
    if (this.checkScheduleGroupComplete()) {
      this.notamHubStore.resetPovResponse()
      const val = new models.ScheduleModel(this.scheduleForm.value)
      this.notamHubStore.checkTimeSchedule(val)
    }
  }

  public getScheduleFormValue(): any {
    return this.scheduleForm.value
  }

  private setNotamScheduleModel(notamModel: FaaNotamModel): void {
    //display notam model data to time schedule formarray
    if (notamModel?.scheduleData && notamModel.scheduleData.length > 0) {
      notamModel?.scheduleData?.forEach(schedule => {
        const group = this.createScheduleGroup()
        group.patchValue({
          scheduleDays: schedule?.scheduleDays,
          scheduleStartTimeUTC: schedule?.scheduleStartTimeUTC,
          scheduleEndTimeUTC: schedule?.scheduleEndTimeUTC,
        })
        group.markAsDirty({ onlySelf: true })
        if (this.scheduleGroup?.length > 0) {
          this.scheduleGroup.push(group)
        } else {
          this.buildScheduleForm(group)
        }
      })
    } else {
      const group = this.createScheduleGroup()
      this.buildScheduleForm(group)
    }
    //setting isDailyselected property
    this.setDailySelected()
  }

  private buildScheduleForm(group: FormGroup): void {
    const scheduleData = new FormArray([group])
    this.scheduleForm?.addControl('scheduleData', scheduleData)
  }

  private setDailySelected(): void {
    if (this.scheduleGroup?.controls?.length >= 1) {
      const option = this.scheduleGroup.controls[0].get('scheduleDays')?.value
      this.isDailySelected = option === 'DLY' ? true : false
    }
  }

  private setScheduleDay(): void {
    const val = this.scheduleGroup.controls[0].get('scheduleDays')?.value
    if (this.isDailySelected) {
      this.scheduleGroup.controls.forEach(cntrl => {
        if (cntrl.get('scheduleDays')?.value !== 'DLY') {
          cntrl.patchValue({
            scheduleDays: val
          })
        }
      })
    } else {
      this.scheduleGroup.controls.forEach(cntrl => {
        if (cntrl.get('scheduleDays')?.value === 'DLY') {
          cntrl.patchValue({
            scheduleDays: val
          })
        }
      })
    }
  }

  private checkScheduleGroupComplete(): boolean {
    return this.scheduleGroup.controls.every(ctrl => {
      const value = ctrl.value
      return value.scheduleDays &&
        value.scheduleStartTimeUTC &&
        value.scheduleEndTimeUTC
    })
  }

  private createScheduleGroup(): FormGroup {
    return this.formBuilder.group({
      scheduleDays: new FormControl('', { validators: [Validators.required], nonNullable: true }),
      scheduleStartTimeUTC: new FormControl('', {
        validators:
          [Validators.required, this.timeRangevalidator(), startEndDateTimeValidator('scheduleEndTimeUTC', true)],
        nonNullable: true
      }),
      scheduleEndTimeUTC: new FormControl('', {
        validators:
          [Validators.required, this.timeRangevalidator(), startEndDateTimeValidator('scheduleStartTimeUTC', false)],
        nonNullable: true
      }),
    }, { updateOn: 'blur' })
  }

  private buildForm(): void {
    this.scheduleForm = new FormGroup({})
  }

  private setTimeRange(): void {
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hour = h.toString().padStart(2, '0')
        const minute = m.toString().padStart(2, '0')
        this.timeRange.push(`${hour}:${minute}`)
      }
    }
  }

  //time schedule custom validation
  private timeRangevalidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value
      if (!value || typeof value !== 'string') {
        return null
      }
      if (value === 'SR' || value === 'SS') {
        return null
      }
      //checking for HH:MM
      const regex = /^-?\d{1,2}:\d{2}$/
      if (!regex.test(value)) {
        return { invalidFormat: 'Time must be in HH:MM format' }
      }
      const [hourStr, minuteStr] = value.split(':')
      const hour = parseInt(hourStr, 10)
      const minute = parseInt(minuteStr, 10)
      //checking for min 00 - 59
      if (minute < 0 || minute > 59) {
        return { invalidFormat: 'Minutes must be between 00 and 59' }
      }
      //checking for hr 00 - 23
      if (hour < 0 || hour > 23) {
        return { invalidFormat: 'Hour must be between 00 and 23' }
      }
      return null
    }
  }
}

