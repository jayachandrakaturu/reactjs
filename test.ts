import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSelectModule } from '@angular/material/select'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { of, Subject } from 'rxjs'
import { FaaNotamModel, KeyValueModel } from '../../models'
import { LookupCacheStore } from '../../store/lookup-cache-store'
import { OperationalStatusComponent } from './operational-status.component'

describe('OperationalStatusComponent', () => {
  let component: OperationalStatusComponent
  let fixture: ComponentFixture<OperationalStatusComponent>
  let mockLookupCacheStore: jasmine.SpyObj<LookupCacheStore>
  let mockFormGroupDirective: jasmine.SpyObj<any>
  let mockForm: FormGroup
  let mockScenarioDataForm: FormGroup
  let navaidStatusTypeSubject: Subject<KeyValueModel[]>

  const mockKeyValueModels: KeyValueModel[] = [
    { key: 'Operational', value: '1' },
    { key: 'Non-Operational', value: '2' },
    { key: 'Under Maintenance', value: '3' }
  ]

  const mockFaaNotamModel: FaaNotamModel = {
    scenarioData: {
      equipmentStatus: 'Operational'
    }
  } as FaaNotamModel

  beforeEach(async () => {
    navaidStatusTypeSubject = new Subject<KeyValueModel[]>()
    
    mockLookupCacheStore = jasmine.createSpyObj('LookupCacheStore', ['fetchNavaidStatusType'], {
      navaidStatusType$: navaidStatusTypeSubject.asObservable()
    })

    mockScenarioDataForm = new FormGroup({
      equipmentStatus: new FormControl('')
    })

    mockForm = new FormGroup({
      scenarioData: mockScenarioDataForm
    })

    mockFormGroupDirective = jasmine.createSpyObj('FormGroupDirective', [], {
      form: mockForm
    })

    await TestBed.configureTestingModule({
      imports: [
        OperationalStatusComponent,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: LookupCacheStore, useValue: mockLookupCacheStore },
        { provide: 'FormGroupDirective', useValue: mockFormGroupDirective }
      ]
    })
    .overrideComponent(OperationalStatusComponent, {
      set: {
        providers: [
          { provide: LookupCacheStore, useValue: mockLookupCacheStore },
          { provide: 'FormGroupDirective', useValue: mockFormGroupDirective }
        ]
      }
    })
    .compileComponents()

    fixture = TestBed.createComponent(OperationalStatusComponent)
    component = fixture.componentInstance
  })

  afterEach(() => {
    navaidStatusTypeSubject.complete()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should initialize form and fetch navaid status type data', () => {
      // Arrange
      spyOn(component as any, 'buildForm')

      // Act
      component.ngOnInit()

      // Assert
      expect((component as any).buildForm).toHaveBeenCalled()
      expect(component.operationalStatus$).toBeDefined()
      expect(mockLookupCacheStore.fetchNavaidStatusType).toHaveBeenCalled()
    })

    it('should patch form with model data when model is provided', () => {
      // Arrange
      spyOn(component as any, 'buildForm')
      component.model = () => mockFaaNotamModel
      spyOn(mockScenarioDataForm, 'patchValue')

      // Act
      component.ngOnInit()

      // Assert
      expect(mockScenarioDataForm.patchValue).toHaveBeenCalledWith({
        equipmentStatus: 'Operational'
      })
    })

    it('should not patch form when model is null', () => {
      // Arrange
      spyOn(component as any, 'buildForm')
      component.model = () => null
      spyOn(mockScenarioDataForm, 'patchValue')

      // Act
      component.ngOnInit()

      // Assert
      expect(mockScenarioDataForm.patchValue).toHaveBeenCalledWith({
        equipmentStatus: undefined
      })
    })
  })

  describe('buildForm', () => {
    it('should add operationalStatus control to the form', () => {
      // Arrange
      component.ngOnInit()

      // Act
      (component as any).buildForm()

      // Assert
      expect(mockScenarioDataForm.get('operationalStatus')).toBeTruthy()
      expect(mockScenarioDataForm.get('operationalStatus')?.hasError('required')).toBeTruthy()
    })

    it('should set operationalStatusForm to scenarioData form group', () => {
      // Arrange
      component.ngOnInit()

      // Act
      (component as any).buildForm()

      // Assert
      expect(component.operationalStatusForm).toBe(mockScenarioDataForm)
    })
  })

  describe('ngOnDestroy', () => {
    it('should remove operationalStatus control from form', () => {
      // Arrange
      component.ngOnInit()
      spyOn(mockScenarioDataForm, 'removeControl')

      // Act
      component.ngOnDestroy()

      // Assert
      expect(mockScenarioDataForm.removeControl).toHaveBeenCalledWith('operationalStatus')
    })
  })

  describe('Form Validation', () => {
    it('should have required validator on operationalStatus control', () => {
      // Arrange
      component.ngOnInit()

      // Act
      const operationalStatusControl = mockScenarioDataForm.get('operationalStatus')

      // Assert
      expect(operationalStatusControl?.hasError('required')).toBeTruthy()
    })

    it('should be valid when operationalStatus has a value', () => {
      // Arrange
      component.ngOnInit()
      const operationalStatusControl = mockScenarioDataForm.get('operationalStatus')
      operationalStatusControl?.setValue('Operational')

      // Assert
      expect(operationalStatusControl?.valid).toBeTruthy()
    })
  })
})
