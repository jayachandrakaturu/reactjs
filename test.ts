import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing'
import { FormBuilder, FormGroupDirective, ReactiveFormsModule } from '@angular/forms'
import { MatDialog, MatDialogRef } from '@angular/material/dialog'
import { provideNativeDateAdapter } from '@angular/material/core'
import { provideMomentDateAdapter } from '@angular/material-moment-adapter'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { MatCheckboxChange } from '@angular/material/checkbox'
import moment from 'moment'
import { BehaviorSubject, of } from 'rxjs'
import { NavaidPeriodOfValidityComponent } from './navaid-period-of-validity.component'
import { ScheduleTimeComponent } from './schedule-time.component'
import { NotamHubStore } from '../../store/notam-hub.store'
import { ToastService } from '../../../../utils/service/toast.service'
import { FaaNotamModel } from '../../models'

interface PovResponse {
  status: string
  errors?: string[]
  data?: {
    startTime: string
    endTime: string
  }
}

describe('NavaidPeriodOfValidityComponent', () => {
  let component: NavaidPeriodOfValidityComponent
  let fixture: ComponentFixture<NavaidPeriodOfValidityComponent>
  let mockNotamHubStore: jasmine.SpyObj<NotamHubStore>
  let mockToastService: jasmine.SpyObj<ToastService>
  let mockDialog: jasmine.SpyObj<MatDialog>
  let mockFormGroupDirective: jasmine.SpyObj<FormGroupDirective>
  let povResponseSubject: BehaviorSubject<PovResponse | null>
  let successSubject: BehaviorSubject<boolean>

  const mockFaaNotamModel: FaaNotamModel = {
    notamId: '123',
    isStartUponActivation: false,
    startTime: moment().toISOString(),
    endTime: moment().add(1, 'day').toISOString(),
    scheduleData: [
      {
        scheduleDays: 'MON',
        scheduleStartTimeUTC: '08:00',
        scheduleEndTimeUTC: '17:00'
      }
    ]
  } as unknown as FaaNotamModel

  beforeEach(async () => {
    povResponseSubject = new BehaviorSubject<PovResponse | null>(null)
    successSubject = new BehaviorSubject<boolean>(false)

    mockNotamHubStore = jasmine.createSpyObj('NotamHubStore', [
      'resetPovResponse',
      'checkPeriodOfValidity',
      'fetchscheduleDays',
      'patchState'
    ]);
    Object.defineProperty(mockNotamHubStore, 'povResponse$', { value: povResponseSubject.asObservable() });
    Object.defineProperty(mockNotamHubStore, 'success$', { value: successSubject.asObservable() });

    mockToastService = jasmine.createSpyObj('ToastService', [
      'showToast',
      'clearToast'
    ])

    mockDialog = jasmine.createSpyObj('MatDialog', ['open'])

    mockFormGroupDirective = jasmine.createSpyObj('FormGroupDirective', [], {
      form: new FormBuilder().group({})
    })

    await TestBed.configureTestingModule({
      imports: [
        NavaidPeriodOfValidityComponent,
        ScheduleTimeComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule
      ],
      providers: [
        FormBuilder,
        { provide: NotamHubStore, useValue: mockNotamHubStore },
        { provide: ToastService, useValue: mockToastService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: FormGroupDirective, useValue: mockFormGroupDirective },
        provideNativeDateAdapter(),
        provideMomentDateAdapter(undefined, { useUtc: true })
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(NavaidPeriodOfValidityComponent)
    component = fixture.componentInstance
    fixture.componentRef.setInput('model', mockFaaNotamModel)
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should initialize form and subscriptions', fakeAsync(() => {
      fixture.detectChanges()
      tick()
      expect(component.form).toBeDefined()
      expect(component.form.get('isStartUponActivation')).toBeDefined()
      expect(component.form.get('startTime')).toBeDefined()
      expect(component.form.get('endTime')).toBeDefined()
      expect(component.form.get('validity')).toBeDefined()
    }))

    it('should handle povResponse$ with failure status', fakeAsync(() => {
      fixture.detectChanges()
      tick()
      
      const failureResponse: PovResponse = {
        status: 'failure',
        errors: ['Error 1', 'Error 2']
      }
      
      povResponseSubject.next(failureResponse)
      tick()
      
      expect(mockToastService.showToast).toHaveBeenCalledWith('Error 1, Error 2', 'error')
      expect(component.form.errors).toEqual({ periodOfValidityError: true })
    }))

    it('should handle povResponse$ with correction status', fakeAsync(() => {
      fixture.detectChanges()
      tick()
      
      const correctionResponse: PovResponse = {
        status: 'correction',
        data: {
          startTime: moment().toISOString(),
          endTime: moment().add(2, 'days').toISOString()
        }
      }
      
      povResponseSubject.next(correctionResponse)
      tick()
      
      expect(mockToastService.showToast).toHaveBeenCalledWith(
        'Period of Validity has been updated per schedule.',
        'warning'
      )
      expect(component.form.get('startTime')?.value).toBeDefined()
    }))

    it('should handle povResponse$ with success status', fakeAsync(() => {
      fixture.detectChanges()
      tick()
      
      const successResponse: PovResponse = {
        status: 'success'
      }
      
      povResponseSubject.next(successResponse)
      tick()
      
      expect(mockToastService.clearToast).toHaveBeenCalled()
    }))

    it('should handle success$ subscription and clear toast', fakeAsync(() => {
      fixture.detectChanges()
      tick()
      
      successSubject.next(true)
      tick()
      
      expect(mockToastService.clearToast).toHaveBeenCalled()
    }))

    it('should handle isStartUponActivation value changes - true', fakeAsync(() => {
      fixture.detectChanges()
      tick()
      
      component.form.get('isStartUponActivation')?.setValue(true)
      tick()
      
      expect(component.form.get('startTime')?.disabled).toBe(true)
      expect(component.form.get('startTime')?.value).toBe('')
    }))

    it('should handle isStartUponActivation value changes - false', fakeAsync(() => {
      fixture.detectChanges()
      tick()
      
      component.form.get('isStartUponActivation')?.setValue(false)
      tick()
      
      expect(component.form.get('startTime')?.disabled).toBe(false)
    }))

    it('should reset schedule when success$ emits true', fakeAsync(() => {
      fixture.detectChanges()
      tick()
      
      const mockScheduleTimeComponent = jasmine.createSpyObj('ScheduleTimeComponent', ['resetSchedule'])
      component.scheduleTimeComponent = mockScheduleTimeComponent
      
      successSubject.next(true)
      tick()
      
      expect(mockScheduleTimeComponent.resetSchedule).toHaveBeenCalled()
    }))

    it('should not reset schedule when scheduleTimeComponent is undefined', fakeAsync(() => {
      fixture.detectChanges()
      tick()
      
      component.scheduleTimeComponent = undefined as unknown as ScheduleTimeComponent
      
      successSubject.next(true)
      tick()
      
      expect(mockToastService.clearToast).toHaveBeenCalled()
    }))

    it('should patch form values with model data', fakeAsync(() => {
      fixture.detectChanges()
      tick()
      
      expect(component.form.get('isStartUponActivation')?.value).toBe(mockFaaNotamModel.isStartUponActivation)
      expect(component.form.get('validity')?.value).toBe(true)
    }))

    it('should set isTimeScheduleValid to true when validity is false', fakeAsync(() => {
      const modelWithoutSchedule = { ...mockFaaNotamModel, scheduleData: [] }
      fixture.componentRef.setInput('model', modelWithoutSchedule)
      fixture.detectChanges()
      tick()
      
      expect(mockNotamHubStore.patchState).toHaveBeenCalledWith({ isTimeScheduleValid: true })
    }))

    it('should call setAndValidateScheduleData when startTime changes and is valid', fakeAsync(() => {
      fixture.detectChanges()
      tick()
      
      spyOn(component, 'setAndValidateScheduleData')
      
      component.form.get('startTime')?.setValue(moment())
      component.form.get('startTime')?.markAsTouched()
      tick(10)
      
      expect(component.setAndValidateScheduleData).toHaveBeenCalled()
    }))

    it('should call setAndValidateScheduleData when endTime changes and is valid', fakeAsync(() => {
      fixture.detectChanges()
      tick()
      
      spyOn(component, 'setAndValidateScheduleData')
      
      component.form.get('endTime')?.setValue(moment().add(1, 'day'))
      component.form.get('endTime')?.markAsTouched()
      tick(10)
      
      expect(component.setAndValidateScheduleData).toHaveBeenCalled()
    }))
  })

  describe('resetValidity', () => {
    it('should reset isStartUponActivation, startTime, and endTime', () => {
      fixture.detectChanges()
      component.form.get('isStartUponActivation')?.setValue(true)
      component.form.get('startTime')?.setValue(moment())
      component.form.get('endTime')?.setValue(moment().add(1, 'day'))
      
      component.resetValidity()
      
      expect(component.form.get('isStartUponActivation')?.value).toBeNull()
      expect(component.form.get('startTime')?.value).toBeNull()
      expect(component.form.get('endTime')?.value).toBeNull()
    })
  })

  describe('onCheckboxChange', () => {
    it('should patch state and call getScheduleDays when checked', fakeAsync(() => {
      fixture.detectChanges()
      tick()
      
      component.form.get('startTime')?.setValue(moment())
      component.form.get('endTime')?.setValue(moment().add(1, 'day'))
      
      const event = { checked: true } as MatCheckboxChange
      component.onCheckboxChange(event)
      tick()
      
      expect(mockNotamHubStore.patchState).toHaveBeenCalledWith({ isTimeScheduleValid: false })
      expect(mockNotamHubStore.fetchscheduleDays).toHaveBeenCalled()
    }))

    it('should patch state when unchecked', () => {
      fixture.detectChanges()
      const event = { checked: false } as MatCheckboxChange
      component.onCheckboxChange(event)
      
      expect(mockNotamHubStore.patchState).toHaveBeenCalledWith({ isTimeScheduleValid: true })
      expect(mockNotamHubStore.fetchscheduleDays).not.toHaveBeenCalled()
    })
  })

  describe('openLocalTimeDialog', () => {
    it('should open dialog with correct configuration', () => {
      fixture.detectChanges()
      const mockDialogRef = {
        afterClosed: () => of(null)
      } as MatDialogRef<unknown>
      
      mockDialog.open.and.returnValue(mockDialogRef)
      
      component.form.get('startTime')?.setValue(moment())
      component.form.get('endTime')?.setValue(moment().add(1, 'day'))
      
      component.openLocalTimeDialog()
      
      expect(mockDialog.open).toHaveBeenCalled()
    })
  })

  describe('setAndValidateScheduleData', () => {
    it('should call getScheduleDays when validity is true', fakeAsync(() => {
      fixture.detectChanges()
      tick()
      
      component.form.get('validity')?.setValue(true)
      component.form.get('startTime')?.setValue(moment())
      component.form.get('endTime')?.setValue(moment().add(1, 'day'))
      
      component.setAndValidateScheduleData()
      
      expect(mockNotamHubStore.fetchscheduleDays).toHaveBeenCalled()
    }))

    it('should not call getScheduleDays when validity is false', fakeAsync(() => {
      fixture.detectChanges()
      tick()
      
      component.form.get('validity')?.setValue(false)
      
      mockNotamHubStore.fetchscheduleDays.calls.reset()
      component.setAndValidateScheduleData()
      
      expect(mockNotamHubStore.fetchscheduleDays).not.toHaveBeenCalled()
    }))

    it('should use current time when isStartUponActivation is true', fakeAsync(() => {
      fixture.detectChanges()
      tick()
      
      component.form.get('validity')?.setValue(true)
      component.form.get('isStartUponActivation')?.setValue(true)
      component.form.get('endTime')?.setValue(moment().add(1, 'day'))
      
      component.setAndValidateScheduleData()
      tick()
      
      expect(mockNotamHubStore.fetchscheduleDays).toHaveBeenCalled()
      const callArgs = mockNotamHubStore.fetchscheduleDays.calls.mostRecent().args[0]
      expect(callArgs.startTime).toBeDefined()
      expect(callArgs.endTime).toBeDefined()
    }))
  })

  describe('validatePeriodOfValidityData', () => {
    it('should reset pov response and check period of validity', () => {
      fixture.detectChanges()
      
      component.validatePeriodOfValidityData()
      
      expect(mockNotamHubStore.resetPovResponse).toHaveBeenCalled()
      expect(mockNotamHubStore.checkPeriodOfValidity).toHaveBeenCalled()
    })
  })

  describe('ngOnDestroy', () => {
    it('should clear toast on destroy', () => {
      fixture.detectChanges()
      component.ngOnDestroy()
      
      expect(mockToastService.clearToast).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle model with no startTime', fakeAsync(() => {
      const modelWithoutStartTime = { ...mockFaaNotamModel, startTime: undefined }
      fixture.componentRef.setInput('model', modelWithoutStartTime)
      fixture.detectChanges()
      tick()
      
      expect(component.form.get('startTime')?.value).toBe('')
    }))

    it('should handle model with no endTime', fakeAsync(() => {
      const modelWithoutEndTime = { ...mockFaaNotamModel, endTime: undefined }
      fixture.componentRef.setInput('model', modelWithoutEndTime)
      fixture.detectChanges()
      tick()
      
      expect(component.form.get('endTime')?.value).toBe('')
    }))

    it('should handle povResponse$ with unknown status', fakeAsync(() => {
      fixture.detectChanges()
      tick()
      
      const unknownResponse: PovResponse = {
        status: 'unknown'
      }
      
      povResponseSubject.next(unknownResponse)
      tick()
      
      // Should not throw error
      expect(component).toBeDefined()
    }))
  })
})

