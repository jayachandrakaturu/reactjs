import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { of } from 'rxjs'
import { FaaNotamModel, PartialClosureModel } from '../../models'
import { LookupCacheStore } from '../../store/lookup-cache-store'
import { TaxiwayLocationComponent } from './taxiway-location.component'

describe('TaxiwayLocationComponent', () => {
  let component: TaxiwayLocationComponent
  let fixture: ComponentFixture<TaxiwayLocationComponent>
  let mockFormGroupDirective: jasmine.SpyObj<FormGroupDirective>
  let mockLookupCacheStore: jasmine.SpyObj<LookupCacheStore>
  let parentForm: FormGroup
  let scenarioDataForm: FormGroup

  beforeEach(async () => {
    // Create mock data
    const mockPartialClosureLocations: PartialClosureModel[] = [
      { id: 1, name: 'Location 1' } as PartialClosureModel,
      { id: 2, name: 'Location 2' } as PartialClosureModel
    ]

    // Create parent form structure
    scenarioDataForm = new FormGroup({})
    parentForm = new FormGroup({
      keyword: new FormControl('test-keyword'),
      location: new FormControl('test-location'),
      scenarioData: scenarioDataForm
    })

    // Create mocks
    mockLookupCacheStore = jasmine.createSpyObj('LookupCacheStore', ['fetchPartialLocations'], {
      partialClosureLocation$: of(mockPartialClosureLocations)
    })

    mockFormGroupDirective = jasmine.createSpyObj('FormGroupDirective', [], {
      form: parentForm
    })

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

    fixture = TestBed.createComponent(TaxiwayLocationComponent)
    component = fixture.componentInstance
  })

  afterEach(() => {
    fixture.destroy()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should initialize form and fetch partial locations', () => {
      fixture.detectChanges()

      expect(component['form']).toBe(parentForm)
      expect(component.taxiwayLocationForm).toBeDefined()
      expect(component.taxiwayLocationForm.get('between')).toBeDefined()
      expect(component.taxiwayLocationForm.get('and')).toBeDefined()
      expect(mockLookupCacheStore.fetchPartialLocations).toHaveBeenCalledWith({
        keyword: 'test-keyword',
        location: 'test-location'
      })
    })

    it('should set partialClosureLocation$ observable', (done) => {
      fixture.detectChanges()

      component.partialClosureLocation$.subscribe(locations => {
        expect(locations.length).toBe(2)
        expect(locations[0].id).toBe(1)
        expect(locations[1].id).toBe(2)
        done()
      })
    })

    it('should patch form values when model has taxiwayLocation data', () => {
      const mockModel: FaaNotamModel = {
        scenarioData: {
          taxiwayLocation: {
            between: 'A1',
            and: 'A2'
          }
        }
      } as FaaNotamModel

      fixture.componentRef.setInput('model', mockModel)
      fixture.detectChanges()

      expect(component.taxiwayLocationForm.value.between).toBe('A1')
      expect(component.taxiwayLocationForm.value.and).toBe('A2')
    })

    it('should not throw error when model is null', () => {
      fixture.componentRef.setInput('model', null)
      
      expect(() => fixture.detectChanges()).not.toThrow()
    })

    it('should not throw error when model has no taxiwayLocation', () => {
      const mockModel: FaaNotamModel = {
        scenarioData: {}
      } as FaaNotamModel

      fixture.componentRef.setInput('model', mockModel)
      
      expect(() => fixture.detectChanges()).not.toThrow()
    })

    it('should set validators when both between and and fields have values', () => {
      fixture.detectChanges()

      component.taxiwayLocationForm.patchValue({
        between: 'A1',
        and: 'A2'
      })

      expect(component.taxiwayLocationForm.hasError('required')).toBeFalsy()
    })

    it('should set validators when only between field has value', () => {
      fixture.detectChanges()

      component.taxiwayLocationForm.patchValue({
        between: 'A1',
        and: ''
      })

      expect(component.taxiwayLocationForm.validator).toBeTruthy()
    })

    it('should set validators when only and field has value', () => {
      fixture.detectChanges()

      component.taxiwayLocationForm.patchValue({
        between: '',
        and: 'A2'
      })

      expect(component.taxiwayLocationForm.validator).toBeTruthy()
    })

    it('should clear validators when both fields are empty', () => {
      fixture.detectChanges()

      // First set some values to add validators
      component.taxiwayLocationForm.patchValue({
        between: 'A1',
        and: 'A2'
      })

      // Then clear values
      component.taxiwayLocationForm.patchValue({
        between: '',
        and: ''
      })

      expect(component.taxiwayLocationForm.validator).toBeNull()
    })

    it('should subscribe to form value changes and update validity', () => {
      fixture.detectChanges()
      const updateSpy = spyOn(component.taxiwayLocationForm, 'updateValueAndValidity')

      component.taxiwayLocationForm.patchValue({
        between: 'A1',
        and: ''
      })

      expect(updateSpy).toHaveBeenCalled()
    })
  })

  describe('ngOnDestroy', () => {
    it('should remove taxiwayLocation control from scenarioData', () => {
      fixture.detectChanges()

      expect(scenarioDataForm.get('taxiwayLocation')).toBeDefined()

      component.ngOnDestroy()

      expect(scenarioDataForm.get('taxiwayLocation')).toBeNull()
    })

    it('should handle cleanup properly when called multiple times', () => {
      fixture.detectChanges()

      component.ngOnDestroy()
      
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })

  describe('buildForm', () => {
    it('should create taxiwayLocationForm with correct structure', () => {
      fixture.detectChanges()

      expect(component.taxiwayLocationForm).toBeInstanceOf(FormGroup)
      expect(component.taxiwayLocationForm.get('between')).toBeInstanceOf(FormControl)
      expect(component.taxiwayLocationForm.get('and')).toBeInstanceOf(FormControl)
    })

    it('should add taxiwayLocation control to parent scenarioData form', () => {
      fixture.detectChanges()

      const taxiwayLocationControl = scenarioDataForm.get('taxiwayLocation')
      expect(taxiwayLocationControl).toBe(component.taxiwayLocationForm)
    })

    it('should initialize form controls with empty strings', () => {
      fixture.detectChanges()

      expect(component.taxiwayLocationForm.get('between')?.value).toBe('')
      expect(component.taxiwayLocationForm.get('and')?.value).toBe('')
    })
  })

  describe('Form Integration', () => {
    it('should update parent form when taxiwayLocationForm changes', () => {
      fixture.detectChanges()

      component.taxiwayLocationForm.patchValue({
        between: 'B1',
        and: 'B2'
      })

      const scenarioData = parentForm.get('scenarioData') as FormGroup
      const taxiwayLocation = scenarioData.get('taxiwayLocation') as FormGroup

      expect(taxiwayLocation.value.between).toBe('B1')
      expect(taxiwayLocation.value.and).toBe('B2')
    })

    it('should reflect changes in parent form value', () => {
      fixture.detectChanges()

      component.taxiwayLocationForm.patchValue({
        between: 'C1',
        and: 'C2'
      })

      const parentValue = parentForm.value
      expect(parentValue.scenarioData.taxiwayLocation.between).toBe('C1')
      expect(parentValue.scenarioData.taxiwayLocation.and).toBe('C2')
    })
  })

  describe('DestroyRef Integration', () => {
    it('should unsubscribe from valueChanges on component destroy', () => {
      fixture.detectChanges()
      
      const subscription = component.taxiwayLocationForm.valueChanges.subscribe()
      expect(subscription.closed).toBeFalsy()

      fixture.destroy()

      // Note: takeUntilDestroyed will automatically unsubscribe when component is destroyed
      // We're testing that no errors occur during destruction
      expect(() => component.taxiwayLocationForm.patchValue({ between: 'test' })).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle fetchPartialLocations with undefined form values', () => {
      const formWithoutValues = new FormGroup({
        scenarioData: new FormGroup({})
      })
      
      mockFormGroupDirective = jasmine.createSpyObj('FormGroupDirective', [], {
        form: formWithoutValues
      })

      TestBed.overrideProvider(FormGroupDirective, { useValue: mockFormGroupDirective })
      fixture = TestBed.createComponent(TaxiwayLocationComponent)
      component = fixture.componentInstance

      fixture.detectChanges()

      expect(mockLookupCacheStore.fetchPartialLocations).toHaveBeenCalledWith({
        keyword: undefined,
        location: undefined
      })
    })

    it('should handle model with deeply nested null values', () => {
      const mockModel: any = {
        scenarioData: {
          taxiwayLocation: null
        }
      }

      fixture.componentRef.setInput('model', mockModel)
      
      expect(() => fixture.detectChanges()).not.toThrow()
    })

    it('should maintain form validity through multiple value changes', () => {
      fixture.detectChanges()

      // Change 1: Add between value
      component.taxiwayLocationForm.patchValue({ between: 'A1', and: '' })
      expect(component.taxiwayLocationForm.validator).toBeTruthy()

      // Change 2: Add and value
      component.taxiwayLocationForm.patchValue({ between: 'A1', and: 'A2' })
      expect(component.taxiwayLocationForm.validator).toBeTruthy()

      // Change 3: Clear both values
      component.taxiwayLocationForm.patchValue({ between: '', and: '' })
      expect(component.taxiwayLocationForm.validator).toBeNull()

      // Change 4: Add only and value
      component.taxiwayLocationForm.patchValue({ between: '', and: 'A3' })
      expect(component.taxiwayLocationForm.validator).toBeTruthy()
    })
  })

  describe('Template Integration', () => {
    it('should render without errors', () => {
      expect(() => fixture.detectChanges()).not.toThrow()
    })

    it('should have form controls available for template binding', () => {
      fixture.detectChanges()

      expect(component.taxiwayLocationForm.get('between')).toBeTruthy()
      expect(component.taxiwayLocationForm.get('and')).toBeTruthy()
    })
  })
})

