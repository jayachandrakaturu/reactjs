import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { of } from 'rxjs'
import { FaaNotamModel, KeyValueModel } from '../../models'
import { LookupCacheStore } from '../../store/lookup-cache-store'
import { NavaidStatusComponent } from './navaid-status.component'

describe('NavaidStatusComponent', () => {
  let component: NavaidStatusComponent
  let fixture: ComponentFixture<NavaidStatusComponent>
  let mockLookupCacheStore: jasmine.SpyObj<LookupCacheStore>
  let parentFormGroup: FormGroup
  let formGroupDirectiveStub: FormGroupDirective

  const getScenarioDataForm = (): FormGroup => {
    return parentFormGroup.get('scenarioData') as FormGroup
  }


  beforeEach(async () => {
    parentFormGroup = new FormGroup({
      scenarioData: new FormGroup({})
    })

    formGroupDirectiveStub = {
      form: parentFormGroup,
      controlContainer: {
        get: (name: string) => parentFormGroup.get(name),
      },
    } as unknown as FormGroupDirective

    mockLookupCacheStore = jasmine.createSpyObj('LookupCacheStore', ['fetchNavaidStatusType'], {
      navaidStatusType$: of([{ key: 'operational', value: 'Operational' }, { key: 'maintenance', value: 'Maintenance' }])
    })

    await TestBed.configureTestingModule({
      imports: [NavaidStatusComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LookupCacheStore, useValue: mockLookupCacheStore },
        { provide: FormGroupDirective, useValue: formGroupDirectiveStub }
      ]
    })
      .compileComponents()

    fixture = TestBed.createComponent(NavaidStatusComponent)
    component = fixture.componentInstance
    fixture.componentRef.setInput('model', minimalMockData)
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize form and fetch navaid status type', () => {
    expect(mockLookupCacheStore.fetchNavaidStatusType).toHaveBeenCalled()
    expect(parentFormGroup.get('scenarioData.equipmentStatus')).toBeTruthy()
  })

  it('should build form with required validation', () => {
    const scenarioDataForm = getScenarioDataForm()
    const equipmentStatusControl = scenarioDataForm.get('equipmentStatus')
    expect(equipmentStatusControl).toBeTruthy()
    expect(equipmentStatusControl?.hasError('required')).toBeTruthy()
  })

  it('should remove the form control on destroy', () => {
    expect(parentFormGroup.get('scenarioData.equipmentStatus')).toBeTruthy()
    fixture.destroy()
    expect(parentFormGroup.get('scenarioData.equipmentStatus')).toBeFalsy()
  })

  it('should handle form control value changes', () => {
    const equipmentStatusControl = getScenarioDataForm().get('equipmentStatus')

    equipmentStatusControl?.setValue('maintenance')
    expect(equipmentStatusControl?.value).toBe('maintenance')

    equipmentStatusControl?.patchValue('operational')
    expect(equipmentStatusControl?.value).toBe('operational')
  })

  it('should maintain form validity state', () => {
    expect(getScenarioDataForm().invalid).toBeTruthy()

    getScenarioDataForm().get('equipmentStatus')?.setValue('operational')
    expect(getScenarioDataForm().valid).toBeTruthy()
  })

  it('should handle form control reset', () => {
    getScenarioDataForm().get('equipmentStatus')?.setValue('maintenance')
    expect(getScenarioDataForm().get('equipmentStatus')?.value).toBe('maintenance')

    getScenarioDataForm().reset()
    expect(getScenarioDataForm().get('equipmentStatus')?.value).toBeNull()
  })
})