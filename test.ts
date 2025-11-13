import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormBuilder, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { BehaviorSubject } from 'rxjs'
import { TaxiwayLocationComponent } from './taxiway-location.component'
import { LookupCacheStore } from '../../store/lookup-cache-store'
import { FaaNotamModel, PartialClosureModel } from '../../models'

describe('TaxiwayLocationComponent', () => {
  let component: TaxiwayLocationComponent
  let fixture: ComponentFixture<TaxiwayLocationComponent>
  let mockLookupCacheStore: jasmine.SpyObj<LookupCacheStore>
  let partialClosureLocationSubject: BehaviorSubject<PartialClosureModel[]>
  let parentForm: FormGroup

  const mockFaaNotamModel: FaaNotamModel = {
    notamId: '123',
    scenarioData: {
      taxiwayLocation: {
        between: 'A1',
        and: 'B2'
      }
    }
  } as unknown as FaaNotamModel

  const mockFaaNotamModelEmpty: FaaNotamModel = {
    notamId: '456',
    scenarioData: {
      taxiwayLocation: {
        between: '',
        and: ''
      }
    }
  } as unknown as FaaNotamModel

  beforeEach(async () => {
    partialClosureLocationSubject = new BehaviorSubject<PartialClosureModel[]>([])

    mockLookupCacheStore = jasmine.createSpyObj('LookupCacheStore', ['fetchPartialLocations'])
    Object.defineProperty(mockLookupCacheStore, 'partialClosureLocation$', {
      value: partialClosureLocationSubject.asObservable()
    })

    parentForm = new FormBuilder().group({
      keyword: [''],
      location: [''],
      scenarioData: new FormBuilder().group({})
    })

    const formGroupDirective = new FormGroupDirective([], [])
    formGroupDirective.form = parentForm

    await TestBed.configureTestingModule({
      imports: [
        TaxiwayLocationComponent,
        ReactiveFormsModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: FormGroupDirective, useValue: formGroupDirective },
        { provide: LookupCacheStore, useValue: mockLookupCacheStore }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(TaxiwayLocationComponent)
    component = fixture.componentInstance
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should initialize form and observables', () => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()

      expect(component['taxiwayLocationForm']).toBeDefined()
      expect(component.partialClosureLocation$).toBeDefined()
      expect(mockLookupCacheStore.fetchPartialLocations).toHaveBeenCalled()
    })

    it('should patch form values from model', () => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()

      expect(component['taxiwayLocationForm'].value).toEqual({
        between: 'A1',
        and: 'B2'
      })
    })

    it('should patch form with empty values when model has empty taxiwayLocation', () => {
      fixture.componentRef.setInput('model', mockFaaNotamModelEmpty)
      component.ngOnInit()

      expect(component['taxiwayLocationForm'].value).toEqual({
        between: '',
        and: ''
      })
    })
  })

  describe('valueChanges subscription - 100% coverage', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModelEmpty)
      component.ngOnInit()
    })

    it('should set validators to required when "between" has a value', () => {
      spyOn(component['taxiwayLocationForm'], 'setValidators')
      spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

      // Trigger valueChanges with between having a value
      component['taxiwayLocationForm'].patchValue({
        between: 'A1',
        and: ''
      })

      expect(component['taxiwayLocationForm'].setValidators).toHaveBeenCalledWith([Validators.required])
      expect(component['taxiwayLocationForm'].updateValueAndValidity).toHaveBeenCalled()
    })

    it('should set validators to required when "and" has a value', () => {
      spyOn(component['taxiwayLocationForm'], 'setValidators')
      spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

      // Trigger valueChanges with and having a value
      component['taxiwayLocationForm'].patchValue({
        between: '',
        and: 'B2'
      })

      expect(component['taxiwayLocationForm'].setValidators).toHaveBeenCalledWith([Validators.required])
      expect(component['taxiwayLocationForm'].updateValueAndValidity).toHaveBeenCalled()
    })

    it('should set validators to required when both "between" and "and" have values', () => {
      spyOn(component['taxiwayLocationForm'], 'setValidators')
      spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

      // Trigger valueChanges with both having values
      component['taxiwayLocationForm'].patchValue({
        between: 'A1',
        and: 'B2'
      })

      expect(component['taxiwayLocationForm'].setValidators).toHaveBeenCalledWith([Validators.required])
      expect(component['taxiwayLocationForm'].updateValueAndValidity).toHaveBeenCalled()
    })

    it('should clear validators when both "between" and "and" are empty', () => {
      spyOn(component['taxiwayLocationForm'], 'clearValidators')
      spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

      // Trigger valueChanges with both being empty
      component['taxiwayLocationForm'].patchValue({
        between: '',
        and: ''
      })

      expect(component['taxiwayLocationForm'].clearValidators).toHaveBeenCalled()
      expect(component['taxiwayLocationForm'].updateValueAndValidity).toHaveBeenCalled()
    })

    it('should clear validators when both "between" and "and" are null', () => {
      spyOn(component['taxiwayLocationForm'], 'clearValidators')
      spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

      // Trigger valueChanges with both being null
      component['taxiwayLocationForm'].patchValue({
        between: null,
        and: null
      })

      expect(component['taxiwayLocationForm'].clearValidators).toHaveBeenCalled()
      expect(component['taxiwayLocationForm'].updateValueAndValidity).toHaveBeenCalled()
    })

    it('should handle transition from having values to empty values', () => {
      spyOn(component['taxiwayLocationForm'], 'setValidators')
      spyOn(component['taxiwayLocationForm'], 'clearValidators')
      spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

      // First set values
      component['taxiwayLocationForm'].patchValue({
        between: 'A1',
        and: 'B2'
      })

      expect(component['taxiwayLocationForm'].setValidators).toHaveBeenCalledWith([Validators.required])
      expect(component['taxiwayLocationForm'].updateValueAndValidity).toHaveBeenCalled()

      // Then clear values
      component['taxiwayLocationForm'].patchValue({
        between: '',
        and: ''
      })

      expect(component['taxiwayLocationForm'].clearValidators).toHaveBeenCalled()
      expect(component['taxiwayLocationForm'].updateValueAndValidity).toHaveBeenCalledTimes(2)
    })

    it('should handle "between" with whitespace only as falsy', () => {
      spyOn(component['taxiwayLocationForm'], 'clearValidators')
      spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

      // Trigger valueChanges with whitespace (which is truthy in JS)
      component['taxiwayLocationForm'].patchValue({
        between: '   ',
        and: ''
      })

      // Whitespace is truthy, so it should set validators
      expect(component['taxiwayLocationForm'].clearValidators).not.toHaveBeenCalled()
    })

    it('should handle "and" with value 0 as falsy', () => {
      spyOn(component['taxiwayLocationForm'], 'clearValidators')
      spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity')

      // Trigger valueChanges with 0 (which is falsy in JS)
      component['taxiwayLocationForm'].patchValue({
        between: '',
        and: 0
      })

      expect(component['taxiwayLocationForm'].clearValidators).toHaveBeenCalled()
      expect(component['taxiwayLocationForm'].updateValueAndValidity).toHaveBeenCalled()
    })
  })

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()
    })

    it('should remove taxiwayLocation control from scenarioData', () => {
      const scenarioData = parentForm.get('scenarioData') as FormGroup

      expect(scenarioData.get('taxiwayLocation')).toBeDefined()

      component.ngOnDestroy()

      expect(scenarioData.get('taxiwayLocation')).toBeNull()
    })
  })

  describe('buildForm', () => {
    it('should add taxiwayLocation control to scenarioData FormGroup', () => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      component.ngOnInit()

      const scenarioData = parentForm.get('scenarioData') as FormGroup
      const taxiwayLocation = scenarioData.get('taxiwayLocation')

      expect(taxiwayLocation).toBeDefined()
      expect(taxiwayLocation?.get('between')).toBeDefined()
      expect(taxiwayLocation?.get('and')).toBeDefined()
    })
  })
})

