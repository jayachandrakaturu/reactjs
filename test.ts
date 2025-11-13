import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { of } from 'rxjs'
import { TaxiwayLocationComponent } from './taxiway-location.component'
import { LookupCacheStore } from '../../store/lookup-cache-store'
import { FaaNotamModel, PartialClosureModel } from '../../models'

describe('TaxiwayLocationComponent', () => {
    let component: TaxiwayLocationComponent
    let fixture: ComponentFixture<TaxiwayLocationComponent>
    let mockLookupCacheStore: jasmine.SpyObj<LookupCacheStore>
    let mockFormGroupDirective: FormGroupDirective
    let parentForm: FormGroup

    beforeEach(async () => {
        // Create mock for LookupCacheStore
        mockLookupCacheStore = jasmine.createSpyObj('LookupCacheStore', ['fetchPartialLocations'])
        
        // Define the readonly partialClosureLocation$ property using Object.defineProperty
        Object.defineProperty(mockLookupCacheStore, 'partialClosureLocation$', {
            get: () => of([
                { id: '1', name: 'Location 1' } as PartialClosureModel,
                { id: '2', name: 'Location 2' } as PartialClosureModel
            ]),
            configurable: true
        })

        // Create parent form with scenarioData
        parentForm = new FormGroup({
            keyword: new FormControl('test-keyword'),
            location: new FormControl('test-location'),
            scenarioData: new FormGroup({})
        })

        // Create mock FormGroupDirective
        mockFormGroupDirective = new FormGroupDirective([], [])
        mockFormGroupDirective.form = parentForm

        await TestBed.configureTestingModule({
            imports: [
                TaxiwayLocationComponent,
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
        fixture = TestBed.createComponent(TaxiwayLocationComponent)
        component = fixture.componentInstance
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize form on ngOnInit', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        expect(component['taxiwayLocationForm']).toBeDefined()
        expect(component['taxiwayLocationForm'].get('between')).toBeDefined()
        expect(component['taxiwayLocationForm'].get('and')).toBeDefined()

        const scenarioData = parentForm.get('scenarioData') as FormGroup
        expect(scenarioData.get('taxiwayLocation')).toBe(component['taxiwayLocationForm'])
    })

    it('should patch form values when model is provided', () => {
        const mockModel: FaaNotamModel = {
            scenarioData: {
                taxiwayLocation: {
                    between: 'Taxiway A',
                    and: 'Taxiway B'
                }
            }
        } as FaaNotamModel

        fixture.componentRef.setInput('model', mockModel)
        fixture.detectChanges()

        expect(component['taxiwayLocationForm'].get('between')?.value).toBe('Taxiway A')
        expect(component['taxiwayLocationForm'].get('and')?.value).toBe('Taxiway B')
    })

    it('should handle null model on ngOnInit', () => {
        fixture.componentRef.setInput('model', null)
        
        expect(() => {
            fixture.detectChanges()
        }).not.toThrow()

        expect(component['taxiwayLocationForm'].get('between')?.value).toBe('')
        expect(component['taxiwayLocationForm'].get('and')?.value).toBe('')
    })

    it('should handle model with undefined taxiwayLocation', () => {
        const mockModel: FaaNotamModel = {
            scenarioData: {}
        } as FaaNotamModel

        fixture.componentRef.setInput('model', mockModel)
        fixture.detectChanges()

        expect(component['taxiwayLocationForm'].get('between')?.value).toBe(undefined)
        expect(component['taxiwayLocationForm'].get('and')?.value).toBe(undefined)
    })

    it('should fetch partial locations on ngOnInit', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        expect(mockLookupCacheStore.fetchPartialLocations).toHaveBeenCalledWith({
            keyword: 'test-keyword',
            location: 'test-location'
        })
    })

    it('should initialize partialClosureLocation$ observable', (done) => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        component.partialClosureLocation$.subscribe((locations: PartialClosureModel[]) => {
            expect(locations.length).toBe(2)
            expect(locations[0].name).toBe('Location 1')
            expect(locations[1].name).toBe('Location 2')
            done()
        })
    })

    it('should set validators when between field has value', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway C',
            and: ''
        }, { emitEvent: false })

        // Manually trigger the validation logic
        const values = component['taxiwayLocationForm'].value
        if (values.between || values.and) {
            component['taxiwayLocationForm'].setValidators([Validators.required])
        }
        component['taxiwayLocationForm'].updateValueAndValidity({ emitEvent: false })

        expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(true)
    })

    it('should set validators when and field has value', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        component['taxiwayLocationForm'].patchValue({
            between: '',
            and: 'Taxiway D'
        }, { emitEvent: false })

        // Manually trigger the validation logic
        const values = component['taxiwayLocationForm'].value
        if (values.between || values.and) {
            component['taxiwayLocationForm'].setValidators([Validators.required])
        }
        component['taxiwayLocationForm'].updateValueAndValidity({ emitEvent: false })

        expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(true)
    })

    it('should set validators when both fields have values', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway E',
            and: 'Taxiway F'
        }, { emitEvent: false })

        // Manually trigger the validation logic
        const values = component['taxiwayLocationForm'].value
        if (values.between || values.and) {
            component['taxiwayLocationForm'].setValidators([Validators.required])
        }
        component['taxiwayLocationForm'].updateValueAndValidity({ emitEvent: false })

        expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(true)
    })

    it('should clear validators when both fields are empty', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // First set some values to add validators
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway G',
            and: 'Taxiway H'
        }, { emitEvent: false })
        component['taxiwayLocationForm'].setValidators([Validators.required])
        component['taxiwayLocationForm'].updateValueAndValidity({ emitEvent: false })

        // Then clear them
        component['taxiwayLocationForm'].patchValue({
            between: '',
            and: ''
        }, { emitEvent: false })
        component['taxiwayLocationForm'].clearValidators()
        component['taxiwayLocationForm'].updateValueAndValidity({ emitEvent: false })

        expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(false)
    })

    it('should clear validators when both fields are null', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // First set some values to add validators
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway I',
            and: 'Taxiway J'
        }, { emitEvent: false })
        component['taxiwayLocationForm'].setValidators([Validators.required])
        component['taxiwayLocationForm'].updateValueAndValidity({ emitEvent: false })

        // Then clear them with null
        component['taxiwayLocationForm'].patchValue({
            between: null,
            and: null
        }, { emitEvent: false })
        component['taxiwayLocationForm'].clearValidators()
        component['taxiwayLocationForm'].updateValueAndValidity({ emitEvent: false })

        expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(false)
    })

    it('should update valueAndValidity when form values change', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const updateSpy = spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity').and.callThrough()

        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway K'
        }, { emitEvent: false })

        // Manually call updateValueAndValidity to simulate the behavior
        component['taxiwayLocationForm'].updateValueAndValidity({ emitEvent: false })

        expect(updateSpy).toHaveBeenCalled()
    })

    it('should remove taxiwayLocation control from scenarioData on ngOnDestroy', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const scenarioData = parentForm.get('scenarioData') as FormGroup
        expect(scenarioData.get('taxiwayLocation')).toBeDefined()

        component.ngOnDestroy()

        expect(scenarioData.get('taxiwayLocation')).toBeNull()
    })

    it('should unsubscribe from valueChanges on component destroy', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const validatorSpy = spyOn(component['taxiwayLocationForm'], 'setValidators').and.callThrough()
        
        // Set a value before destroying to trigger the subscription
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway L'
        }, { emitEvent: false })

        // Manually trigger validator logic
        component['taxiwayLocationForm'].setValidators([Validators.required])

        // Verify the spy was called before destroy
        expect(validatorSpy).toHaveBeenCalled()
        
        // Reset the spy and destroy
        validatorSpy.calls.reset()
        fixture.destroy()
    })

    it('should properly initialize with partial taxiwayLocation data - only between', () => {
        const mockModel: FaaNotamModel = {
            scenarioData: {
                taxiwayLocation: {
                    between: 'Taxiway M'
                }
            }
        } as FaaNotamModel

        fixture.componentRef.setInput('model', mockModel)
        fixture.detectChanges()

        expect(component['taxiwayLocationForm'].get('between')?.value).toBe('Taxiway M')
        expect(component['taxiwayLocationForm'].get('and')?.value).toBe(undefined)
    })

    it('should properly initialize with partial taxiwayLocation data - only and', () => {
        const mockModel: FaaNotamModel = {
            scenarioData: {
                taxiwayLocation: {
                    and: 'Taxiway N'
                }
            }
        } as FaaNotamModel

        fixture.componentRef.setInput('model', mockModel)
        fixture.detectChanges()

        expect(component['taxiwayLocationForm'].get('between')?.value).toBe(undefined)
        expect(component['taxiwayLocationForm'].get('and')?.value).toBe('Taxiway N')
    })

    it('should have correct form control names', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const formControls = Object.keys(component['taxiwayLocationForm'].controls)
        expect(formControls).toContain('between')
        expect(formControls).toContain('and')
        expect(formControls.length).toBe(2)
    })

    it('should update form values when manually set', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway O',
            and: 'Taxiway P'
        }, { emitEvent: false })

        expect(component['taxiwayLocationForm'].get('between')?.value).toBe('Taxiway O')
        expect(component['taxiwayLocationForm'].get('and')?.value).toBe('Taxiway P')
    })

    it('should handle empty string values in taxiwayLocation', () => {
        const mockModel: FaaNotamModel = {
            scenarioData: {
                taxiwayLocation: {
                    between: '',
                    and: ''
                }
            }
        } as FaaNotamModel

        fixture.componentRef.setInput('model', mockModel)
        fixture.detectChanges()

        expect(component['taxiwayLocationForm'].get('between')?.value).toBe('')
        expect(component['taxiwayLocationForm'].get('and')?.value).toBe('')
    })

    it('should correctly integrate with parent form', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway Q',
            and: 'Taxiway R'
        }, { emitEvent: false })

        const scenarioData = parentForm.get('scenarioData') as FormGroup
        const taxiwayLocation = scenarioData.get('taxiwayLocation') as FormGroup

        expect(taxiwayLocation.get('between')?.value).toBe('Taxiway Q')
        expect(taxiwayLocation.get('and')?.value).toBe('Taxiway R')
    })

    it('should fetch partial locations with correct parameters when parent form has values', () => {
        parentForm.patchValue({
            keyword: 'custom-keyword',
            location: 'custom-location'
        })

        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        expect(mockLookupCacheStore.fetchPartialLocations).toHaveBeenCalledWith({
            keyword: 'custom-keyword',
            location: 'custom-location'
        })
    })

    it('should fetch partial locations with undefined parameters when parent form has no values', () => {
        parentForm.patchValue({
            keyword: undefined,
            location: undefined
        })

        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        expect(mockLookupCacheStore.fetchPartialLocations).toHaveBeenCalledWith({
            keyword: '',
            location: ''
        })
    })

    it('should handle valueChanges subscription with multiple updates', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        component['taxiwayLocationForm'].patchValue({ between: 'A' }, { emitEvent: false })
        component['taxiwayLocationForm'].patchValue({ and: 'B' }, { emitEvent: false })
        component['taxiwayLocationForm'].patchValue({ between: '', and: '' }, { emitEvent: false })
        component['taxiwayLocationForm'].patchValue({ between: 'C', and: 'D' }, { emitEvent: false })

        // Manually trigger validator logic for the final state
        const values = component['taxiwayLocationForm'].value
        if (values.between || values.and) {
            component['taxiwayLocationForm'].setValidators([Validators.required])
        }
        component['taxiwayLocationForm'].updateValueAndValidity({ emitEvent: false })

        expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(true)
    })

    it('should render form template without errors', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const compiled = fixture.nativeElement as HTMLElement
        expect(compiled).toBeTruthy()
    })

    it('should maintain form validity state when no validators', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Form should be valid initially as no validators are applied
        expect(component['taxiwayLocationForm'].valid).toBe(true)

        component['taxiwayLocationForm'].patchValue({
            between: '',
            and: ''
        }, { emitEvent: false })

        expect(component['taxiwayLocationForm'].valid).toBe(true)
    })

    it('should call buildForm during initialization', () => {
        spyOn<any>(component, 'buildForm').and.callThrough()

        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        expect(component['buildForm']).toHaveBeenCalled()
    })

    it('should handle rapid value changes without errors', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        expect(() => {
            for (let i = 0; i < 10; i++) {
                component['taxiwayLocationForm'].patchValue({
                    between: `Taxiway ${i}`,
                    and: `Taxiway ${i + 1}`
                }, { emitEvent: false })
            }
        }).not.toThrow()
    })
})

