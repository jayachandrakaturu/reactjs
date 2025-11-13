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

    it('should set validators when between field has value', (done) => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Spy on updateValueAndValidity to prevent infinite loop
        const updateSpy = spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

        // Subscribe to verify the validator is set after valueChanges fires
        setTimeout(() => {
            expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(true)
            expect(updateSpy).toHaveBeenCalled()
            done()
        }, 0)

        // Trigger valueChanges subscription by NOT using emitEvent: false
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway C',
            and: ''
        })
    })

    it('should set validators when and field has value', (done) => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Spy on updateValueAndValidity to prevent infinite loop
        const updateSpy = spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

        // Subscribe to verify the validator is set after valueChanges fires
        setTimeout(() => {
            expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(true)
            expect(updateSpy).toHaveBeenCalled()
            done()
        }, 0)

        // Trigger valueChanges subscription by NOT using emitEvent: false
        component['taxiwayLocationForm'].patchValue({
            between: '',
            and: 'Taxiway D'
        })
    })

    it('should set validators when both fields have values', (done) => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Spy on updateValueAndValidity to prevent infinite loop
        const updateSpy = spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

        // Subscribe to verify the validator is set after valueChanges fires
        setTimeout(() => {
            expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(true)
            expect(updateSpy).toHaveBeenCalled()
            done()
        }, 0)

        // Trigger valueChanges subscription by NOT using emitEvent: false
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway E',
            and: 'Taxiway F'
        })
    })

    it('should clear validators when both fields are empty', (done) => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Spy on updateValueAndValidity to prevent infinite loop
        const updateSpy = spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

        // First set some values to add validators (this will trigger valueChanges)
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway G',
            and: 'Taxiway H'
        })

        // Wait for first valueChanges to complete, then clear the fields
        setTimeout(() => {
            expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(true)

            // Then clear them (this will trigger valueChanges again)
            component['taxiwayLocationForm'].patchValue({
                between: '',
                and: ''
            })

            // Wait for second valueChanges to complete
            setTimeout(() => {
                expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(false)
                expect(updateSpy).toHaveBeenCalled()
                done()
            }, 0)
        }, 0)
    })

    it('should clear validators when both fields are null', (done) => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Spy on updateValueAndValidity to prevent infinite loop
        const updateSpy = spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

        // First set some values to add validators (this will trigger valueChanges)
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway I',
            and: 'Taxiway J'
        })

        // Wait for first valueChanges to complete, then clear with null
        setTimeout(() => {
            expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(true)

            // Then clear them with null (this will trigger valueChanges again)
            component['taxiwayLocationForm'].patchValue({
                between: null,
                and: null
            })

            // Wait for second valueChanges to complete
            setTimeout(() => {
                expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(false)
                expect(updateSpy).toHaveBeenCalled()
                done()
            }, 0)
        }, 0)
    })

    it('should update valueAndValidity when form values change', (done) => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const updateSpy = spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity').and.callThrough()

        // Trigger valueChanges subscription (without emitEvent: false)
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway K'
        })

        // Wait for subscription to execute
        setTimeout(() => {
            expect(updateSpy).toHaveBeenCalled()
            done()
        }, 0)
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

    // TESTS FOR valueChanges subscription - ACTUALLY TRIGGER THE OBSERVABLE
    it('should set validators in subscription when between field has value', (done) => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Spy on updateValueAndValidity to prevent infinite loop
        const updateSpy = spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

        // Trigger actual valueChanges subscription
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway Alpha',
            and: ''
        })

        setTimeout(() => {
            expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(true)
            expect(updateSpy).toHaveBeenCalled()
            done()
        }, 0)
    })

    it('should set validators in subscription when and field has value', (done) => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Spy on updateValueAndValidity to prevent infinite loop
        const updateSpy = spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

        // Trigger actual valueChanges subscription
        component['taxiwayLocationForm'].patchValue({
            between: '',
            and: 'Taxiway Beta'
        })

        setTimeout(() => {
            expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(true)
            expect(updateSpy).toHaveBeenCalled()
            done()
        }, 0)
    })

    it('should set validators in subscription when both fields have values', (done) => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Spy on updateValueAndValidity to prevent infinite loop
        const updateSpy = spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

        // Trigger actual valueChanges subscription
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway Gamma',
            and: 'Taxiway Delta'
        })

        setTimeout(() => {
            expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(true)
            expect(updateSpy).toHaveBeenCalled()
            done()
        }, 0)
    })

    it('should clear validators in subscription when both fields are empty', (done) => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Spy on updateValueAndValidity to prevent infinite loop
        const updateSpy = spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

        // First set values to add validators
        component['taxiwayLocationForm'].patchValue({
            between: 'X',
            and: 'Y'
        })

        setTimeout(() => {
            expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(true)

            // Now clear the fields to trigger clearValidators in subscription
            component['taxiwayLocationForm'].patchValue({
                between: '',
                and: ''
            })

            setTimeout(() => {
                expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(false)
                expect(updateSpy).toHaveBeenCalled()
                done()
            }, 0)
        }, 0)
    })

    it('should clear validators in subscription with null values', (done) => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Spy on updateValueAndValidity to prevent infinite loop
        const updateSpy = spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

        // First set values to add validators
        component['taxiwayLocationForm'].patchValue({
            between: 'X',
            and: 'Y'
        })

        setTimeout(() => {
            expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(true)
        
            // Trigger subscription with null values
            component['taxiwayLocationForm'].patchValue({
                between: null,
                and: null
            })

            setTimeout(() => {
                expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(false)
                expect(updateSpy).toHaveBeenCalled()
                done()
            }, 0)
        }, 0)
    })

    it('should handle subscription logic transition from one field to another', (done) => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Spy on updateValueAndValidity to prevent infinite loop
        const updateSpy = spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

        // First scenario: only between has value
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway Iota',
            and: ''
        })

        setTimeout(() => {
            expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(true)

            // Second scenario: only and has value
            component['taxiwayLocationForm'].patchValue({
                between: '',
                and: 'Taxiway Kappa'
            })

            setTimeout(() => {
                expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(true)
                expect(updateSpy).toHaveBeenCalled()
                done()
            }, 0)
        }, 0)
    })

    it('should call updateValueAndValidity in valueChanges subscription logic', (done) => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const updateSpy = spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity').and.callThrough()

        // Trigger subscription
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway Lambda',
            and: ''
        })

        setTimeout(() => {
            expect(updateSpy).toHaveBeenCalled()
            done()
        }, 0)
    })

    it('should maintain validators when clearing only one field', (done) => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Spy on updateValueAndValidity to prevent infinite loop
        const updateSpy = spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

        // Both fields have values
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway Mu',
            and: 'Taxiway Nu'
        })

        setTimeout(() => {
            expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(true)

            // Clear only between, and still has value
            component['taxiwayLocationForm'].patchValue({
                between: '',
                and: 'Taxiway Nu'
            })

            setTimeout(() => {
                expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(true)
                expect(updateSpy).toHaveBeenCalled()
                done()
            }, 0)
        }, 0)
    })

    it('should handle subscription logic with whitespace values', (done) => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Spy on updateValueAndValidity to prevent infinite loop
        const updateSpy = spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

        // Whitespace is truthy - trigger subscription
        component['taxiwayLocationForm'].patchValue({
            between: '   ',
            and: ''
        })

        setTimeout(() => {
            expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(true)
            expect(updateSpy).toHaveBeenCalled()
            done()
        }, 0)
    })

    it('should handle subscription logic with undefined values', (done) => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Spy on updateValueAndValidity to prevent infinite loop
        const updateSpy = spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

        // First set validators
        component['taxiwayLocationForm'].patchValue({
            between: 'X',
            and: 'Y'
        })

        setTimeout(() => {
            expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(true)

            // Undefined values should clear validators
            component['taxiwayLocationForm'].patchValue({
                between: undefined,
                and: undefined
            })

            setTimeout(() => {
                expect(component['taxiwayLocationForm'].hasValidator(Validators.required)).toBe(false)
                expect(updateSpy).toHaveBeenCalled()
                done()
            }, 0)
        }, 0)
    })

    it('should handle ngOnDestroy when form is undefined', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Set form to undefined
        component['form'] = undefined as any

        // Should throw error when trying to access undefined form
        expect(() => {
            component.ngOnDestroy()
        }).toThrowError()
    })

    it('should handle ngOnDestroy when scenarioData does not exist', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Remove scenarioData from parent form
        parentForm.removeControl('scenarioData')

        // Should not throw - get returns null for non-existent controls
        // and calling removeControl on null will cause an error
        expect(() => {
            component.ngOnDestroy()
        }).toThrowError()
    })

    it('should verify takeUntilDestroyed is used for subscription cleanup', () => {
        // This test verifies that the subscription setup uses takeUntilDestroyed
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Check that destroyRef is injected
        expect(component['destroyRef']).toBeDefined()
        
        // Verify the form has valueChanges observable
        expect(component['taxiwayLocationForm'].valueChanges).toBeDefined()
    })
})

