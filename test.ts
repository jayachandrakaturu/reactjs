import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { of } from 'rxjs'
import { FaaNotamModel, KeyValueModel } from '../../models'
import { LookupCacheStore } from '../../store/lookup-cache-store'
import { OperationalStatusComponent } from './navaid-status.component'

describe('OperationalStatusComponent', () => {
    let component: OperationalStatusComponent
    let fixture: ComponentFixture<OperationalStatusComponent>
    let mockLookupCacheStore: jasmine.SpyObj<LookupCacheStore>
    let parentFormGroup: FormGroup
    let formGroupDirectiveStub: FormGroupDirective

    const mockOperationalStatusData: KeyValueModel[] = [
        { key: 'OPERATIONAL', value: 'Operational' },
        { key: 'NON_OPERATIONAL', value: 'Non-Operational' },
        { key: 'MAINTENANCE', value: 'Under Maintenance' }
    ]

    const createMockModel = (scenarioData: any = null): FaaNotamModel => ({
        notamId: 'test-id',
        scenarioData
    } as unknown as FaaNotamModel)

    beforeEach(async () => {
        parentFormGroup = new FormGroup({
            scenarioData: new FormGroup({})
        })

        formGroupDirectiveStub = {
            form: parentFormGroup
        } as unknown as FormGroupDirective

        mockLookupCacheStore = jasmine.createSpyObj('LookupCacheStore', ['fetchNavaidStatusType'], {
            navaidStatusType$: of(mockOperationalStatusData)
        })

        await TestBed.configureTestingModule({
            imports: [OperationalStatusComponent, ReactiveFormsModule, NoopAnimationsModule],
            providers: [
                { provide: LookupCacheStore, useValue: mockLookupCacheStore },
                { provide: FormGroupDirective, useValue: formGroupDirectiveStub }
            ]
        }).compileComponents()

        fixture = TestBed.createComponent(OperationalStatusComponent)
        component = fixture.componentInstance
    })

    describe('Component Initialization', () => {
        it('should create', () => {
            expect(component).toBeTruthy()
        })

        it('should initialize with null model', () => {
            fixture.componentRef.setInput('model', null)
            fixture.detectChanges()
            
            expect(component).toBeTruthy()
            expect(mockLookupCacheStore.fetchNavaidStatusType).toHaveBeenCalled()
        })

        it('should initialize with valid model', () => {
            const mockModel = createMockModel({ equipmentStatus: 'ACTIVE' })
            fixture.componentRef.setInput('model', mockModel)
            fixture.detectChanges()
            
            expect(component).toBeTruthy()
            expect(mockLookupCacheStore.fetchNavaidStatusType).toHaveBeenCalled()
        })
    })

    describe('ngOnInit', () => {
        it('should initialize form and fetch navaid status types', () => {
            fixture.componentRef.setInput('model', createMockModel())
            fixture.detectChanges()
            
            expect(mockLookupCacheStore.fetchNavaidStatusType).toHaveBeenCalled()
            expect(component.operationalStatus$).toBeDefined()
        })

        it('should set operationalStatus$ observable', () => {
            fixture.componentRef.setInput('model', createMockModel())
            fixture.detectChanges()
            
            expect(component.operationalStatus$).toBeDefined()
            component.operationalStatus$.subscribe(statusTypes => {
                expect(statusTypes).toEqual(mockOperationalStatusData)
            })
        })

        it('should patch form values when model has equipmentStatus', () => {
            const mockModel = createMockModel({ equipmentStatus: 'ACTIVE' })
            fixture.componentRef.setInput('model', mockModel)
            fixture.detectChanges()
            
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            const operationalStatusControl = scenarioDataControl.get('operationalStatus')
            
            expect(operationalStatusControl?.value).toBe('ACTIVE')
        })

        it('should handle model with null scenarioData', () => {
            const mockModel = createMockModel(null)
            fixture.componentRef.setInput('model', mockModel)
            
            expect(() => fixture.detectChanges()).not.toThrow()
        })

        it('should handle model with undefined equipmentStatus', () => {
            const mockModel = createMockModel({ equipmentStatus: undefined })
            fixture.componentRef.setInput('model', mockModel)
            fixture.detectChanges()
            
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            const operationalStatusControl = scenarioDataControl.get('operationalStatus')
            
            expect(operationalStatusControl?.value).toBe('')
        })

        it('should handle model with empty string equipmentStatus', () => {
            const mockModel = createMockModel({ equipmentStatus: '' })
            fixture.componentRef.setInput('model', mockModel)
            fixture.detectChanges()
            
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            const operationalStatusControl = scenarioDataControl.get('operationalStatus')
            
            expect(operationalStatusControl?.value).toBe('')
        })

        it('should not patch form when operationalStatusForm is null', () => {
            // Access private property for testing
            component['operationalStatusForm'] = null as any
            
            const mockModel = createMockModel({ equipmentStatus: 'ACTIVE' })
            fixture.componentRef.setInput('model', mockModel)
            
            expect(() => fixture.detectChanges()).not.toThrow()
        })

        it('should not patch form when operationalStatus control does not exist', () => {
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            scenarioDataControl.removeControl('operationalStatus')
            
            const mockModel = createMockModel({ equipmentStatus: 'ACTIVE' })
            fixture.componentRef.setInput('model', mockModel)
            
            expect(() => fixture.detectChanges()).not.toThrow()
        })
    })

    describe('buildForm', () => {
        it('should build form with operationalStatus control', () => {
            fixture.componentRef.setInput('model', createMockModel())
            fixture.detectChanges()
            
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            const operationalStatusControl = scenarioDataControl.get('operationalStatus')
            
            expect(operationalStatusControl).toBeTruthy()
            expect(operationalStatusControl).toBeInstanceOf(FormControl)
            expect(operationalStatusControl?.hasError('required')).toBeTruthy()
        })

        it('should not add control if it already exists', () => {
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            scenarioDataControl.addControl('operationalStatus', new FormControl('existing'))
            
            fixture.componentRef.setInput('model', createMockModel())
            fixture.detectChanges()
            
            const operationalStatusControl = scenarioDataControl.get('operationalStatus')
            expect(operationalStatusControl?.value).toBe('existing')
        })

        it('should handle when scenarioData is not a FormGroup', () => {
            const invalidParentForm = new FormGroup({
                scenarioData: new FormControl('not-a-form-group')
            })
            
            const invalidFormGroupDirective = {
                form: invalidParentForm
            } as unknown as FormGroupDirective
            
            TestBed.overrideProvider(FormGroupDirective, { useValue: invalidFormGroupDirective })
            
            fixture = TestBed.createComponent(OperationalStatusComponent)
            component = fixture.componentInstance
            
            expect(() => fixture.detectChanges()).toThrow()
        })

        it('should handle when scenarioData control does not exist', () => {
            const formWithoutScenarioData = new FormGroup({})
            const formGroupDirectiveWithoutScenarioData = {
                form: formWithoutScenarioData
            } as unknown as FormGroupDirective
            
            TestBed.overrideProvider(FormGroupDirective, { useValue: formGroupDirectiveWithoutScenarioData })
            
            fixture = TestBed.createComponent(OperationalStatusComponent)
            component = fixture.componentInstance
            
            expect(() => fixture.detectChanges()).not.toThrow()
        })
    })

    describe('ngOnDestroy', () => {
        it('should remove operationalStatus control on destroy', () => {
            fixture.componentRef.setInput('model', createMockModel())
            fixture.detectChanges()
            
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            expect(scenarioDataControl.get('operationalStatus')).toBeTruthy()
            
            component.ngOnDestroy()
            
            expect(scenarioDataControl.get('operationalStatus')).toBeFalsy()
        })

        it('should handle destroy when operationalStatus control does not exist', () => {
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            scenarioDataControl.removeControl('operationalStatus')
            
            expect(() => component.ngOnDestroy()).not.toThrow()
        })

        it('should handle destroy when operationalStatusForm is null', () => {
            component['operationalStatusForm'] = null as any
            
            expect(() => component.ngOnDestroy()).not.toThrow()
        })

        it('should handle destroy when scenarioData control does not exist', () => {
            const formWithoutScenarioData = new FormGroup({})
            const formGroupDirectiveWithoutScenarioData = {
                form: formWithoutScenarioData
            } as unknown as FormGroupDirective
            
            TestBed.overrideProvider(FormGroupDirective, { useValue: formGroupDirectiveWithoutScenarioData })
            
            fixture = TestBed.createComponent(OperationalStatusComponent)
            component = fixture.componentInstance
            fixture.detectChanges()
            
            expect(() => component.ngOnDestroy()).not.toThrow()
        })
    })

    describe('Form Operations', () => {
        it('should properly initialize form controls with validation', () => {
            fixture.componentRef.setInput('model', createMockModel())
            fixture.detectChanges()
            
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            const operationalStatusControl = scenarioDataControl.get('operationalStatus')
            
            expect(operationalStatusControl).toBeTruthy()
            expect(operationalStatusControl?.value).toBe('')
            expect(operationalStatusControl?.hasError('required')).toBeTruthy()
        })

        it('should handle form control updates correctly', () => {
            fixture.componentRef.setInput('model', createMockModel())
            fixture.detectChanges()
            
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            const operationalStatusControl = scenarioDataControl.get('operationalStatus')
            
            operationalStatusControl?.setValue('OPERATIONAL')
            expect(operationalStatusControl?.value).toBe('OPERATIONAL')
            expect(operationalStatusControl?.hasError('required')).toBeFalsy()
            
            operationalStatusControl?.patchValue('MAINTENANCE')
            expect(operationalStatusControl?.value).toBe('MAINTENANCE')
        })

        it('should maintain form control structure after multiple operations', () => {
            fixture.componentRef.setInput('model', createMockModel())
            fixture.detectChanges()
            
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            const operationalStatusControl = scenarioDataControl.get('operationalStatus')
            
            operationalStatusControl?.setValue('OPERATIONAL')
            operationalStatusControl?.setValue('NON_OPERATIONAL')
            operationalStatusControl?.setValue('MAINTENANCE')
            
            expect(operationalStatusControl?.value).toBe('MAINTENANCE')
            expect(scenarioDataControl.get('operationalStatus')).toBeTruthy()
        })

        it('should handle form control validation correctly', () => {
            fixture.componentRef.setInput('model', createMockModel())
            fixture.detectChanges()
            
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            const operationalStatusControl = scenarioDataControl.get('operationalStatus')
            
            // Initially should be invalid (required)
            expect(operationalStatusControl?.invalid).toBeTruthy()
            expect(operationalStatusControl?.hasError('required')).toBeTruthy()
            
            // Set value should make it valid
            operationalStatusControl?.setValue('OPERATIONAL')
            expect(operationalStatusControl?.valid).toBeTruthy()
            expect(operationalStatusControl?.hasError('required')).toBeFalsy()
            
            // Clear value should make it invalid again
            operationalStatusControl?.setValue('')
            expect(operationalStatusControl?.invalid).toBeTruthy()
            expect(operationalStatusControl?.hasError('required')).toBeTruthy()
        })
    })

    describe('Observable Behavior', () => {
        it('should handle operationalStatus$ observable subscription', () => {
            fixture.componentRef.setInput('model', createMockModel())
            fixture.detectChanges()
            
            let emittedValues: any[] = []
            const subscription = component.operationalStatus$.subscribe(value => {
                emittedValues.push(value)
            })
            
            expect(emittedValues.length).toBe(1)
            expect(emittedValues[0]).toEqual(mockOperationalStatusData)
            
            subscription.unsubscribe()
        })

        it('should handle empty operationalStatus$ observable', () => {
            const emptyMockStore = jasmine.createSpyObj('LookupCacheStore', ['fetchNavaidStatusType'], {
                navaidStatusType$: of([])
            })
            
            TestBed.overrideProvider(LookupCacheStore, { useValue: emptyMockStore })
            
            fixture = TestBed.createComponent(OperationalStatusComponent)
            component = fixture.componentInstance
            fixture.detectChanges()
            
            component.operationalStatus$.subscribe(statusTypes => {
                expect(statusTypes).toEqual([])
            })
        })

        it('should handle operationalStatus$ observable with null values', () => {
            const nullMockStore = jasmine.createSpyObj('LookupCacheStore', ['fetchNavaidStatusType'], {
                navaidStatusType$: of(null)
            })
            
            TestBed.overrideProvider(LookupCacheStore, { useValue: nullMockStore })
            
            fixture = TestBed.createComponent(OperationalStatusComponent)
            component = fixture.componentInstance
            fixture.detectChanges()
            
            component.operationalStatus$.subscribe(statusTypes => {
                expect(statusTypes).toBeNull()
            })
        })
    })

    describe('Component Properties', () => {
        it('should have correct input properties', () => {
            expect(component.model).toBeDefined()
            expect(component.operationalStatus$).toBeDefined()
        })

        it('should have correct form properties', () => {
            fixture.componentRef.setInput('model', createMockModel())
            fixture.detectChanges()
            
            expect(component['operationalStatusForm']).toBeDefined()
            expect(component['form']).toBeDefined()
        })

        it('should properly set form reference', () => {
            fixture.componentRef.setInput('model', createMockModel())
            fixture.detectChanges()
            
            expect(component['form']).toBe(parentFormGroup)
        })
    })

    describe('Edge Cases', () => {
        it('should handle complex model structure', () => {
            const complexModel = createMockModel({
                equipmentStatus: 'ACTIVE',
                operationalStatus: 'OPERATIONAL',
                note: 'Test note',
                observationTime: '2023-01-01T00:00:00Z',
                protectiveBarrier: 'Test barrier',
                freeTextNotes: 'Test notes'
            })
            
            fixture.componentRef.setInput('model', complexModel)
            fixture.detectChanges()
            
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            const operationalStatusControl = scenarioDataControl.get('operationalStatus')
            
            expect(operationalStatusControl?.value).toBe('ACTIVE')
        })

        it('should handle model with empty scenarioData object', () => {
            const emptyModel = createMockModel({})
            fixture.componentRef.setInput('model', emptyModel)
            fixture.detectChanges()
            
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            const operationalStatusControl = scenarioDataControl.get('operationalStatus')
            
            expect(operationalStatusControl?.value).toBe('')
        })

        it('should handle form recreation after destroy', () => {
            fixture.componentRef.setInput('model', createMockModel())
            fixture.detectChanges()
            
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            expect(scenarioDataControl.get('operationalStatus')).toBeTruthy()
            
            component.ngOnDestroy()
            expect(scenarioDataControl.get('operationalStatus')).toBeFalsy()
            
            // Recreate component
            fixture = TestBed.createComponent(OperationalStatusComponent)
            component = fixture.componentInstance
            fixture.componentRef.setInput('model', createMockModel())
            fixture.detectChanges()
            
            expect(scenarioDataControl.get('operationalStatus')).toBeTruthy()
        })
    })
})
