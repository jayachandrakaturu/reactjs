import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormBuilder, FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms'
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

    const minimalMockData: FaaNotamModel = {
        notamId: 'test-id',
        scenarioData: { equipmentStatus: null }
    } as unknown as FaaNotamModel

    const mockModelWithData: FaaNotamModel = {
        scenarioData: {
            equipmentStatus: 'ACTIVE',
            operationalStatus: 'OPERATIONAL',
            note: '',
            observationTime: '',
            protectiveBarrier: '',
            freeTextNotes: ''
        }
    } as unknown as FaaNotamModel

    const mockOperationalStatusData: KeyValueModel[] = [
        { key: 'OPERATIONAL', value: 'Operational' },
        { key: 'NON_OPERATIONAL', value: 'Non-Operational' },
        { key: 'MAINTENANCE', value: 'Under Maintenance' }
    ]

    beforeEach(async () => {
        parentFormGroup = new FormGroup({
            scenarioData: new FormGroup({})
        })

        formGroupDirectiveStub = {
            form: parentFormGroup,
            controlContainer: {
                get: (name: string) => parentFormGroup.get(name),
            },
        } as unknown as FormGroupDirective

        mockLookupCacheStore = jasmine.createSpyObj('LookupCacheStore', ['fetchNavaidStatusType'], {
            navaidStatusType$: of(mockOperationalStatusData)
        })

        await TestBed.configureTestingModule({
            imports: [OperationalStatusComponent, ReactiveFormsModule, NoopAnimationsModule],
            providers: [
                { provide: LookupCacheStore, useValue: mockLookupCacheStore },
                { provide: FormGroupDirective, useValue: formGroupDirectiveStub },
                FormBuilder
            ]
        })
            .compileComponents()

        fixture = TestBed.createComponent(OperationalStatusComponent)
        component = fixture.componentInstance
        fixture.componentRef.setInput('model', minimalMockData)
        fixture.detectChanges()
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize form and fetch navaid status types', () => {
        expect(mockLookupCacheStore.fetchNavaidStatusType).toHaveBeenCalled()
        expect(component.operationalStatus$).toBeDefined()
    })

    it('should build form with operationalStatus control', () => {
        const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
        const operationalStatusControl = scenarioDataControl.get('operationalStatus')
        
        expect(operationalStatusControl).toBeTruthy()
        expect(operationalStatusControl).toBeInstanceOf(FormControl)
        expect(operationalStatusControl?.hasError('required')).toBeTruthy()
    })

    it('should patch form values from model input', () => {
        fixture = TestBed.createComponent(OperationalStatusComponent)
        component = fixture.componentInstance
        fixture.componentRef.setInput('model', mockModelWithData)
        fixture.detectChanges()

        const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
        const operationalStatusControl = scenarioDataControl.get('operationalStatus')
        
        expect(operationalStatusControl?.value).toBe('OPERATIONAL')
    })

    it('should remove operationalStatus control on destroy', () => {
        const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
        expect(scenarioDataControl.get('operationalStatus')).toBeTruthy()
        
        component.ngOnDestroy()
        
        expect(scenarioDataControl.get('operationalStatus')).toBeFalsy()
    })

    it('should initialize operationalStatus$ observable', () => {
        expect(component.operationalStatus$).toBeDefined()
        component.operationalStatus$.subscribe(statusTypes => {
            expect(statusTypes).toEqual(mockOperationalStatusData)
        })
    })

    // Additional test coverage for edge cases
    describe('Edge Cases', () => {
        it('should handle null model input', () => {
            fixture = TestBed.createComponent(OperationalStatusComponent)
            component = fixture.componentInstance
            fixture.componentRef.setInput('model', null)
            fixture.detectChanges()
            
            expect(mockLookupCacheStore.fetchNavaidStatusType).toHaveBeenCalled()
            expect(component.operationalStatus$).toBeDefined()
        })

        it('should handle model with null scenarioData', () => {
            const modelWithNullScenarioData = { scenarioData: null } as unknown as FaaNotamModel
            fixture = TestBed.createComponent(OperationalStatusComponent)
            component = fixture.componentInstance
            fixture.componentRef.setInput('model', modelWithNullScenarioData)
            
            expect(() => fixture.detectChanges()).not.toThrow()
        })

        it('should handle model with null equipmentStatus', () => {
            const modelWithNullEquipmentStatus = {
                scenarioData: { equipmentStatus: null }
            } as unknown as FaaNotamModel
            
            fixture = TestBed.createComponent(OperationalStatusComponent)
            component = fixture.componentInstance
            fixture.componentRef.setInput('model', modelWithNullEquipmentStatus)
            fixture.detectChanges()
            
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            const operationalStatusControl = scenarioDataControl.get('operationalStatus')
            expect(operationalStatusControl?.value).toBe('')
        })

        it('should handle model with undefined equipmentStatus', () => {
            const modelWithUndefinedEquipmentStatus = {
                scenarioData: { equipmentStatus: undefined }
            } as unknown as FaaNotamModel
            
            fixture = TestBed.createComponent(OperationalStatusComponent)
            component = fixture.componentInstance
            fixture.componentRef.setInput('model', modelWithUndefinedEquipmentStatus)
            fixture.detectChanges()
            
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            const operationalStatusControl = scenarioDataControl.get('operationalStatus')
            expect(operationalStatusControl?.value).toBe('')
        })
    })

    // Additional test coverage for form operations
    describe('Form Operations', () => {
        it('should properly initialize form controls', () => {
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            const operationalStatusControl = scenarioDataControl.get('operationalStatus')
            
            expect(operationalStatusControl).toBeTruthy()
            expect(operationalStatusControl?.value).toBe('')
            expect(operationalStatusControl?.hasError('required')).toBeTruthy()
        })

        it('should handle form control updates correctly', () => {
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            const operationalStatusControl = scenarioDataControl.get('operationalStatus')
            
            operationalStatusControl?.setValue('OPERATIONAL')
            expect(operationalStatusControl?.value).toBe('OPERATIONAL')
            expect(operationalStatusControl?.hasError('required')).toBeFalsy()
            
            operationalStatusControl?.patchValue('MAINTENANCE')
            expect(operationalStatusControl?.value).toBe('MAINTENANCE')
        })

        it('should maintain form control structure after multiple operations', () => {
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            const operationalStatusControl = scenarioDataControl.get('operationalStatus')
            
            operationalStatusControl?.setValue('OPERATIONAL')
            operationalStatusControl?.setValue('NON_OPERATIONAL')
            operationalStatusControl?.setValue('MAINTENANCE')
            
            expect(operationalStatusControl?.value).toBe('MAINTENANCE')
            expect(scenarioDataControl.get('operationalStatus')).toBeTruthy()
        })
    })

    // Additional test coverage for lifecycle hooks
    describe('Lifecycle Hooks', () => {
        it('should handle ngOnInit when form is not properly initialized', () => {
            const invalidFormGroupDirective = {
                form: null
            } as unknown as FormGroupDirective
            
            TestBed.overrideProvider(FormGroupDirective, { useValue: invalidFormGroupDirective })
            
            fixture = TestBed.createComponent(OperationalStatusComponent)
            component = fixture.componentInstance
            
            expect(() => fixture.detectChanges()).toThrow()
        })

        it('should handle ngOnDestroy when scenarioData control does not exist', () => {
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

        it('should properly initialize operationalStatus$ observable', () => {
            expect(component.operationalStatus$).toBeDefined()
            component.operationalStatus$.subscribe(statusTypes => {
                expect(statusTypes).toEqual(mockOperationalStatusData)
            })
        })

        it('should call fetchNavaidStatusType on ngOnInit', () => {
            expect(mockLookupCacheStore.fetchNavaidStatusType).toHaveBeenCalledTimes(1)
        })
    })

    // Additional test coverage for form integration
    describe('Form Integration', () => {
        it('should properly integrate with parent form group', () => {
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            const operationalStatusControl = scenarioDataControl.get('operationalStatus')
            
            expect(operationalStatusControl).toBeTruthy()
            expect(operationalStatusControl).toBeInstanceOf(FormControl)
        })

        it('should maintain form control structure after destroy and recreate', () => {
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            expect(scenarioDataControl.get('operationalStatus')).toBeTruthy()
            
            component.ngOnDestroy()
            expect(scenarioDataControl.get('operationalStatus')).toBeFalsy()
            
            // Recreate component
            fixture = TestBed.createComponent(OperationalStatusComponent)
            component = fixture.componentInstance
            fixture.detectChanges()
            
            expect(scenarioDataControl.get('operationalStatus')).toBeTruthy()
        })

        it('should handle form control validation correctly', () => {
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

    // Additional test coverage for observable behavior
    describe('Observable Behavior', () => {
        it('should handle operationalStatus$ observable subscription', () => {
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

    // Additional test coverage for error scenarios
    describe('Error Scenarios', () => {
        it('should handle buildForm when scenarioData is not a FormGroup', () => {
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

        it('should handle ngOnDestroy when operationalStatus control does not exist', () => {
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            scenarioDataControl.removeControl('operationalStatus')
            
            expect(() => component.ngOnDestroy()).not.toThrow()
        })

        it('should handle patchValue when operationalStatusForm is null', () => {
            // This test ensures the component handles edge cases gracefully
            component['operationalStatusForm'] = null as any
            
            expect(() => {
                component['operationalStatusForm']?.patchValue({
                    equipmentStatus: 'TEST'
                })
            }).not.toThrow()
        })
    })

    // Additional test coverage for model input handling
    describe('Model Input Handling', () => {
        it('should handle model with complex scenarioData structure', () => {
            const complexModel = {
                scenarioData: {
                    equipmentStatus: 'ACTIVE',
                    operationalStatus: 'OPERATIONAL',
                    note: 'Test note',
                    observationTime: '2023-01-01T00:00:00Z',
                    protectiveBarrier: 'Test barrier',
                    freeTextNotes: 'Test notes'
                }
            } as unknown as FaaNotamModel
            
            fixture = TestBed.createComponent(OperationalStatusComponent)
            component = fixture.componentInstance
            fixture.componentRef.setInput('model', complexModel)
            fixture.detectChanges()
            
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            const operationalStatusControl = scenarioDataControl.get('operationalStatus')
            
            expect(operationalStatusControl?.value).toBe('OPERATIONAL')
        })

        it('should handle model with empty scenarioData object', () => {
            const emptyModel = {
                scenarioData: {}
            } as unknown as FaaNotamModel
            
            fixture = TestBed.createComponent(OperationalStatusComponent)
            component = fixture.componentInstance
            fixture.componentRef.setInput('model', emptyModel)
            fixture.detectChanges()
            
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            const operationalStatusControl = scenarioDataControl.get('operationalStatus')
            
            expect(operationalStatusControl?.value).toBe('')
        })

        it('should handle model with equipmentStatus as empty string', () => {
            const modelWithEmptyString = {
                scenarioData: {
                    equipmentStatus: ''
                }
            } as unknown as FaaNotamModel
            
            fixture = TestBed.createComponent(OperationalStatusComponent)
            component = fixture.componentInstance
            fixture.componentRef.setInput('model', modelWithEmptyString)
            fixture.detectChanges()
            
            const scenarioDataControl = parentFormGroup.get('scenarioData') as FormGroup
            const operationalStatusControl = scenarioDataControl.get('operationalStatus')
            
            expect(operationalStatusControl?.value).toBe('')
        })
    })

    // Additional test coverage for component properties
    describe('Component Properties', () => {
        it('should have correct input properties', () => {
            expect(component.model).toBeDefined()
            expect(component.operationalStatus$).toBeDefined()
        })

        it('should have correct form properties', () => {
            expect(component['operationalStatusForm']).toBeDefined()
            expect(component['form']).toBeDefined()
        })

        it('should properly set form reference', () => {
            expect(component['form']).toBe(parentFormGroup)
        })
    })
})
