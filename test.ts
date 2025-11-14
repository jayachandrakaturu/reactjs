import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { of } from 'rxjs'
import { TaxiwayLocationComponent } from './taxiway-location.component'
import { PartialClosureModel } from '../../models'
import { LookupCacheStore } from '../../store/lookup-cache-store'
import { FaaNotamModel } from '../../models'

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
                new PartialClosureModel({ name: 'Taxiway A', id: '1' }),
                new PartialClosureModel({ name: 'Taxiway B', id: '2' })
            ]),
            configurable: true
        })

        // Create parent form with scenarioData, keyword, and location
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

    it('should set validators when between has value', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway A',
            and: ''
        })

        const betweenControl = component['taxiwayLocationForm'].get('between')
        const andControl = component['taxiwayLocationForm'].get('and')

        expect(betweenControl?.hasError('required')).toBe(false)
        expect(andControl?.hasError('required')).toBe(true)
    })

    it('should set validators when and has value', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        component['taxiwayLocationForm'].patchValue({
            between: '',
            and: 'Taxiway B'
        })

        const betweenControl = component['taxiwayLocationForm'].get('between')
        const andControl = component['taxiwayLocationForm'].get('and')

        expect(betweenControl?.hasError('required')).toBe(true)
        expect(andControl?.hasError('required')).toBe(false)
    })

    it('should set validators when both between and and have values', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway A',
            and: 'Taxiway B'
        })

        const betweenControl = component['taxiwayLocationForm'].get('between')
        const andControl = component['taxiwayLocationForm'].get('and')

        expect(betweenControl?.hasError('required')).toBe(false)
        expect(andControl?.hasError('required')).toBe(false)
    })

    it('should clear validators when both between and and are empty', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway A',
            and: 'Taxiway B'
        })

        component['taxiwayLocationForm'].patchValue({
            between: '',
            and: ''
        })

        const betweenControl = component['taxiwayLocationForm'].get('between')
        const andControl = component['taxiwayLocationForm'].get('and')

        expect(betweenControl?.hasError('required')).toBe(false)
        expect(andControl?.hasError('required')).toBe(false)
        expect(betweenControl?.validators).toBeNull()
        expect(andControl?.validators).toBeNull()
    })

    it('should remove taxiwayLocation control from scenarioData on ngOnDestroy', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const scenarioData = parentForm.get('scenarioData') as FormGroup
        expect(scenarioData.get('taxiwayLocation')).toBeDefined()

        component.ngOnDestroy()

        expect(scenarioData.get('taxiwayLocation')).toBeNull()
    })

    it('should unsubscribe from form valueChanges on component destroy', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Verify validators work before destroy
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway A',
            and: ''
        })
        expect(component['taxiwayLocationForm'].get('and')?.hasError('required')).toBe(true)

        fixture.destroy()

        // After destroy, patching should not trigger validator logic
        // Clear validators manually to simulate what would happen if subscription was active
        component['taxiwayLocationForm'].get('between')?.clearValidators()
        component['taxiwayLocationForm'].get('and')?.clearValidators()
        component['taxiwayLocationForm'].updateValueAndValidity()

        // Patch with only one value - validators should NOT be applied because subscription is destroyed
        component['taxiwayLocationForm'].patchValue({
            between: 'New Value',
            and: ''
        })

        // Validators should not have been re-applied because subscription is cleaned up
        expect(component['taxiwayLocationForm'].get('between')?.hasError('required')).toBe(false)
        expect(component['taxiwayLocationForm'].get('and')?.hasError('required')).toBe(false)
    })

    it('should properly initialize with partial taxiwayLocation data', () => {
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

    it('should maintain form validity state when validators are applied', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Initially form should be valid (no validators)
        expect(component['taxiwayLocationForm'].valid).toBe(true)

        // Set only one value - should make form invalid
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway A',
            and: ''
        })

        expect(component['taxiwayLocationForm'].valid).toBe(false)

        // Set both values - should make form valid
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway A',
            and: 'Taxiway B'
        })

        expect(component['taxiwayLocationForm'].valid).toBe(true)
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
            between: 'Taxiway E',
            and: 'Taxiway F'
        })

        const scenarioData = parentForm.get('scenarioData') as FormGroup
        const taxiwayLocation = scenarioData.get('taxiwayLocation') as FormGroup

        expect(taxiwayLocation.get('between')?.value).toBe('Taxiway E')
        expect(taxiwayLocation.get('and')?.value).toBe('Taxiway F')
    })

    it('should render form template without errors', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const compiled = fixture.nativeElement as HTMLElement
        expect(compiled.querySelector('form') || compiled.querySelector('div')).toBeTruthy()
    })

    it('should handle valueChanges subscription correctly', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        // Initially no validators
        const betweenControl = component['taxiwayLocationForm'].get('between')
        const andControl = component['taxiwayLocationForm'].get('and')
        expect(betweenControl?.hasError('required')).toBe(false)
        expect(andControl?.hasError('required')).toBe(false)

        // Set between value - should trigger validators
        component['taxiwayLocationForm'].patchValue({
            between: 'Taxiway A',
            and: ''
        })

        expect(betweenControl?.hasError('required')).toBe(false)
        expect(andControl?.hasError('required')).toBe(true)

        // Clear both - should clear validators
        component['taxiwayLocationForm'].patchValue({
            between: '',
            and: ''
        })

        expect(betweenControl?.hasError('required')).toBe(false)
        expect(andControl?.hasError('required')).toBe(false)
    })
})

