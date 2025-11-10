import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'
import { FormBuilder, ReactiveFormsModule, FormGroup } from '@angular/forms'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { BehaviorSubject, of } from 'rxjs'
import { ScheduleTimeComponent, ScheduleDataItem } from './schedule-time.component'
import { NotamHubStore } from '../../store/notam-hub.store'
import { ToastService } from '../../../../utils/service/toast.service'
import { FaaNotamModel, PreviewModel } from '../../models'

describe('ScheduleTimeComponent', () => {
  let component: ScheduleTimeComponent
  let fixture: ComponentFixture<ScheduleTimeComponent>
  let mockNotamHubStore: jasmine.SpyObj<NotamHubStore>
  let mockToastService: jasmine.SpyObj<ToastService>
  let scheduleDaysSubject: BehaviorSubject<string[]>
  let previewStateSubject: BehaviorSubject<PreviewModel | null>
  let errorMessageSubject: BehaviorSubject<string | null>
  let isTimeScheduleValidSubject: BehaviorSubject<boolean>

  const mockScheduleData: ScheduleDataItem[] = [
    {
      scheduleDays: 'MON',
      scheduleStartTimeUTC: '08:00',
      scheduleEndTimeUTC: '17:00'
    },
    {
      scheduleDays: 'TUE',
      scheduleStartTimeUTC: '09:00',
      scheduleEndTimeUTC: '18:00'
    }
  ]

  const mockFaaNotamModel: FaaNotamModel = {
    notamId: '123',
    scheduleData: mockScheduleData
  } as FaaNotamModel

  const mockFaaNotamModelEmpty: FaaNotamModel = {
    notamId: '456',
    scheduleData: []
  } as FaaNotamModel

  beforeEach(async () => {
    scheduleDaysSubject = new BehaviorSubject<string[]>(['Monday', 'Tuesday', 'Wednesday'])
    previewStateSubject = new BehaviorSubject<PreviewModel | null>(null)
    errorMessageSubject = new BehaviorSubject<string | null>(null)
    isTimeScheduleValidSubject = new BehaviorSubject<boolean>(false)

    mockNotamHubStore = jasmine.createSpyObj('NotamHubStore', [
      'resetPovResponse',
      'checkTimeSchedule',
      'patchState'
    ])
    mockNotamHubStore.scheduleDays$ = scheduleDaysSubject.asObservable()
    mockNotamHubStore.previewState$ = previewStateSubject.asObservable()
    mockNotamHubStore.errorMessage$ = errorMessageSubject.asObservable()
    mockNotamHubStore.isTimeScheduleValid$ = isTimeScheduleValidSubject.asObservable()

    mockToastService = jasmine.createSpyObj('ToastService', ['showToast', 'clearToast'])

    await TestBed.configureTestingModule({
      imports: [
        ScheduleTimeComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule
      ],
      providers: [
        FormBuilder,
        { provide: NotamHubStore, useValue: mockNotamHubStore },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(ScheduleTimeComponent)
    component = fixture.componentInstance
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should initialize form and observables', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      expect(component.scheduleForm).toBeDefined()
      expect(component.scheduleDays$).toBeDefined()
      expect(component.validScheduleData$).toBeDefined()
      expect(component.errorMessage$).toBeDefined()
      expect(component.isTimeScheduleValid$).toBeDefined()
      expect(component.timeRange.length).toBeGreaterThan(0)
    }))

    it('should set timeRange with correct values', () => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()

      expect(component.timeRange.length).toBe(96) // 24 hours * 4 (15-minute intervals)
      expect(component.timeRange[0]).toBe('00:00')
      expect(component.timeRange[component.timeRange.length - 1]).toBe('23:45')
    })

    it('should initialize with model data', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      expect(component.scheduleGroup.length).toBeGreaterThan(0)
    }))

    it('should handle scheduleDays value changes', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      spyOn<ScheduleTimeComponent, 'setDailySelected'>(component as ScheduleTimeComponent, 'setDailySelected')
      spyOn<ScheduleTimeComponent, 'setScheduleDay'>(component as ScheduleTimeComponent, 'setScheduleDay')

      component.scheduleGroup.controls[0].get('scheduleDays')?.setValue('DLY')
      tick()

      expect((component as ScheduleTimeComponent)['setDailySelected']).toHaveBeenCalled()
      expect((component as ScheduleTimeComponent)['setScheduleDay']).toHaveBeenCalled()
    }))

    it('should patch state when scheduleGroup value changes', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')?.setValue('10:00')
      tick()

      expect(mockNotamHubStore.patchState).toHaveBeenCalledWith({ isTimeScheduleValid: false })
    }))
  })

  describe('addScheduleGroup', () => {
    it('should add a new schedule group', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      const initialLength = component.scheduleGroup.length
      component.addScheduleGroup()

      expect(component.scheduleGroup.length).toBe(initialLength + 1)
    }))
  })

  describe('deleteScheduleGroup', () => {
    it('should delete schedule group at index', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      component.addScheduleGroup()
      const initialLength = component.scheduleGroup.length
      component.deleteScheduleGroup(0)

      expect(component.scheduleGroup.length).toBe(initialLength - 1)
    }))

    it('should reset schedule when deleting last group', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModelEmpty)
      fixture.detectChanges()
      tick()

      spyOn(component, 'resetSchedule')
      component.deleteScheduleGroup(0)

      expect(component.resetSchedule).toHaveBeenCalled()
    }))
  })

  describe('resetSchedule', () => {
    it('should reset schedule form', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      component.resetSchedule()
      tick()

      expect(component.scheduleGroup.length).toBe(1)
      expect(component.scheduleGroup.controls[0].get('scheduleDays')?.value).toBe('')
    }))
  })

  describe('scheduleGroup getter', () => {
    it('should return scheduleData FormArray', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      const scheduleGroup = component.scheduleGroup
      expect(scheduleGroup).toBeDefined()
      expect(scheduleGroup.length).toBeGreaterThan(0)
    }))
  })

  describe('validateScheduleOnClick', () => {
    it('should validate and call checkTimeSchedule when schedule is complete', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      component.scheduleGroup.controls[0].patchValue({
        scheduleDays: 'MON',
        scheduleStartTimeUTC: '08:00',
        scheduleEndTimeUTC: '17:00'
      })

      component.validateScheduleOnClick()

      expect(mockNotamHubStore.resetPovResponse).toHaveBeenCalled()
      expect(mockNotamHubStore.checkTimeSchedule).toHaveBeenCalled()
    }))

    it('should not validate when schedule is incomplete', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModelEmpty)
      fixture.detectChanges()
      tick()

      mockNotamHubStore.resetPovResponse.calls.reset()
      mockNotamHubStore.checkTimeSchedule.calls.reset()

      component.validateScheduleOnClick()

      expect(mockNotamHubStore.resetPovResponse).not.toHaveBeenCalled()
      expect(mockNotamHubStore.checkTimeSchedule).not.toHaveBeenCalled()
    }))
  })

  describe('getScheduleFormValue', () => {
    it('should return schedule form value', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      const formValue = component.getScheduleFormValue()
      expect(formValue).toBeDefined()
      expect(formValue.scheduleData).toBeDefined()
    }))
  })

  describe('setNotamScheduleModel', () => {
    it('should set model with existing schedule data', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      expect(component.scheduleGroup.length).toBe(mockScheduleData.length)
      expect(component.scheduleGroup.controls[0].get('scheduleDays')?.value).toBe('MON')
    }))

    it('should set model without schedule data', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModelEmpty)
      fixture.detectChanges()
      tick()

      expect(component.scheduleGroup.length).toBe(1)
      expect(component.scheduleGroup.controls[0].get('scheduleDays')?.value).toBe('')
    }))

    it('should handle null scheduleData', fakeAsync(() => {
      const modelWithNullSchedule = { ...mockFaaNotamModel, scheduleData: undefined }
      fixture.componentRef.setInput('model', modelWithNullSchedule)
      fixture.detectChanges()
      tick()

      expect(component.scheduleGroup.length).toBe(1)
    }))
  })

  describe('setDailySelected', () => {
    it('should set isDailySelected to true when DLY is selected', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      component.scheduleGroup.controls[0].get('scheduleDays')?.setValue('DLY')
      (component as ScheduleTimeComponent)['setDailySelected']()

      expect(component.isDailySelected).toBe(true)
    }))

    it('should set isDailySelected to false when other day is selected', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      component.scheduleGroup.controls[0].get('scheduleDays')?.setValue('MON')
      (component as ScheduleTimeComponent)['setDailySelected']()

      expect(component.isDailySelected).toBe(false)
    }))
  })

  describe('setScheduleDay', () => {
    it('should update all schedules when DLY is selected', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      component.addScheduleGroup();
      component.scheduleGroup.controls[0].get('scheduleDays')?.setValue('DLY');
      component.scheduleGroup.controls[1].get('scheduleDays')?.setValue('TUE');
      component.isDailySelected = true;
      
      (component as ScheduleTimeComponent)['setScheduleDay']();

      expect(component.scheduleGroup.controls[1].get('scheduleDays')?.value).toBe('DLY')
    }))

    it('should update all DLY schedules when switching from DLY', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      component.addScheduleGroup();
      component.scheduleGroup.controls[0].get('scheduleDays')?.setValue('MON');
      component.scheduleGroup.controls[1].get('scheduleDays')?.setValue('DLY');
      component.isDailySelected = false;
      
      (component as ScheduleTimeComponent)['setScheduleDay']();

      expect(component.scheduleGroup.controls[1].get('scheduleDays')?.value).toBe('MON')
    }))
  })

  describe('checkScheduleGroupComplete', () => {
    it('should return true when all fields are filled', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      component.scheduleGroup.controls[0].patchValue({
        scheduleDays: 'MON',
        scheduleStartTimeUTC: '08:00',
        scheduleEndTimeUTC: '17:00'
      })

      const result = (component as ScheduleTimeComponent)['checkScheduleGroupComplete']()
      expect(result).toBe(true)
    }))

    it('should return false when fields are missing', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModelEmpty)
      fixture.detectChanges()
      tick()

      const result = (component as ScheduleTimeComponent)['checkScheduleGroupComplete']()
      expect(result).toBe(false)
    }))
  })

  describe('timeRangevalidator', () => {
    it('should return null for empty value', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      const control = component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')
      control?.setValue('')
      
      expect(control?.errors).toBeNull()
    }))

    it('should return null for SR value', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      const control = component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')
      control?.setValue('SR')
      
      expect(control?.errors).toBeNull()
    }))

    it('should return null for SS value', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      const control = component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')
      control?.setValue('SS')
      
      expect(control?.errors).toBeNull()
    }))

    it('should return null for valid time format', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      const control = component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')
      control?.setValue('14:30')
      
      expect(control?.hasError('invalidFormat')).toBe(false)
    }))

    it('should return error for invalid hour', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      const control = component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')
      control?.setValue('25:00')
      
      expect(control?.hasError('invalidFormat')).toBe(true)
    }))

    it('should return error for invalid minute', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      const control = component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')
      control?.setValue('14:60')
      
      expect(control?.hasError('invalidFormat')).toBe(true)
    }))

    it('should return error for negative hour', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      const control = component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')
      control?.setValue('-1:30')
      
      expect(control?.hasError('invalidFormat')).toBe(true)
    }))

    it('should return error for negative minute', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      const control = component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')
      control?.setValue('14:-30')
      
      expect(control?.hasError('invalidFormat')).toBe(true)
    }))

    it('should return error for invalid format', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      const control = component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')
      control?.setValue('invalid')
      
      expect(control?.hasError('invalidFormat')).toBe(true)
    }))

    it('should return null for non-string value', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      const control = component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')
      control?.setValue(null)
      
      expect(control?.errors).toBeNull()
    }))
  })

  describe('customOptions', () => {
    it('should have sunrise and sunset options', () => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()

      expect(component.customOptions.length).toBe(2)
      expect(component.customOptions[0].label).toBe('Sunrise')
      expect(component.customOptions[0].value).toBe('SR')
      expect(component.customOptions[1].label).toBe('Sunset')
      expect(component.customOptions[1].value).toBe('SS')
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple schedule groups', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      component.addScheduleGroup()
      component.addScheduleGroup()

      expect(component.scheduleGroup.length).toBeGreaterThan(2)
    }))

    it('should handle null model', fakeAsync(() => {
      fixture.componentRef.setInput('model', null)
      fixture.detectChanges()
      tick()

      expect(component.scheduleGroup.length).toBe(1)
    }))

    it('should handle boundary time values', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()
      tick()

      const control = component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')
      
      // Test boundary: 00:00
      control?.setValue('00:00')
      expect(control?.hasError('invalidFormat')).toBe(false)

      // Test boundary: 23:59
      control?.setValue('23:59')
      expect(control?.hasError('invalidFormat')).toBe(false)
    }))
  })
})

