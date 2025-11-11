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
  } as unknown as FaaNotamModel

  const mockFaaNotamModelEmpty: FaaNotamModel = {
    notamId: '456',
    scheduleData: []
  } as unknown as FaaNotamModel

  beforeEach(async () => {
    scheduleDaysSubject = new BehaviorSubject<string[]>(['Monday', 'Tuesday', 'Wednesday'])
    previewStateSubject = new BehaviorSubject<PreviewModel | null>(null)
    errorMessageSubject = new BehaviorSubject<string | null>(null)
    isTimeScheduleValidSubject = new BehaviorSubject<boolean>(false)

    mockNotamHubStore = jasmine.createSpyObj('NotamHubStore', [
      'resetPovResponse',
      'checkTimeSchedule',
      'patchState'
    ]);
    Object.defineProperty(mockNotamHubStore, 'scheduleDays$', { value: scheduleDaysSubject.asObservable() });
    Object.defineProperty(mockNotamHubStore, 'previewState$', { value: previewStateSubject.asObservable() });
    Object.defineProperty(mockNotamHubStore, 'errorMessage$', { value: errorMessageSubject.asObservable() });
    Object.defineProperty(mockNotamHubStore, 'isTimeScheduleValid$', { value: isTimeScheduleValidSubject.asObservable() });

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
    beforeEach(() => {
      component.form = new FormBuilder().group({})
    })

    it('should initialize form and observables', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
      tick()

      expect(component.form).toBeDefined()
      expect(component.scheduleDays$).toBeDefined()
      expect(component.validScheduleData$).toBeDefined()
      expect(component.errorMessage$).toBeDefined()
      expect(component.isTimeScheduleValid$).toBeDefined()
      expect(component.timeRange.length).toBeGreaterThan(0)
    }))

    it('should set timeRange with correct values', () => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()

      expect(component.timeRange.length).toBe(96) // 24 hours * 4 (15-minute intervals)
      expect(component.timeRange[0]).toBe('00:00')
      expect(component.timeRange[component.timeRange.length - 1]).toBe('23:45')
    })

    it('should initialize with model data', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
      tick()

      expect(component.scheduleGroup.length).toBeGreaterThan(0)
    }))

    it('should handle scheduleDays value changes', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel);
      component.ngOnInit();
      tick();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      spyOn<any>(component, 'setDailySelected');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      spyOn<any>(component, 'setScheduleDay');

      component.scheduleGroup.controls[0].get('scheduleDays')?.setValue('DLY');
      tick();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any)['setDailySelected']).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component as any)['setScheduleDay']).toHaveBeenCalled();
    }))

    it('should patch state when scheduleGroup value changes', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
      tick()

      component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')?.setValue('10:00')
      tick()

      expect(mockNotamHubStore.patchState).toHaveBeenCalledWith({ isTimeScheduleValid: false })
    }))
  })

  describe('addScheduleGroup', () => {
    beforeEach(() => {
      component.form = new FormBuilder().group({})
    })

    it('should add a new schedule group', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
      tick()

      const initialLength = component.scheduleGroup.length
      component.addScheduleGroup()

      expect(component.scheduleGroup.length).toBe(initialLength + 1)
    }))
  })

  describe('deleteScheduleGroup', () => {
    beforeEach(() => {
      component.form = new FormBuilder().group({})
    })

    it('should delete schedule group at index', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
      tick()

      component.addScheduleGroup()
      const initialLength = component.scheduleGroup.length
      component.deleteScheduleGroup(0)

      expect(component.scheduleGroup.length).toBe(initialLength - 1)
    }))

    it('should reset schedule when deleting last group', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModelEmpty)
      component.ngOnInit()
      tick()

      spyOn(component, 'resetSchedule')
      component.deleteScheduleGroup(0)

      expect(component.resetSchedule).toHaveBeenCalled()
    }))
  })

  describe('resetSchedule', () => {
    beforeEach(() => {
      component.form = new FormBuilder().group({})
    })

    it('should reset schedule form', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
      tick()

      component.resetSchedule()
      tick()

      expect(component.scheduleGroup.length).toBe(1)
      expect(component.scheduleGroup.controls[0].get('scheduleDays')?.value).toBe('')
    }))
  })

  describe('scheduleGroup getter', () => {
    beforeEach(() => {
      component.form = new FormBuilder().group({})
    })

    it('should return scheduleData FormArray', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
      tick()

      const scheduleGroup = component.scheduleGroup
      expect(scheduleGroup).toBeDefined()
      expect(scheduleGroup.length).toBeGreaterThan(0)
    }))
  })

  describe('validateScheduleOnClick', () => {
    beforeEach(() => {
      component.form = new FormBuilder().group({})
    })

    it('should validate and call checkTimeSchedule when schedule is complete', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
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
      component.ngOnInit()
      tick()

      mockNotamHubStore.resetPovResponse.calls.reset()
      mockNotamHubStore.checkTimeSchedule.calls.reset()

      component.validateScheduleOnClick()

      expect(mockNotamHubStore.resetPovResponse).not.toHaveBeenCalled()
      expect(mockNotamHubStore.checkTimeSchedule).not.toHaveBeenCalled()
    }))
  })

  describe('setNotamScheduleModel', () => {
    beforeEach(() => {
      component.form = new FormBuilder().group({})
    })

    it('should set model with existing schedule data', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
      tick()

      expect(component.scheduleGroup.length).toBe(mockScheduleData.length)
      expect(component.scheduleGroup.controls[0].get('scheduleDays')?.value).toBe('MON')
    }))

    it('should set model without schedule data', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModelEmpty)
      component.ngOnInit()
      tick()

      expect(component.scheduleGroup.length).toBe(1)
      expect(component.scheduleGroup.controls[0].get('scheduleDays')?.value).toBe('')
    }))

    it('should handle null scheduleData', fakeAsync(() => {
      const modelWithNullSchedule = { ...mockFaaNotamModel, scheduleData: undefined }
      fixture.componentRef.setInput('model', modelWithNullSchedule)
      component.ngOnInit()
      tick()

      expect(component.scheduleGroup.length).toBe(1)
    }))
  })

  describe('setDailySelected', () => {
    beforeEach(() => {
      component.form = new FormBuilder().group({})
    })

    it('should set isDailySelected to true when DLY is selected', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel);
      component.ngOnInit();
      tick();

      component.scheduleGroup.controls[0].get('scheduleDays')?.setValue('DLY');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any)['setDailySelected']();

      expect(component.isDailySelected).toBe(true);
    }))

    it('should set isDailySelected to false when other day is selected', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel);
      component.ngOnInit();
      tick();

      component.scheduleGroup.controls[0].get('scheduleDays')?.setValue('MON');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any)['setDailySelected']();

      expect(component.isDailySelected).toBe(false);
    }))
  })

  describe('setScheduleDay', () => {
    beforeEach(() => {
      component.form = new FormBuilder().group({})
    })

    it('should update all schedules when DLY is selected', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
      tick()

      component.addScheduleGroup();
      component.scheduleGroup.controls[0].get('scheduleDays')?.setValue('DLY');
      component.scheduleGroup.controls[1].get('scheduleDays')?.setValue('TUE');
      component.isDailySelected = true;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any)['setScheduleDay']();

      expect(component.scheduleGroup.controls[1].get('scheduleDays')?.value).toBe('DLY')
    }))

    it('should update all DLY schedules when switching from DLY', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
      tick()

      component.addScheduleGroup();
      component.scheduleGroup.controls[0].get('scheduleDays')?.setValue('MON');
      component.scheduleGroup.controls[1].get('scheduleDays')?.setValue('DLY');
      component.isDailySelected = false;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (component as any)['setScheduleDay']();

      expect(component.scheduleGroup.controls[1].get('scheduleDays')?.value).toBe('MON')
    }))
  })

  describe('checkScheduleGroupComplete', () => {
    beforeEach(() => {
      component.form = new FormBuilder().group({})
    })

    it('should return true when all fields are filled', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel);
      component.ngOnInit();
      tick();

      component.scheduleGroup.controls[0].patchValue({
        scheduleDays: 'MON',
        scheduleStartTimeUTC: '08:00',
        scheduleEndTimeUTC: '17:00'
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (component as any)['checkScheduleGroupComplete']();
      expect(result).toBe(true);
    }))

    it('should return false when fields are missing', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModelEmpty);
      component.ngOnInit();
      tick();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (component as any)['checkScheduleGroupComplete']();
      expect(result).toBe(false);
    }))
  })

  describe('timeRangevalidator', () => {
    beforeEach(() => {
      component.form = new FormBuilder().group({})
    })

    it('should return null for empty value', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
      tick()

      const control = component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')
      control?.setValue('')
      
      expect(control?.errors).toBeNull()
    }))

    it('should return null for SR value', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
      tick()

      const control = component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')
      control?.setValue('SR')
      
      expect(control?.errors).toBeNull()
    }))

    it('should return null for SS value', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
      tick()

      const control = component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')
      control?.setValue('SS')
      
      expect(control?.errors).toBeNull()
    }))

    it('should return null for valid time format', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
      tick()

      const control = component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')
      control?.setValue('14:30')
      
      expect(control?.hasError('invalidFormat')).toBe(false)
    }))

    it('should return error for invalid hour', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
      tick()

      const control = component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')
      control?.setValue('25:00')
      
      expect(control?.hasError('invalidFormat')).toBe(true)
    }))

    it('should return error for invalid minute', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
      tick()

      const control = component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')
      control?.setValue('14:60')
      
      expect(control?.hasError('invalidFormat')).toBe(true)
    }))

    it('should return error for negative hour', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
      tick()

      const control = component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')
      control?.setValue('-1:30')
      
      expect(control?.hasError('invalidFormat')).toBe(true)
    }))

    it('should return error for negative minute', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
      tick()

      const control = component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')
      control?.setValue('14:-30')
      
      expect(control?.hasError('invalidFormat')).toBe(true)
    }))

    it('should return error for invalid format', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
      tick()

      const control = component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')
      control?.setValue('invalid')
      
      expect(control?.hasError('invalidFormat')).toBe(true)
    }))

    it('should return null for non-string value', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
      tick()

      const control = component.scheduleGroup.controls[0].get('scheduleStartTimeUTC')
      control?.setValue(null)
      
      expect(control?.errors).toBeNull()
    }))
  })

  describe('customOptions', () => {
    it('should have sunrise and sunset options', () => {
      expect(component.customOptions.length).toBe(2)
      expect(component.customOptions[0].label).toBe('Sunrise')
      expect(component.customOptions[0].value).toBe('SR')
      expect(component.customOptions[1].label).toBe('Sunset')
      expect(component.customOptions[1].value).toBe('SS')
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      component.form = new FormBuilder().group({})
    })

    it('should handle multiple schedule groups', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
      tick()

      component.addScheduleGroup()
      component.addScheduleGroup()

      expect(component.scheduleGroup.length).toBeGreaterThan(2)
    }))

    it('should handle null model', fakeAsync(() => {
      fixture.componentRef.setInput('model', null)
      
      expect(() => component.ngOnInit()).toThrow()
    }))

    it('should handle boundary time values', fakeAsync(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
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

