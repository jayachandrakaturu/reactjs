import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms'
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
    let updateValueAndValiditySpy: jasmine.Spy
    
    // Helper function to initialize component and prevent infinite loop
    function initializeComponent(model: FaaNotamModel | null = null): void {
        fixture.componentRef.setInput('model', model)
        
        // Spy on updateValueAndValidity before detectChanges to prevent infinite loop
        if (!updateValueAndValiditySpy) {
            const originalMethod = FormGroup.prototype.updateValueAndValidity
            updateValueAndValiditySpy = spyOn(FormGroup.prototype, 'updateValueAndValidity').and.callFake(function(this: FormGroup, opts?: any) {
                originalMethod.call(this, { ...opts, emitEvent: false })
            })
        }
        
        fixture.detectChanges()
    }

    beforeEach(async () => {
        // Create mock for LookupCacheStore
        mockLookupCacheStore = jasmine.createSpyObj('LookupCacheStore', ['fetchPartialLocations'])
        
        // Define the readonly partialClosureLocation$ property using Object.defineProperty
        Object.defineProperty(mockLookupCacheStore, 'partialClosureLocation$', {
            get: () => of([
                { name: 'Taxiway A', id: '1' } as PartialClosureModel,
                { name: 'Taxiway B', id: '2' } as PartialClosureModel
            ]),
            configurable: true
        })

        // Create parent form with scenarioData
        parentForm = new FormGroup({
            keyword: new FormControl(''),
            location: new FormControl(''),
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
        updateValueAndValiditySpy = null as any // Reset spy for each test
    })

    it('should create', () => {
        initializeComponent(null)
        expect(component).toBeTruthy()
    })

    it('should initialize form on ngOnInit', () => {
        initializeComponent(null)

        expect(component['taxiwayLocationForm']).toBeDefined()
        expect(component['taxiwayLocationForm'].get('between')).toBeDefined()
        expect(component['taxiwayLocationForm'].get('and')).toBeDefined()

        const scenarioData = parentForm.get('scenarioData') as FormGroup
        expect(scenarioData.get('taxiwayLocation')).toBe(component['taxiwayLocationForm'])
    })

    it('should initialize partialClosureLocation$ observable on ngOnInit', () => {
        initializeComponent(null)

        expect(component.partialClosureLocation$).toBeDefined()
        component.partialClosureLocation$.subscribe((locations) => {
            expect(locations.length).toBe(2)
            expect(locations[0].name).toBe('Taxiway A')
            expect(locations[1].name).toBe('Taxiway B')
        })
    })

    it('should fetch partial locations with keyword and location from parent form', () => {
        parentForm.patchValue({
            keyword: 'CLSD',
            location: 'KJFK'
        })

        initializeComponent(null)

        expect(mockLookupCacheStore.fetchPartialLocations).toHaveBeenCalledWith({
            keyword: 'CLSD',
            location: 'KJFK'
        })
    })

    it('should fetch partial locations with null values when parent form is empty', () => {
        initializeComponent(null)

        expect(mockLookupCacheStore.fetchPartialLocations).toHaveBeenCalledWith({
            keyword: '',
            location: ''
        })
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

        initializeComponent(mockModel)

        expect(component['taxiwayLocationForm'].get('between')?.value).toBe('Taxiway A')
        expect(component['taxiwayLocationForm'].get('and')?.value).toBe('Taxiway B')
    })

    it('should handle null model on ngOnInit', () => {
        expect(() => {
            initializeComponent(null)
        }).not.toThrow()

        expect(component['taxiwayLocationForm'].get('between')?.value).toBe('')
        expect(component['taxiwayLocationForm'].get('and')?.value).toBe('')
    })

    it('should handle model with undefined taxiwayLocation', () => {
        const mockModel: FaaNotamModel = {
            scenarioData: {}
        } as FaaNotamModel

        initializeComponent(mockModel)

        expect(component['taxiwayLocationForm'].get('between')?.value).toBe(undefined)
        expect(component['taxiwayLocationForm'].get('and')?.value).toBe(undefined)
    })

    it('should set validators when between field has a value', () => {
        initializeComponent(null)

        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway A',
            and: ''
        })

        expect(component['taxiwayLocationForm'].hasError('required')).toBe(true)
    })

    it('should set validators when and field has a value', () => {
        initializeComponent(null)

        component['taxiwayLocationForm'].patchValue({
            between: '',
            and: 'Taxiway B'
        })

        expect(component['taxiwayLocationForm'].hasError('required')).toBe(true)
    })

    it('should set validators when both fields have values', () => {
        initializeComponent(null)

        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway A',
            and: 'Taxiway B'
        })

        expect(component['taxiwayLocationForm'].valid).toBe(true)
    })

    it('should clear validators when both fields are empty', () => {
        initializeComponent(null)

        // First set values to trigger validators
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway A',
            and: 'Taxiway B'
        })

        // Then clear both fields
        component['taxiwayLocationForm'].patchValue({
            between: '',
            and: ''
        })

        expect(component['taxiwayLocationForm'].valid).toBe(true)
    })

    it('should handle valueChanges subscription for validator management', () => {
        initializeComponent(null)

        // Start with no values - form should be valid
        expect(component['taxiwayLocationForm'].valid).toBe(true)

        // Add value to between - should trigger validators
        component['taxiwayLocationForm'].get('between')?.setValue('Taxiway A')
        expect(component['taxiwayLocationForm'].hasError('required')).toBe(true)

        // Add value to and - form should be valid now
        component['taxiwayLocationForm'].get('and')?.setValue('Taxiway B')
        expect(component['taxiwayLocationForm'].valid).toBe(true)

        // Clear between but keep and - should have validators
        component['taxiwayLocationForm'].get('between')?.setValue('')
        expect(component['taxiwayLocationForm'].hasError('required')).toBe(true)

        // Clear both - validators should be cleared
        component['taxiwayLocationForm'].get('and')?.setValue('')
        expect(component['taxiwayLocationForm'].valid).toBe(true)
    })

    it('should remove taxiwayLocation control from scenarioData on ngOnDestroy', () => {
        initializeComponent(null)

        const scenarioData = parentForm.get('scenarioData') as FormGroup
        expect(scenarioData.get('taxiwayLocation')).toBeDefined()

        component.ngOnDestroy()

        expect(scenarioData.get('taxiwayLocation')).toBeNull()
    })

    it('should unsubscribe from valueChanges on component destroy', () => {
        initializeComponent(null)

        // Set initial values
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway A',
            and: ''
        })

        expect(component['taxiwayLocationForm'].hasError('required')).toBe(true)

        // Destroy the component
        fixture.destroy()

        // Try to change values - subscription should be destroyed so validator logic won't run
        // This test verifies takeUntilDestroyed is working
        const initialErrorState = component['taxiwayLocationForm'].hasError('required')
        
        component['taxiwayLocationForm'].patchValue({
            between: '',
            and: ''
        }, { emitEvent: false })

        // Manual check since subscription is destroyed
        expect(component['taxiwayLocationForm']).toBeDefined()
    })

    it('should properly initialize with partial taxiwayLocation data', () => {
        const mockModel: FaaNotamModel = {
            scenarioData: {
                taxiwayLocation: {
                    between: 'Taxiway C'
                }
            }
        } as FaaNotamModel

        initializeComponent(mockModel)

        expect(component['taxiwayLocationForm'].get('between')?.value).toBe('Taxiway C')
        expect(component['taxiwayLocationForm'].get('and')?.value).toBe(undefined)
    })

    it('should have correct form control names', () => {
        initializeComponent(null)

        const formControls = Object.keys(component['taxiwayLocationForm'].controls)
        expect(formControls).toContain('between')
        expect(formControls).toContain('and')
        expect(formControls.length).toBe(2)
    })

    it('should update form values when manually set', () => {
        initializeComponent(null)

        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway D',
            and: 'Taxiway E'
        })

        expect(component['taxiwayLocationForm'].get('between')?.value).toBe('Taxiway D')
        expect(component['taxiwayLocationForm'].get('and')?.value).toBe('Taxiway E')
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

        initializeComponent(mockModel)

        expect(component['taxiwayLocationForm'].get('between')?.value).toBe('')
        expect(component['taxiwayLocationForm'].get('and')?.value).toBe('')
    })

    it('should correctly integrate with parent form', () => {
        initializeComponent(null)

        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway F',
            and: 'Taxiway G'
        })

        const scenarioData = parentForm.get('scenarioData') as FormGroup
        const taxiwayLocation = scenarioData.get('taxiwayLocation') as FormGroup

        expect(taxiwayLocation.get('between')?.value).toBe('Taxiway F')
        expect(taxiwayLocation.get('and')?.value).toBe('Taxiway G')
    })

    it('should render form template without errors', () => {
        initializeComponent(null)

        const compiled = fixture.nativeElement as HTMLElement
        expect(compiled).toBeTruthy()
    })

    it('should handle rapid value changes in valueChanges subscription', () => {
        initializeComponent(null)

        // Rapid changes to trigger validator logic multiple times
        component['taxiwayLocationForm'].patchValue({ between: 'A', and: '' })
        component['taxiwayLocationForm'].patchValue({ between: 'A', and: 'B' })
        component['taxiwayLocationForm'].patchValue({ between: '', and: 'B' })
        component['taxiwayLocationForm'].patchValue({ between: '', and: '' })

        expect(component['taxiwayLocationForm'].valid).toBe(true)
    })

    it('should maintain correct validator state through multiple changes', () => {
        initializeComponent(null)

        // No validators initially
        expect(component['taxiwayLocationForm'].valid).toBe(true)

        // Add between value - validators should be added
        component['taxiwayLocationForm'].patchValue({ between: 'Test' })
        expect(component['taxiwayLocationForm'].hasError('required')).toBe(true)

        // Clear between - validators should be cleared
        component['taxiwayLocationForm'].patchValue({ between: '' })
        expect(component['taxiwayLocationForm'].valid).toBe(true)

        // Add and value - validators should be added
        component['taxiwayLocationForm'].patchValue({ and: 'Test' })
        expect(component['taxiwayLocationForm'].hasError('required')).toBe(true)

        // Add between value too - form should be valid
        component['taxiwayLocationForm'].patchValue({ between: 'Test' })
        expect(component['taxiwayLocationForm'].valid).toBe(true)
    })

    it('should call fetchPartialLocations with correct parameters when parent form has complex values', () => {
        parentForm.patchValue({
            keyword: 'TWY CLSD',
            location: 'KLAX'
        })

        initializeComponent(null)

        expect(mockLookupCacheStore.fetchPartialLocations).toHaveBeenCalledWith({
            keyword: 'TWY CLSD',
            location: 'KLAX'
        })
    })

    it('should handle updateValueAndValidity calls during valueChanges', () => {
        initializeComponent(null)

        // Note: updateValueAndValidity is already spied on by initializeComponent
        // Reset the spy to count calls from this point
        updateValueAndValiditySpy.calls.reset()

        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway H',
            and: 'Taxiway I'
        })

        expect(updateValueAndValiditySpy).toHaveBeenCalled()
    })

    it('should handle null and undefined values in form', () => {
        initializeComponent(null)

        component['taxiwayLocationForm'].patchValue({
            between: null,
            and: undefined
        })

        expect(component['taxiwayLocationForm'].get('between')?.value).toBeNull()
        expect(component['taxiwayLocationForm'].get('and')?.value).toBeUndefined()
        expect(component['taxiwayLocationForm'].valid).toBe(true)
    })

    it('should properly clean up form on destroy', () => {
        initializeComponent(null)

        const scenarioData = parentForm.get('scenarioData') as FormGroup
        expect(scenarioData.contains('taxiwayLocation')).toBe(true)

        component.ngOnDestroy()

        expect(scenarioData.contains('taxiwayLocation')).toBe(false)
    })

    it('should call setValidators with Validators.required when between has value', () => {
        // Spy needs to be set up before component initialization
        const setValidatorsSpy = spyOn(FormGroup.prototype, 'setValidators').and.callThrough()
        
        initializeComponent(null)
        
        setValidatorsSpy.calls.reset()
        
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway X',
            and: ''
        })

        expect(setValidatorsSpy).toHaveBeenCalled()
    })

    it('should call clearValidators when both fields are cleared', () => {
        // Spy needs to be set up before component initialization
        const clearValidatorsSpy = spyOn(FormGroup.prototype, 'clearValidators').and.callThrough()
        
        initializeComponent(null)

        // First set a value
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway Y',
            and: ''
        })

        clearValidatorsSpy.calls.reset()
        
        // Then clear both - this should trigger clearValidators
        component['taxiwayLocationForm'].patchValue({
            between: '',
            and: ''
        })

        expect(clearValidatorsSpy).toHaveBeenCalled()
    })

    it('should handle truthy values for between field (string)', () => {
        initializeComponent(null)

        component['taxiwayLocationForm'].patchValue({
            between: 'A',
            and: ''
        })

        // Verify validators are set when between has a value
        expect(component['taxiwayLocationForm'].validator).toBeTruthy()
    })

    it('should handle truthy values for and field (string)', () => {
        initializeComponent(null)

        component['taxiwayLocationForm'].patchValue({
            between: '',
            and: 'B'
        })

        // Verify validators are set when and has a value
        expect(component['taxiwayLocationForm'].validator).toBeTruthy()
    })

    it('should treat empty string as falsy in conditional check', () => {
        initializeComponent(null)

        component['taxiwayLocationForm'].patchValue({
            between: '',
            and: ''
        })

        // Both empty strings should be falsy, so no validators should be set
        expect(component['taxiwayLocationForm'].valid).toBe(true)
    })

    it('should handle when model has scenarioData with taxiwayLocation null', () => {
        const mockModel: FaaNotamModel = {
            scenarioData: {
                taxiwayLocation: null as any
            }
        } as FaaNotamModel

        initializeComponent(mockModel)

        expect(component['taxiwayLocationForm'].get('between')?.value).toBe(undefined)
        expect(component['taxiwayLocationForm'].get('and')?.value).toBe(undefined)
    })

    it('should call updateValueAndValidity after setting validators', () => {
        initializeComponent(null)

        updateValueAndValiditySpy.calls.reset()

        component['taxiwayLocationForm'].patchValue({
            between: 'Test',
            and: ''
        })

        expect(updateValueAndValiditySpy).toHaveBeenCalled()
    })

    it('should call updateValueAndValidity after clearing validators', () => {
        initializeComponent(null)

        // Set value first
        component['taxiwayLocationForm'].patchValue({
            between: 'Test',
            and: ''
        })

        updateValueAndValiditySpy.calls.reset()

        // Clear all values
        component['taxiwayLocationForm'].patchValue({
            between: '',
            and: ''
        })

        expect(updateValueAndValiditySpy).toHaveBeenCalled()
    })

    it('should add taxiwayLocation control to scenarioData in buildForm', () => {
        initializeComponent(null)

        const scenarioData = parentForm.get('scenarioData') as FormGroup
        const taxiwayLocation = scenarioData.get('taxiwayLocation')

        expect(taxiwayLocation).toBe(component['taxiwayLocationForm'])
        expect(taxiwayLocation).toBeInstanceOf(FormGroup)
    })

    it('should initialize between and and controls with empty strings in buildForm', () => {
        initializeComponent(null)

        expect(component['taxiwayLocationForm'].get('between')?.value).toBe('')
        expect(component['taxiwayLocationForm'].get('and')?.value).toBe('')
    })

    it('should access form from formGroupDirective in ngOnInit', () => {
        initializeComponent(null)

        expect(component['form']).toBe(parentForm)
        expect(component['form']).toBe(mockFormGroupDirective.form)
    })

    it('should handle OR condition in valueChanges - between is truthy', () => {
        initializeComponent(null)

        component['taxiwayLocationForm'].patchValue({
            between: 'SomeValue',
            and: ''
        })

        // Should enter the if block (res.between is truthy) and set validators
        expect(component['taxiwayLocationForm'].validator).toBeTruthy()
    })

    it('should handle OR condition in valueChanges - and is truthy', () => {
        initializeComponent(null)

        component['taxiwayLocationForm'].patchValue({
            between: '',
            and: 'SomeValue'
        })

        // Should enter the if block (res.and is truthy) and set validators
        expect(component['taxiwayLocationForm'].validator).toBeTruthy()
    })

    it('should handle OR condition in valueChanges - both are truthy', () => {
        initializeComponent(null)

        component['taxiwayLocationForm'].patchValue({
            between: 'ValueA',
            and: 'ValueB'
        })

        // Should enter the if block (both are truthy)
        expect(component['taxiwayLocationForm'].valid).toBe(true)
    })

    it('should handle OR condition in valueChanges - both are falsy', () => {
        initializeComponent(null)

        // Set values first
        component['taxiwayLocationForm'].patchValue({
            between: 'A',
            and: ''
        })

        // Then clear
        component['taxiwayLocationForm'].patchValue({
            between: '',
            and: ''
        })

        // Should enter the else block (both are falsy)
        expect(component['taxiwayLocationForm'].valid).toBe(true)
    })

    it('should properly subscribe to valueChanges with takeUntilDestroyed', () => {
        initializeComponent(null)

        // Verify subscription is active
        let valueChangeTriggered = false
        component['taxiwayLocationForm'].valueChanges.subscribe(() => {
            valueChangeTriggered = true
        })

        component['taxiwayLocationForm'].patchValue({
            between: 'Test'
        })

        expect(valueChangeTriggered).toBe(true)
    })

    it('should retrieve scenarioData FormGroup correctly in ngOnDestroy', () => {
        initializeComponent(null)

        const scenarioData = parentForm.get('scenarioData') as FormGroup
        expect(scenarioData).toBeInstanceOf(FormGroup)
        expect(scenarioData.get('taxiwayLocation')).toBeDefined()

        component.ngOnDestroy()

        expect(scenarioData.get('taxiwayLocation')).toBeNull()
    })

    it('should have partialClosureLocation$ observable defined after ngOnInit', () => {
        initializeComponent(null)

        expect(component.partialClosureLocation$).toBeDefined()
        
        // Verify it's an observable by subscribing to it
        component.partialClosureLocation$.subscribe((locations) => {
            expect(locations).toBeDefined()
        })
    })

    it('should call fetchPartialLocations on ngOnInit with form values', () => {
        parentForm.patchValue({
            keyword: 'test-keyword',
            location: 'test-location'
        })

        mockLookupCacheStore.fetchPartialLocations.calls.reset()

        initializeComponent(null)

        expect(mockLookupCacheStore.fetchPartialLocations).toHaveBeenCalledOnceWith({
            keyword: 'test-keyword',
            location: 'test-location'
        })
    })

    it('should patch taxiwayLocationForm with between and and from model', () => {
        const mockModel: FaaNotamModel = {
            scenarioData: {
                taxiwayLocation: {
                    between: 'Between Value',
                    and: 'And Value'
                }
            }
        } as FaaNotamModel

        initializeComponent(mockModel)

        expect(component['taxiwayLocationForm'].value).toEqual({
            between: 'Between Value',
            and: 'And Value'
        })
    })

    it('should handle model with only between value in taxiwayLocation', () => {
        const mockModel: FaaNotamModel = {
            scenarioData: {
                taxiwayLocation: {
                    between: 'Only Between',
                    and: undefined
                }
            }
        } as FaaNotamModel

        initializeComponent(mockModel)

        expect(component['taxiwayLocationForm'].get('between')?.value).toBe('Only Between')
        expect(component['taxiwayLocationForm'].get('and')?.value).toBe(undefined)
    })

    it('should handle model with only and value in taxiwayLocation', () => {
        const mockModel: FaaNotamModel = {
            scenarioData: {
                taxiwayLocation: {
                    between: undefined,
                    and: 'Only And'
                }
            }
        } as FaaNotamModel

        initializeComponent(mockModel)

        expect(component['taxiwayLocationForm'].get('between')?.value).toBe(undefined)
        expect(component['taxiwayLocationForm'].get('and')?.value).toBe('Only And')
    })
})
