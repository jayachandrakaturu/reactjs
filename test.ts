import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { Subject, of } from 'rxjs'
import { TaxiwayLocationComponent } from './taxiway-location.component'
import { LookupCacheStore } from '../../store/lookup-cache-store'
import { FaaNotamModel, PartialClosureModel } from '../../models'

describe('TaxiwayLocationComponent', () => {
    let component: TaxiwayLocationComponent
    let fixture: ComponentFixture<TaxiwayLocationComponent>
    let mockLookupCacheStore: jasmine.SpyObj<LookupCacheStore>
    let mockFormGroupDirective: FormGroupDirective
    let parentForm: FormGroup
    let betweenControl: FormControl
    let andControl: FormControl
    let partialClosureLocationSubject: Subject<PartialClosureModel[]>

    beforeEach(async () => {
        partialClosureLocationSubject = new Subject<PartialClosureModel[]>()
        
        mockLookupCacheStore = jasmine.createSpyObj('LookupCacheStore', ['fetchPartialLocations'])
        
        Object.defineProperty(mockLookupCacheStore, 'partialClosureLocation$', {
            get: () => partialClosureLocationSubject.asObservable(),
            configurable: true
        })

        betweenControl = new FormControl('')
        andControl = new FormControl('')
        
        parentForm = new FormGroup({
            keyword: new FormControl(''),
            location: new FormControl(''),
            scenarioData: new FormGroup({})
        })

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

    it('should set partialClosureLocation$ observable on ngOnInit', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        expect(component.partialClosureLocation$).toBeDefined()
    })

    it('should fetch partial locations on ngOnInit with form values', () => {
        parentForm.patchValue({
            keyword: 'testKeyword',
            location: 'testLocation'
        })

        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        expect(mockLookupCacheStore.fetchPartialLocations).toHaveBeenCalledWith({
            keyword: 'testKeyword',
            location: 'testLocation'
        })
    })

    it('should fetch partial locations on ngOnInit with undefined form values', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        expect(mockLookupCacheStore.fetchPartialLocations).toHaveBeenCalledWith({
            keyword: undefined,
            location: undefined
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

    it('should set validators when between has value', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const between = component['taxiwayLocationForm'].get('between')
        const and = component['taxiwayLocationForm'].get('and')

        between?.setValue('Taxiway A')
        fixture.detectChanges()

        expect(between?.hasError('required')).toBe(false)
        expect(and?.hasError('required')).toBe(false)
        expect(between?.validator).toBeTruthy()
        expect(and?.validator).toBeTruthy()
    })

    it('should set validators when and has value', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const between = component['taxiwayLocationForm'].get('between')
        const and = component['taxiwayLocationForm'].get('and')

        and?.setValue('Taxiway B')
        fixture.detectChanges()

        expect(between?.validator).toBeTruthy()
        expect(and?.validator).toBeTruthy()
    })

    it('should set validators when both have values', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const between = component['taxiwayLocationForm'].get('between')
        const and = component['taxiwayLocationForm'].get('and')

        between?.setValue('Taxiway A')
        and?.setValue('Taxiway B')
        fixture.detectChanges()

        expect(between?.validator).toBeTruthy()
        expect(and?.validator).toBeTruthy()
    })

    it('should remove validators when both controls are empty', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const between = component['taxiwayLocationForm'].get('between')
        const and = component['taxiwayLocationForm'].get('and')

        between?.setValue('Taxiway A')
        fixture.detectChanges()

        between?.setValue('')
        and?.setValue('')
        fixture.detectChanges()

        expect(between?.validator).toBeNull()
        expect(and?.validator).toBeNull()
    })

    it('should update validators when between value changes', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const between = component['taxiwayLocationForm'].get('between')
        const and = component['taxiwayLocationForm'].get('and')

        expect(between?.validator).toBeNull()
        expect(and?.validator).toBeNull()

        between?.setValue('Taxiway A')
        fixture.detectChanges()

        expect(between?.validator).toBeTruthy()
        expect(and?.validator).toBeTruthy()
    })

    it('should update validators when and value changes', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const between = component['taxiwayLocationForm'].get('between')
        const and = component['taxiwayLocationForm'].get('and')

        expect(between?.validator).toBeNull()
        expect(and?.validator).toBeNull()

        and?.setValue('Taxiway B')
        fixture.detectChanges()

        expect(between?.validator).toBeTruthy()
        expect(and?.validator).toBeTruthy()
    })

    it('should handle multiple value changes', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const between = component['taxiwayLocationForm'].get('between')
        const and = component['taxiwayLocationForm'].get('and')

        between?.setValue('Taxiway A')
        fixture.detectChanges()
        expect(between?.validator).toBeTruthy()

        and?.setValue('Taxiway B')
        fixture.detectChanges()
        expect(and?.validator).toBeTruthy()

        between?.setValue('')
        and?.setValue('')
        fixture.detectChanges()
        expect(between?.validator).toBeNull()
        expect(and?.validator).toBeNull()
    })

    it('should handle setupConditionalValidators when controls do not exist', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const taxiwayForm = component['taxiwayLocationForm']
        taxiwayForm.removeControl('between')
        taxiwayForm.removeControl('and')

        expect(() => {
            component['setupConditionalValidators']()
        }).not.toThrow()
    })

    it('should remove taxiwayLocation control from scenarioData on ngOnDestroy', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const scenarioData = parentForm.get('scenarioData') as FormGroup
        expect(scenarioData.get('taxiwayLocation')).toBeDefined()

        component.ngOnDestroy()

        expect(scenarioData.get('taxiwayLocation')).toBeNull()
    })

    it('should build form with correct controls', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const formControls = Object.keys(component['taxiwayLocationForm'].controls)
        expect(formControls).toContain('between')
        expect(formControls).toContain('and')
        expect(formControls.length).toBe(2)
    })

    it('should add form to parent scenarioData in buildForm', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const scenarioData = parentForm.get('scenarioData') as FormGroup
        expect(scenarioData.get('taxiwayLocation')).toBe(component['taxiwayLocationForm'])
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
            between: 'Taxiway C',
            and: 'Taxiway D'
        })

        const scenarioData = parentForm.get('scenarioData') as FormGroup
        const taxiwayLocation = scenarioData.get('taxiwayLocation') as FormGroup

        expect(taxiwayLocation.get('between')?.value).toBe('Taxiway C')
        expect(taxiwayLocation.get('and')?.value).toBe('Taxiway D')
    })

    it('should update validators and validity when values change', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const between = component['taxiwayLocationForm'].get('between')
        const and = component['taxiwayLocationForm'].get('and')

        between?.setValue('Taxiway A')
        fixture.detectChanges()

        expect(between?.valid).toBe(true)
        expect(and?.valid).toBe(true)

        and?.setValue('')
        fixture.detectChanges()

        expect(and?.valid).toBe(true)
    })

    it('should handle partialClosureLocation$ observable updates', (done) => {
        const mockPartialClosures: PartialClosureModel[] = [
            { id: '1', name: 'Location 1' } as PartialClosureModel,
            { id: '2', name: 'Location 2' } as PartialClosureModel
        ]

        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        component.partialClosureLocation$.subscribe((locations) => {
            expect(locations).toEqual(mockPartialClosures)
            done()
        })

        partialClosureLocationSubject.next(mockPartialClosures)
    })

    it('should call updateValueAndValidity when validators change', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const between = component['taxiwayLocationForm'].get('between')
        const and = component['taxiwayLocationForm'].get('and')

        const betweenUpdateSpy = spyOn(between!, 'updateValueAndValidity')
        const andUpdateSpy = spyOn(and!, 'updateValueAndValidity')

        between?.setValue('Taxiway A')
        fixture.detectChanges()

        expect(betweenUpdateSpy).toHaveBeenCalled()
        expect(andUpdateSpy).toHaveBeenCalled()
    })

    it('should handle initial validator setup when both fields are empty', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const between = component['taxiwayLocationForm'].get('between')
        const and = component['taxiwayLocationForm'].get('and')

        expect(between?.validator).toBeNull()
        expect(and?.validator).toBeNull()
    })

    it('should handle initial validator setup when between has value', () => {
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

        const between = component['taxiwayLocationForm'].get('between')
        const and = component['taxiwayLocationForm'].get('and')

        expect(between?.validator).toBeTruthy()
        expect(and?.validator).toBeTruthy()
    })

    it('should handle initial validator setup when and has value', () => {
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

        const between = component['taxiwayLocationForm'].get('between')
        const and = component['taxiwayLocationForm'].get('and')

        expect(between?.validator).toBeTruthy()
        expect(and?.validator).toBeTruthy()
    })

    it('should unsubscribe from valueChanges on component destroy', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const between = component['taxiwayLocationForm'].get('between')
        const and = component['taxiwayLocationForm'].get('and')

        const betweenSetValidatorsSpy = spyOn(between!, 'setValidators')
        const andSetValidatorsSpy = spyOn(and!, 'setValidators')

        fixture.destroy()

        between?.setValue('Taxiway A')
        and?.setValue('Taxiway B')

        expect(betweenSetValidatorsSpy).not.toHaveBeenCalled()
        expect(andSetValidatorsSpy).not.toHaveBeenCalled()
    })

    it('should handle form value with null keyword and location', () => {
        parentForm.patchValue({
            keyword: null,
            location: null
        })

        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        expect(mockLookupCacheStore.fetchPartialLocations).toHaveBeenCalledWith({
            keyword: null,
            location: null
        })
    })

    it('should maintain form validity state throughout value changes', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        expect(component['taxiwayLocationForm'].valid).toBe(true)

        const between = component['taxiwayLocationForm'].get('between')
        const and = component['taxiwayLocationForm'].get('and')

        between?.setValue('Taxiway A')
        fixture.detectChanges()

        expect(component['taxiwayLocationForm'].valid).toBe(true)

        and?.setValue('Taxiway B')
        fixture.detectChanges()

        expect(component['taxiwayLocationForm'].valid).toBe(true)
    })

    it('should handle falsy values correctly in conditional validators', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const between = component['taxiwayLocationForm'].get('between')
        const and = component['taxiwayLocationForm'].get('and')

        between?.setValue(0)
        fixture.detectChanges()

        expect(between?.validator).toBeNull()
        expect(and?.validator).toBeNull()

        between?.setValue('0')
        fixture.detectChanges()

        expect(between?.validator).toBeTruthy()
        expect(and?.validator).toBeTruthy()
    })

    it('should handle null values in conditional validators', () => {
        fixture.componentRef.setInput('model', null)
        fixture.detectChanges()

        const between = component['taxiwayLocationForm'].get('between')
        const and = component['taxiwayLocationForm'].get('and')

        between?.setValue(null)
        and?.setValue(null)
        fixture.detectChanges()

        expect(between?.validator).toBeNull()
        expect(and?.validator).toBeNull()
    })
})

