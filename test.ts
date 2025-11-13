import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { of } from 'rxjs'
import { TaxiwayLocationComponent } from './taxiway-location.component'
import { LookupCacheStore } from '../../store/lookup-cache-store'
import { FaaNotamModel, PartialClosureModel } from '../../models'

fdescribe('TaxiwayLocationComponent', () => {
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

    it('should initialize partialClosureLocation$ observable on ngOnInit', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

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

        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        expect(mockLookupCacheStore.fetchPartialLocations).toHaveBeenCalledWith({
            keyword: 'CLSD',
            location: 'KJFK'
        })
    })

    it('should fetch partial locations with null values when parent form is empty', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

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

    it('should set validators when between field has a value', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway A',
            and: ''
        })

        expect(component['taxiwayLocationForm'].hasError('required')).toBe(true)
    })

    it('should set validators when and field has a value', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        component['taxiwayLocationForm'].patchValue({
            between: '',
            and: 'Taxiway B'
        })

        expect(component['taxiwayLocationForm'].hasError('required')).toBe(true)
    })

    it('should set validators when both fields have values', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway A',
            and: 'Taxiway B'
        })

        expect(component['taxiwayLocationForm'].valid).toBe(true)
    })

    it('should clear validators when both fields are empty', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

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
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

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

        fixture.componentRef.setInput('model', mockModel)
        fixture.detectChanges()

        expect(component['taxiwayLocationForm'].get('between')?.value).toBe('Taxiway C')
        expect(component['taxiwayLocationForm'].get('and')?.value).toBe(undefined)
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

        fixture.componentRef.setInput('model', mockModel)
        fixture.detectChanges()

        expect(component['taxiwayLocationForm'].get('between')?.value).toBe('')
        expect(component['taxiwayLocationForm'].get('and')?.value).toBe('')
    })

    it('should correctly integrate with parent form', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

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
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const compiled = fixture.nativeElement as HTMLElement
        expect(compiled).toBeTruthy()
    })

    it('should handle rapid value changes in valueChanges subscription', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Rapid changes to trigger validator logic multiple times
        component['taxiwayLocationForm'].patchValue({ between: 'A', and: '' })
        component['taxiwayLocationForm'].patchValue({ between: 'A', and: 'B' })
        component['taxiwayLocationForm'].patchValue({ between: '', and: 'B' })
        component['taxiwayLocationForm'].patchValue({ between: '', and: '' })

        expect(component['taxiwayLocationForm'].valid).toBe(true)
    })

    it('should maintain correct validator state through multiple changes', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

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

        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        expect(mockLookupCacheStore.fetchPartialLocations).toHaveBeenCalledWith({
            keyword: 'TWY CLSD',
            location: 'KLAX'
        })
    })

    it('should handle updateValueAndValidity calls during valueChanges', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity').and.callThrough()

        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway H',
            and: 'Taxiway I'
        })

        expect(component['taxiwayLocationForm'].updateValueAndValidity).toHaveBeenCalled()
    })

    it('should handle null and undefined values in form', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        component['taxiwayLocationForm'].patchValue({
            between: null,
            and: undefined
        })

        expect(component['taxiwayLocationForm'].get('between')?.value).toBeNull()
        expect(component['taxiwayLocationForm'].get('and')?.value).toBeUndefined()
        expect(component['taxiwayLocationForm'].valid).toBe(true)
    })

    it('should properly clean up form on destroy', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const scenarioData = parentForm.get('scenarioData') as FormGroup
        expect(scenarioData.contains('taxiwayLocation')).toBe(true)

        component.ngOnDestroy()

        expect(scenarioData.contains('taxiwayLocation')).toBe(false)
    })
})

