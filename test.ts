import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { of, Subject } from 'rxjs'
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
                { name: 'Taxiway A', locationId: '1' } as PartialClosureModel,
                { name: 'Taxiway B', locationId: '2' } as PartialClosureModel
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
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()
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
        parentForm.patchValue({
            keyword: 'test',
            location: 'KJFK'
        })

        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        expect(mockLookupCacheStore.fetchPartialLocations).toHaveBeenCalledWith({
            keyword: 'test',
            location: 'KJFK'
        })
    })

    it('should remove taxiwayLocation control from scenarioData on ngOnDestroy', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const scenarioData = parentForm.get('scenarioData') as FormGroup
        expect(scenarioData.get('taxiwayLocation')).toBeDefined()

        component.ngOnDestroy()

        expect(scenarioData.get('taxiwayLocation')).toBeNull()
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
            between: 'Taxiway C',
            and: 'Taxiway D'
        })

        expect(component['taxiwayLocationForm'].get('between')?.value).toBe('Taxiway C')
        expect(component['taxiwayLocationForm'].get('and')?.value).toBe('Taxiway D')
    })

    it('should correctly integrate with parent form', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway E',
            and: 'Taxiway F'
        })

        const scenarioData = parentForm.get('scenarioData') as FormGroup
        const taxiwayLocation = scenarioData.get('taxiwayLocation') as FormGroup

        expect(taxiwayLocation.get('between')?.value).toBe('Taxiway E')
        expect(taxiwayLocation.get('and')?.value).toBe('Taxiway F')
    })

    it('should initialize partialClosureLocation$ observable', (done) => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        component.partialClosureLocation$.subscribe((locations: PartialClosureModel[]) => {
            expect(locations.length).toBe(2)
            expect(locations[0].name).toBe('Taxiway A')
            expect(locations[1].name).toBe('Taxiway B')
            done()
        })
    })

    // Conditional Validators Tests
    describe('Conditional Validators', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', null)
            fixture.detectChanges()
        })

        it('should not have required validators when both fields are empty', () => {
            const betweenControl = component['taxiwayLocationForm'].get('between')
            const andControl = component['taxiwayLocationForm'].get('and')

            expect(betweenControl?.hasError('required')).toBeFalsy()
            expect(andControl?.hasError('required')).toBeFalsy()
            expect(betweenControl?.valid).toBe(true)
            expect(andControl?.valid).toBe(true)
        })

        it('should add required validators to both fields when between field has a value', () => {
            const betweenControl = component['taxiwayLocationForm'].get('between')
            const andControl = component['taxiwayLocationForm'].get('and')

            betweenControl?.setValue('Taxiway A')

            expect(betweenControl?.hasError('required')).toBeFalsy() // Has value, so no error
            expect(andControl?.hasError('required')).toBe(true) // Required but empty
            expect(betweenControl?.valid).toBe(true)
            expect(andControl?.valid).toBe(false)
        })

        it('should add required validators to both fields when and field has a value', () => {
            const betweenControl = component['taxiwayLocationForm'].get('between')
            const andControl = component['taxiwayLocationForm'].get('and')

            andControl?.setValue('Taxiway B')

            expect(betweenControl?.hasError('required')).toBe(true) // Required but empty
            expect(andControl?.hasError('required')).toBeFalsy() // Has value, so no error
            expect(betweenControl?.valid).toBe(false)
            expect(andControl?.valid).toBe(true)
        })

        it('should add required validators to both fields when both fields have values', () => {
            const betweenControl = component['taxiwayLocationForm'].get('between')
            const andControl = component['taxiwayLocationForm'].get('and')

            betweenControl?.setValue('Taxiway A')
            andControl?.setValue('Taxiway B')

            expect(betweenControl?.hasError('required')).toBeFalsy()
            expect(andControl?.hasError('required')).toBeFalsy()
            expect(betweenControl?.valid).toBe(true)
            expect(andControl?.valid).toBe(true)
        })

        it('should remove required validators when both fields are cleared', () => {
            const betweenControl = component['taxiwayLocationForm'].get('between')
            const andControl = component['taxiwayLocationForm'].get('and')

            // Set values first
            betweenControl?.setValue('Taxiway A')
            andControl?.setValue('Taxiway B')

            // Clear both fields
            betweenControl?.setValue('')
            andControl?.setValue('')

            expect(betweenControl?.hasError('required')).toBeFalsy()
            expect(andControl?.hasError('required')).toBeFalsy()
            expect(betweenControl?.valid).toBe(true)
            expect(andControl?.valid).toBe(true)
        })

        it('should update validators when between field value changes', () => {
            const betweenControl = component['taxiwayLocationForm'].get('between')
            const andControl = component['taxiwayLocationForm'].get('and')

            // Initially both empty - no validators
            expect(betweenControl?.hasError('required')).toBeFalsy()
            expect(andControl?.hasError('required')).toBeFalsy()

            // Set between value - both should be required
            betweenControl?.setValue('Taxiway A')
            expect(andControl?.hasError('required')).toBe(true)

            // Clear between value - validators should be removed
            betweenControl?.setValue('')
            expect(andControl?.hasError('required')).toBeFalsy()
        })

        it('should update validators when and field value changes', () => {
            const betweenControl = component['taxiwayLocationForm'].get('between')
            const andControl = component['taxiwayLocationForm'].get('and')

            // Initially both empty - no validators
            expect(betweenControl?.hasError('required')).toBeFalsy()
            expect(andControl?.hasError('required')).toBeFalsy()

            // Set and value - both should be required
            andControl?.setValue('Taxiway B')
            expect(betweenControl?.hasError('required')).toBe(true)

            // Clear and value - validators should be removed
            andControl?.setValue('')
            expect(betweenControl?.hasError('required')).toBeFalsy()
        })

        it('should maintain validators when one field is cleared but other still has value', () => {
            const betweenControl = component['taxiwayLocationForm'].get('between')
            const andControl = component['taxiwayLocationForm'].get('and')

            // Set both values
            betweenControl?.setValue('Taxiway A')
            andControl?.setValue('Taxiway B')

            // Clear one field - both should still be required
            betweenControl?.setValue('')
            expect(betweenControl?.hasError('required')).toBe(true)
            expect(andControl?.hasError('required')).toBeFalsy() // Has value
        })

        it('should apply validators correctly when model is provided with both values', () => {
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

            const betweenControl = component['taxiwayLocationForm'].get('between')
            const andControl = component['taxiwayLocationForm'].get('and')

            // Both have values, so both should be valid
            expect(betweenControl?.valid).toBe(true)
            expect(andControl?.valid).toBe(true)
            expect(betweenControl?.hasError('required')).toBeFalsy()
            expect(andControl?.hasError('required')).toBeFalsy()
        })

        it('should apply validators correctly when model is provided with only between value', () => {
            const mockModel: FaaNotamModel = {
                scenarioData: {
                    taxiwayLocation: {
                        between: 'Taxiway A',
                        and: ''
                    }
                }
            } as FaaNotamModel

            fixture.componentRef.setInput('model', mockModel)
            fixture.detectChanges()

            const betweenControl = component['taxiwayLocationForm'].get('between')
            const andControl = component['taxiwayLocationForm'].get('and')

            // between has value, so and should be required
            expect(betweenControl?.valid).toBe(true)
            expect(andControl?.valid).toBe(false)
            expect(andControl?.hasError('required')).toBe(true)
        })

        it('should apply validators correctly when model is provided with only and value', () => {
            const mockModel: FaaNotamModel = {
                scenarioData: {
                    taxiwayLocation: {
                        between: '',
                        and: 'Taxiway B'
                    }
                }
            } as FaaNotamModel

            fixture.componentRef.setInput('model', mockModel)
            fixture.detectChanges()

            const betweenControl = component['taxiwayLocationForm'].get('between')
            const andControl = component['taxiwayLocationForm'].get('and')

            // and has value, so between should be required
            expect(betweenControl?.valid).toBe(false)
            expect(andControl?.valid).toBe(true)
            expect(betweenControl?.hasError('required')).toBe(true)
        })

        it('should handle empty string values correctly', () => {
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

            const betweenControl = component['taxiwayLocationForm'].get('between')
            const andControl = component['taxiwayLocationForm'].get('and')

            // Both empty, so no validators
            expect(betweenControl?.hasError('required')).toBeFalsy()
            expect(andControl?.hasError('required')).toBeFalsy()
            expect(betweenControl?.valid).toBe(true)
            expect(andControl?.valid).toBe(true)
        })

        it('should handle whitespace-only values as empty', () => {
            const betweenControl = component['taxiwayLocationForm'].get('between')
            const andControl = component['taxiwayLocationForm'].get('and')

            // Set whitespace value - should be treated as empty
            betweenControl?.setValue('   ')

            // Whitespace-only values should be treated as empty, so no validators
            expect(betweenControl?.hasError('required')).toBeFalsy()
            expect(andControl?.hasError('required')).toBeFalsy()
            expect(betweenControl?.valid).toBe(true)
            expect(andControl?.valid).toBe(true)
        })

        it('should update validators when either field changes via merged subscription', () => {
            const betweenControl = component['taxiwayLocationForm'].get('between')
            const andControl = component['taxiwayLocationForm'].get('and')

            // Initially no validators
            expect(betweenControl?.hasError('required')).toBeFalsy()
            expect(andControl?.hasError('required')).toBeFalsy()

            // Change between - should trigger validator update
            betweenControl?.setValue('Taxiway A')
            expect(andControl?.hasError('required')).toBe(true)

            // Change and - should also trigger validator update
            andControl?.setValue('Taxiway B')
            expect(betweenControl?.hasError('required')).toBeFalsy()
            expect(andControl?.hasError('required')).toBeFalsy()
        })
    })

    it('should maintain form validity state correctly', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Form should be valid when both fields are empty
        expect(component['taxiwayLocationForm'].valid).toBe(true)

        // Form should be invalid when only one field has value
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway A',
            and: ''
        })
        expect(component['taxiwayLocationForm'].valid).toBe(false)

        // Form should be valid when both fields have values
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway A',
            and: 'Taxiway B'
        })
        expect(component['taxiwayLocationForm'].valid).toBe(true)
    })

    it('should handle partial taxiwayLocation data', () => {
        const mockModel: FaaNotamModel = {
            scenarioData: {
                taxiwayLocation: {
                    between: 'Taxiway A'
                }
            }
        } as FaaNotamModel

        fixture.componentRef.setInput('model', mockModel)
        fixture.detectChanges()

        expect(component['taxiwayLocationForm'].get('between')?.value).toBe('Taxiway A')
        expect(component['taxiwayLocationForm'].get('and')?.value).toBe(undefined)
    })

    it('should render form template without errors', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const compiled = fixture.nativeElement as HTMLElement
        expect(compiled).toBeTruthy()
    })
})

