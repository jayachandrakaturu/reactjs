import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { of, Subject } from 'rxjs'
import { RunwayLocationComponent } from './runway-location.component'
import { LocationLookupModel } from './models'
import { LookupCacheStore } from '../../store/lookup-cache-store'
import { FaaNotamModel } from '../../models'

fdescribe('RunwayLocationComponent', () => {
    let component: RunwayLocationComponent
    let fixture: ComponentFixture<RunwayLocationComponent>
    let mockLookupCacheStore: jasmine.SpyObj<LookupCacheStore>
    let mockFormGroupDirective: FormGroupDirective
    let parentForm: FormGroup
    let locationValueChangesSubject: Subject<string>

    beforeEach(async () => {
        // Create mock for LookupCacheStore
        mockLookupCacheStore = jasmine.createSpyObj('LookupCacheStore', ['fetchAccountability'])
        mockLookupCacheStore.locationLookup$ = of([
            new LocationLookupModel({ name: 'Runway End 1', locationId: '1' }),
            new LocationLookupModel({ name: 'Runway End 2', locationId: '2' })
        ])

        // Create parent form with scenarioData
        locationValueChangesSubject = new Subject<string>()
        parentForm = new FormGroup({
            location: new FormControl(''),
            scenarioData: new FormGroup({})
        })

        // Mock the valueChanges to return our subject
        Object.defineProperty(parentForm.controls['location'], 'valueChanges', {
            get: () => locationValueChangesSubject.asObservable()
        })

        // Create mock FormGroupDirective
        mockFormGroupDirective = new FormGroupDirective([], [])
        mockFormGroupDirective.form = parentForm

        await TestBed.configureTestingModule({
            imports: [
                RunwayLocationComponent,
                ReactiveFormsModule,
                NoopAnimationsModule
            ],
            providers: [
                { provide: FormGroupDirective, useValue: mockFormGroupDirective },
                { provide: LookupCacheStore, useValue: mockLookupCacheStore }
            ]
        }).compileComponents()
    })

    beforeEach(() => {
        fixture = TestBed.createComponent(RunwayLocationComponent)
        component = fixture.componentInstance
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize form on ngOnInit', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        expect(component.runwayLocationForm).toBeDefined()
        expect(component.runwayLocationForm.get('lengthClosed')).toBeDefined()
        expect(component.runwayLocationForm.get('fromRunwayEnd')).toBeDefined()

        const scenarioData = parentForm.get('scenarioData') as FormGroup
        expect(scenarioData.get('runwayLocation')).toBe(component.runwayLocationForm)
    })

    it('should patch form values when model is provided', () => {
        const mockModel: FaaNotamModel = {
            scenarioData: {
                runwayLocation: {
                    lengthClosed: '1000',
                    fromRunwayEnd: 'North End'
                }
            }
        } as FaaNotamModel

        fixture.componentRef.setInput('model', mockModel)
        fixture.detectChanges()

        expect(component.runwayLocationForm.get('lengthClosed')?.value).toBe('1000')
        expect(component.runwayLocationForm.get('fromRunwayEnd')?.value).toBe('North End')
    })

    it('should handle null model on ngOnInit', () => {
        fixture.componentRef.setInput('model', null)
        
        expect(() => {
            fixture.detectChanges()
        }).not.toThrow()

        expect(component.runwayLocationForm.get('lengthClosed')?.value).toBe('')
        expect(component.runwayLocationForm.get('fromRunwayEnd')?.value).toBe('')
    })

    it('should handle model with undefined runwayLocation', () => {
        const mockModel: FaaNotamModel = {
            scenarioData: {}
        } as FaaNotamModel

        fixture.componentRef.setInput('model', mockModel)
        fixture.detectChanges()

        expect(component.runwayLocationForm.get('lengthClosed')?.value).toBe(undefined)
        expect(component.runwayLocationForm.get('fromRunwayEnd')?.value).toBe(undefined)
    })

    it('should fetch accountability when location value changes', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const testLocationValue = 'KJFK'
        locationValueChangesSubject.next(testLocationValue)

        expect(mockLookupCacheStore.fetchAccountability).toHaveBeenCalledWith(testLocationValue)
    })

    it('should update fromRunwayEnd$ observable when location value changes', (done) => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        locationValueChangesSubject.next('KLAX')

        component.fromRunwayEnd$.subscribe((locations: LocationLookupModel[]) => {
            expect(locations.length).toBe(2)
            expect(locations[0].name).toBe('Runway End 1')
            expect(locations[1].name).toBe('Runway End 2')
            done()
        })
    })

    it('should handle multiple location value changes', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        locationValueChangesSubject.next('KJFK')
        locationValueChangesSubject.next('KLAX')
        locationValueChangesSubject.next('KORD')

        expect(mockLookupCacheStore.fetchAccountability).toHaveBeenCalledTimes(3)
        expect(mockLookupCacheStore.fetchAccountability).toHaveBeenCalledWith('KJFK')
        expect(mockLookupCacheStore.fetchAccountability).toHaveBeenCalledWith('KLAX')
        expect(mockLookupCacheStore.fetchAccountability).toHaveBeenCalledWith('KORD')
    })

    it('should remove runwayLocation control from scenarioData on ngOnDestroy', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const scenarioData = parentForm.get('scenarioData') as FormGroup
        expect(scenarioData.get('runwayLocation')).toBeDefined()

        component.ngOnDestroy()

        expect(scenarioData.get('runwayLocation')).toBeNull()
    })

    it('should unsubscribe from location valueChanges on component destroy', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const initialCallCount = mockLookupCacheStore.fetchAccountability.calls.count()

        fixture.destroy()

        locationValueChangesSubject.next('KJFK')

        // Should still be the same count, meaning subscription was destroyed
        expect(mockLookupCacheStore.fetchAccountability).toHaveBeenCalledTimes(initialCallCount)
    })

    it('should properly initialize with partial runwayLocation data', () => {
        const mockModel: FaaNotamModel = {
            scenarioData: {
                runwayLocation: {
                    lengthClosed: '500'
                }
            }
        } as FaaNotamModel

        fixture.componentRef.setInput('model', mockModel)
        fixture.detectChanges()

        expect(component.runwayLocationForm.get('lengthClosed')?.value).toBe('500')
        expect(component.runwayLocationForm.get('fromRunwayEnd')?.value).toBe(undefined)
    })

    it('should have correct form control names', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const formControls = Object.keys(component.runwayLocationForm.controls)
        expect(formControls).toContain('lengthClosed')
        expect(formControls).toContain('fromRunwayEnd')
        expect(formControls.length).toBe(2)
    })

    it('should update form values when manually set', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        component.runwayLocationForm.patchValue({
            lengthClosed: '2000',
            fromRunwayEnd: 'South End'
        })

        expect(component.runwayLocationForm.get('lengthClosed')?.value).toBe('2000')
        expect(component.runwayLocationForm.get('fromRunwayEnd')?.value).toBe('South End')
    })

    it('should maintain form validity state', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Form should be valid as no validators are applied
        expect(component.runwayLocationForm.valid).toBe(true)

        component.runwayLocationForm.patchValue({
            lengthClosed: '1500',
            fromRunwayEnd: 'East End'
        })

        expect(component.runwayLocationForm.valid).toBe(true)
    })

    it('should handle empty string values in runwayLocation', () => {
        const mockModel: FaaNotamModel = {
            scenarioData: {
                runwayLocation: {
                    lengthClosed: '',
                    fromRunwayEnd: ''
                }
            }
        } as FaaNotamModel

        fixture.componentRef.setInput('model', mockModel)
        fixture.detectChanges()

        expect(component.runwayLocationForm.get('lengthClosed')?.value).toBe('')
        expect(component.runwayLocationForm.get('fromRunwayEnd')?.value).toBe('')
    })

    it('should correctly integrate with parent form', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        component.runwayLocationForm.patchValue({
            lengthClosed: '3000',
            fromRunwayEnd: 'West End'
        })

        const scenarioData = parentForm.get('scenarioData') as FormGroup
        const runwayLocation = scenarioData.get('runwayLocation') as FormGroup

        expect(runwayLocation.get('lengthClosed')?.value).toBe('3000')
        expect(runwayLocation.get('fromRunwayEnd')?.value).toBe('West End')
    })

    it('should render form template without errors', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const compiled = fixture.nativeElement as HTMLElement
        expect(compiled.querySelector('form')).toBeTruthy()
    })
})

