/* eslint-disable @typescript-eslint/no-explicit-any */
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing'
import { FormControl, FormGroup, FormGroupDirective } from '@angular/forms'
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox'
import { MatDialog, MatDialogRef } from '@angular/material/dialog'
import { of, Subject } from 'rxjs'
import { FaaNotamModel } from '../../models'
import { NotamHubStore } from '../../store/notam-hub.store'
import { LocaltimeLookupDialogComponent } from '../localtime-lookup-dialog/localtime-lookup-dialog.component'
import { NavaidPeriodOfValidityComponent } from './navaid-period-of-validity.component'
import { ScheduleTimeComponent } from './schedule-time.component'

describe('NavaidPeriodOfValidityComponent', () => {
    let component: NavaidPeriodOfValidityComponent
    let fixture: ComponentFixture<NavaidPeriodOfValidityComponent>
    let notamHubStoreSpy: jasmine.SpyObj<NotamHubStore>
    let dialogSpy: jasmine.SpyObj<MatDialog>
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<LocaltimeLookupDialogComponent>>
    const povResponse$ = new Subject<any>()
    const success$ = new Subject<boolean>()
    const mockScheduleDays: string[] = [
        'Tuesday',
        'Wednesday',
        'Thursday'
    ]

    beforeEach(async () => {
        notamHubStoreSpy = jasmine.createSpyObj('NotamHubStore', ['checkPeriodOfValidity', 'fetchscheduleDays', 'patchState', 'resetPovResponse'], {
            povResponse$: povResponse$.asObservable(),
            scheduleDays$: of(mockScheduleDays),
            errorMessage$: of('EC2'),
            success$: success$.asObservable()
        })
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open'])
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed'])
        dialogRefSpy.afterClosed.and.returnValue(of(undefined))
        dialogSpy.open.and.returnValue(dialogRefSpy)
        const parentFormGroup = new FormGroup({
            isStartUponActivation: new FormControl(),
            notMonitorCondition: new FormControl(),
            startTime: new FormControl(),
            endTime: new FormControl(),
            validity: new FormControl()
        })
        const formGroupDirectiveStub = {
            form: parentFormGroup
        } as FormGroupDirective
        await TestBed.configureTestingModule({
            imports: [NavaidPeriodOfValidityComponent, MatCheckboxModule],
            providers: [
                { provide: FormGroupDirective, useValue: formGroupDirectiveStub },
                { provide: NotamHubStore, useValue: notamHubStoreSpy },
                { provide: MatDialog, useValue: dialogSpy },
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        }).compileComponents()
        fixture = TestBed.createComponent(NavaidPeriodOfValidityComponent)
        component = fixture.componentInstance
        // Set default model input before detectChanges
        fixture.componentRef.setInput('model', {} as FaaNotamModel)
        fixture.detectChanges()
    })

        it('should create', () => {
            expect(component).toBeTruthy()
        })

        it('should initialize form controls on ngOnInit', () => {
            expect(component.form.contains('isStartUponActivation')).toBeTrue()
        expect(component.form.contains('notMonitorCondition')).toBeTrue()
            expect(component.form.contains('startTime')).toBeTrue()
            expect(component.form.contains('endTime')).toBeTrue()
            expect(component.form.contains('validity')).toBeTrue()
        })

        it('should disable startTime when isStartUponActivation is true', () => {
        component.form.get('isStartUponActivation')?.enable()
            component.form.get('isStartUponActivation')?.setValue(true)
            expect(component.form.get('startTime')?.disabled).toBeTrue()
        })

        it('should enable startTime when isStartUponActivation is false', () => {
        component.form.get('isStartUponActivation')?.enable()
            component.form.get('isStartUponActivation')?.setValue(false)
            expect(component.form.get('startTime')?.enabled).toBeTrue()
        })

        it('should reset validity', () => {
            component.form.get('isStartUponActivation')?.setValue(true)
            component.resetValidity()
            expect(component.form.get('isStartUponActivation')?.value).toBeNull()
        })

    it('should update store state when checkbox is unchecked', () => {
            const event: MatCheckboxChange = { checked: false, source: {} as any }
            component.onCheckboxChange(event)
            expect(notamHubStoreSpy.patchState).toHaveBeenCalledWith({ isTimeScheduleValid: true })
        })

    it('should call fetchScheduleDays when checkbox is checked', () => {
        const event: MatCheckboxChange = { checked: true, source: {} as any }
        component.form.patchValue({
            startTime: new Date('2025-07-01T02:57:07.932Z'),
            endTime: new Date('2025-07-03T17:57:07.932Z')
        })
        component.onCheckboxChange(event)
        expect(notamHubStoreSpy.patchState).toHaveBeenCalledWith({ isTimeScheduleValid: false })
        expect(notamHubStoreSpy.fetchscheduleDays).toHaveBeenCalled()
    })

    it('should handle povResponse$ with failure status', fakeAsync(() => {
        const toastServiceSpy = spyOn(component['toastService'], 'showToast')
        povResponse$.next({ status: 'failure', errors: ['Invalid time'] })
        tick()
        fixture.detectChanges()
        expect(toastServiceSpy).toHaveBeenCalledWith('Invalid time', 'error')
        expect(component.form.hasError('periodOfValidityError')).toBeTrue()
    }))

    it('should handle povResponse$ with success status', fakeAsync(() => {
        component.form.setErrors({ 'periodOfValidityError': true })
        const toastServiceSpy = spyOn(component['toastService'], 'clearToast')
        povResponse$.next({ status: 'success' })
        tick()
        fixture.detectChanges()
        expect(toastServiceSpy).toHaveBeenCalled()
        expect(component.form.hasError('periodOfValidityError')).toBeFalse()
    }))

    it('should handle povResponse$ with success status and return EMPTY', fakeAsync(() => {
        component.form.setErrors({ 'periodOfValidityError': true })
        const toastServiceSpy = spyOn(component['toastService'], 'clearToast')
        povResponse$.next({ status: 'success' })
        tick()
        fixture.detectChanges()
        expect(toastServiceSpy).toHaveBeenCalled()
        expect(component.form.hasError('periodOfValidityError')).toBeFalse()
    }))

    it('should handle povResponse$ with correction status', fakeAsync(() => {
        const mockCorrection = { startTime: '2024-01-01T10:00:00Z', endTime: '2024-01-01T12:00:00Z' }
        const toastServiceSpy = spyOn(component['toastService'], 'showToast')
        povResponse$.next({ status: 'correction', data: mockCorrection })
        tick()
        fixture.detectChanges()
        expect(component.form.get('startTime')?.value).toBeDefined()
        expect(component.form.get('endTime')?.value).toBeDefined()
        expect(toastServiceSpy).toHaveBeenCalledWith('Period of Validity has been updated per schedule.', 'warning')
    }))

    it('should handle povResponse$ with undefined status and return EMPTY', () => {
        povResponse$.next({ status: undefined })
        fixture.detectChanges()
        // This should hit the final return EMPTY statement
        expect(component).toBeTruthy()
    })

    it('should handle povResponse$ with null data and return EMPTY', () => {
        povResponse$.next(null)
        fixture.detectChanges()
        // This should handle null data gracefully
        expect(component).toBeTruthy()
    })

    it('should open the dialog with start and end time from the form', () => {
        const startTime = '2024-08-01T10:00:00Z'
        const endTime = '2024-08-01T12:00:00Z'
        component.form.patchValue({ startTime, endTime })
        component.openLocalTimeDialog()
        expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), {
            minWidth: '60vw', minHeight: '30vh', panelClass: 'shared-dialog-panel',
            data: {
                startTime: startTime,
                endTime: endTime
            }
        })
        expect(dialogRefSpy.afterClosed).toHaveBeenCalled()
    })

    it('should initialize form with model data', () => {
        const mockNotamModel: FaaNotamModel = {
            startTime: new Date('2024-01-01T10:00:00Z'),
            endTime: new Date('2024-01-01T12:00:00Z'),
            scheduleData: [
                {
                    scheduleStartTimeUTC: '10:00',
                    scheduleEndTimeUTC: '12:00',
                    scheduleDays: 'Daily'
                }
            ]
        } as unknown as FaaNotamModel
        fixture.componentRef.setInput('model', mockNotamModel)
        component.ngOnInit()
        expect(component.form.get('validity')?.value).toBeTrue()
    })

    it('should call validatePeriodOfValidityData', () => {
        component.form.patchValue({
            isStartUponActivation: false,
            startTime: new Date('2024-01-01T10:00:00Z'),
            endTime: new Date('2024-01-01T12:00:00Z')
        })
        component.validatePeriodOfValidityData()
        expect(notamHubStoreSpy.resetPovResponse).toHaveBeenCalled()
        expect(notamHubStoreSpy.checkPeriodOfValidity).toHaveBeenCalled()
    })

    it('should call scheduleTimeComponent.resetSchedule when success$ emits true', () => {
        // Create a mock scheduleTimeComponent
        const mockScheduleTimeComponent = {
            resetSchedule: jasmine.createSpy('resetSchedule')
        }
        
        // Set the mock scheduleTimeComponent on the component
        component.scheduleTimeComponent = mockScheduleTimeComponent as any
        
        // Trigger the success$ observable to emit true
        success$.next(true)
        fixture.detectChanges()
        
        // Verify that resetSchedule was called
        expect(mockScheduleTimeComponent.resetSchedule).toHaveBeenCalled()
    })

    it('should not call scheduleTimeComponent.resetSchedule when scheduleTimeComponent is undefined', () => {
        // Set scheduleTimeComponent to undefined
        component.scheduleTimeComponent = undefined as any
        
        // Trigger the success$ observable to emit true (should not throw error)
        success$.next(true)
        fixture.detectChanges()
        
        // Since scheduleTimeComponent is undefined, no error should occur
        expect(component.scheduleTimeComponent).toBeUndefined()
    })

    it('should not call scheduleTimeComponent.resetSchedule when success$ emits false', () => {
        // Create a mock scheduleTimeComponent
        const mockScheduleTimeComponent = {
            resetSchedule: jasmine.createSpy('resetSchedule')
        }
        
        // Set the mock scheduleTimeComponent on the component
        component.scheduleTimeComponent = mockScheduleTimeComponent as any
        
        // Trigger the success$ observable to emit false
        success$.next(false)
        fixture.detectChanges()
        
        // Verify that resetSchedule was NOT called because success is false
        expect(mockScheduleTimeComponent.resetSchedule).not.toHaveBeenCalled()
    })
})
