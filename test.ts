import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms'
import { of, Subject } from 'rxjs'
import { TaxiwayLocationComponent } from './taxiway-location.component'
import { LookupCacheStore } from '../../store/lookup-cache-store'
import { FaaNotamModel } from '../../models'

describe('TaxiwayLocationComponent', () => {
  let component: TaxiwayLocationComponent
  let fixture: ComponentFixture<TaxiwayLocationComponent>
  let lookupCacheStoreMock: jasmine.SpyObj<LookupCacheStore>
  let formGroupDirectiveMock: Partial<FormGroupDirective>
  let formGroup: FormGroup

  beforeEach(async () => {
    lookupCacheStoreMock = jasmine.createSpyObj('LookupCacheStore', [
      'fetchPartialLocations'
    ], {
      partialClosureLocation$: of([{ id: 1, name: 'test-location' }])
    })

    formGroup = new FormGroup({
      scenarioData: new FormGroup({})
    })

    formGroupDirectiveMock = {
      form: formGroup
    }

    await TestBed.configureTestingModule({
      imports: [TaxiwayLocationComponent, ReactiveFormsModule],
      providers: [
        { provide: FormGroupDirective, useValue: formGroupDirectiveMock },
        { provide: LookupCacheStore, useValue: lookupCacheStoreMock }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(TaxiwayLocationComponent)
    component = fixture.componentInstance
  })

  function createModel(): FaaNotamModel {
    return {
      scenarioData: {
        taxiwayLocation: { between: 'A', and: 'B' }
      }
    } as unknown as FaaNotamModel
  }

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should build form and add taxiwayLocation control to scenarioData', () => {
    component['form'] = formGroup
    component['buildForm']()

    const scenarioData = formGroup.get('scenarioData') as FormGroup
    expect(scenarioData.get('taxiwayLocation')).toBeTruthy()
    expect(component['taxiwayLocationForm']).toBeTruthy()
  })

  it('should initialize form and patch model values in ngOnInit', () => {
    const model = createModel()
    spyOn(component, 'model').and.returnValue(model)

    component.ngOnInit()

    expect(lookupCacheStoreMock.fetchPartialLocations).toHaveBeenCalled()
    expect(component['taxiwayLocationForm'].value).toEqual({ between: 'A', and: 'B' })
  })

  it('should set validators when between/and values exist', () => {
    const model = createModel()
    spyOn(component, 'model').and.returnValue(model)

    component.ngOnInit()
    const form = component['taxiwayLocationForm']

    form.patchValue({ between: 'A', and: 'B' })
    expect(form.validator).toBeTruthy()
  })

  it('should clear validators when between/and values are empty', () => {
    const model = createModel()
    spyOn(component, 'model').and.returnValue(model)

    component.ngOnInit()
    const form = component['taxiwayLocationForm']

    form.patchValue({ between: '', and: '' })
    expect(form.validator).toBeNull()
  })

  it('should remove control on destroy', () => {
    component['form'] = formGroup
    component['buildForm']()
    const scenarioData = formGroup.get('scenarioData') as FormGroup

    expect(scenarioData.get('taxiwayLocation')).toBeTruthy()

    component.ngOnDestroy()
    expect(scenarioData.get('taxiwayLocation')).toBeNull()
  })

  it('should subscribe to valueChanges and update validators', () => {
    const model = createModel()
    spyOn(component, 'model').and.returnValue(model)

    component.ngOnInit()

    const valueChanges = new Subject<any>()
    component['taxiwayLocationForm'].valueChanges = valueChanges.asObservable()

    const setValidatorsSpy = spyOn(component['taxiwayLocationForm'], 'setValidators').and.callThrough()
    const clearValidatorsSpy = spyOn(component['taxiwayLocationForm'], 'clearValidators').and.callThrough()
    const updateSpy = spyOn(component['taxiwayLocationForm'], 'updateValueAndValidity').and.callThrough()

    // Emit with values
    valueChanges.next({ between: 'A', and: 'B' })
    expect(setValidatorsSpy).toHaveBeenCalled()

    // Emit empty
    valueChanges.next({ between: '', and: '' })
    expect(clearValidatorsSpy).toHaveBeenCalled()
    expect(updateSpy).toHaveBeenCalledWith({ emitEvent: false })
  })
})
