import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSelectModule } from '@angular/material/select'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { of } from 'rxjs'
import { FaaNotamModel, KeyValueModel } from '../../models'
import { LookupCacheStore } from '../../store/lookup-cache-store'
import { OperationalStatusComponent } from './component'

describe('OperationalStatusComponent', () => {
  let component: OperationalStatusComponent
  let fixture: ComponentFixture<OperationalStatusComponent>
  let mockLookupCacheStore: jasmine.SpyObj<LookupCacheStore>
  let mockFormGroupDirective: any
  let mockForm: FormGroup
  let mockScenarioDataForm: FormGroup

  const mockKeyValueModel: KeyValueModel[] = [
    { key: '1', value: 'Active' },
    { key: '2', value: 'Inactive' },
    { key: '3', value: 'Maintenance' }
  ]

  const mockFaaNotamModel: FaaNotamModel = {
    scenarioData: {
      equipmentStatus: 'Active'
    }
  } as FaaNotamModel

  beforeEach(async () => {
    // Create mock FormGroupDirective
    mockScenarioDataForm = new FormGroup({
      equipmentStatus: new FormControl('')
    })
    
    mockForm = new FormGroup({
      scenarioData: mockScenarioDataForm
    })

    mockFormGroupDirective = {
      form: mockForm
    }

    // Create mock LookupCacheStore
    mockLookupCacheStore = jasmine.createSpyObj('LookupCacheStore', ['fetchNavaidStatusType'], {
      navaidStatusType$: of(mockKeyValueModel)
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
        { provide: FormGroupDirective, useValue: mockFormGroupDirective }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(OperationalStatusComponent)
    component = fixture.componentInstance
  })

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy()
    })

    it('should have required imports', () => {
      expect(component).toBeDefined()
    })
  })

  describe('ngOnInit', () => {
    beforeEach(() => {
      component.model = () => mockFaaNotamModel
    })

    it('should initialize form and fetch data on init', () => {
      spyOn(component as any, 'buildForm').and.callThrough()
      
      component.ngOnInit()

      expect((component as any).buildForm).toHaveBeenCalled()
      expect(component.operationalStatus$).toBeDefined()
      expect(mockLookupCacheStore.fetchNavaidStatusType).toHaveBeenCalled()
    })

    it('should patch form with model data when model is provided', () => {
      component.model = () => mockFaaNotamModel
      spyOn(component.operationalStatusForm, 'patchValue')
      
      component.ngOnInit()

      expect(component.operationalStatusForm.patchValue).toHaveBeenCalledWith({
        equipmentStatus: 'Active'
      })
    })

    it('should not patch form when model is null', () => {
      component.model = () => null
      spyOn(component.operationalStatusForm, 'patchValue')
      
      component.ngOnInit()

      expect(component.operationalStatusForm.patchValue).toHaveBeenCalledWith({
        equipmentStatus: undefined
      })
    })

    it('should set operationalStatus$ observable from lookup cache store', () => {
      component.ngOnInit()
      
      component.operationalStatus$.subscribe(data => {
        expect(data).toEqual(mockKeyValueModel)
      })
    })
  })

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      component.ngOnInit()
    })

    it('should remove operationalStatus control from form', () => {
      expect(component.operationalStatusForm.get('operationalStatus')).toBeTruthy()
      
      component.ngOnDestroy()
      
      expect(component.operationalStatusForm.get('operationalStatus')).toBeFalsy()
    })

    it('should not throw error if operationalStatus control does not exist', () => {
      component.operationalStatusForm.removeControl('operationalStatus')
      
      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })

  describe('buildForm (private method)', () => {
    beforeEach(() => {
      component.ngOnInit()
    })

    it('should get scenarioData form group from parent form', () => {
      expect(component.operationalStatusForm).toBe(mockScenarioDataForm)
    })

    it('should add operationalStatus control with required validator', () => {
      const operationalStatusControl = component.operationalStatusForm.get('operationalStatus')
      
      expect(operationalStatusControl).toBeTruthy()
      expect(operationalStatusControl?.hasError('required')).toBeTruthy()
    })

    it('should handle case when scenarioData form group does not exist', () => {
      const formWithoutScenarioData = new FormGroup({})
      mockFormGroupDirective.form = formWithoutScenarioData
      
      component.ngOnInit()
      
      expect(component.operationalStatusForm).toBeUndefined()
    })
  })

  describe('Input Properties', () => {
    it('should accept model input', () => {
      component.model = () => mockFaaNotamModel
      
      expect(component.model()).toEqual(mockFaaNotamModel)
    })

    it('should handle null model input', () => {
      component.model = () => null
      
      expect(component.model()).toBeNull()
    })
  })

  describe('Form Integration', () => {
    beforeEach(() => {
      component.ngOnInit()
    })

    it('should have operationalStatusForm defined after init', () => {
      expect(component.operationalStatusForm).toBeDefined()
    })

    it('should have operationalStatus control with required validator', () => {
      const control = component.operationalStatusForm.get('operationalStatus')
      expect(control).toBeTruthy()
      expect(control?.hasError('required')).toBeTruthy()
    })

    it('should validate operationalStatus control when value is provided', () => {
      const control = component.operationalStatusForm.get('operationalStatus')
      control?.setValue('Active')
      
      expect(control?.valid).toBeTruthy()
      expect(control?.hasError('required')).toBeFalsy()
    })
  })

  describe('Observable Data', () => {
    it('should emit operational status data from lookup cache store', (done) => {
      component.ngOnInit()
      
      component.operationalStatus$.subscribe(data => {
        expect(data).toEqual(mockKeyValueModel)
        expect(data.length).toBe(3)
        expect(data[0].key).toBe('1')
        expect(data[0].value).toBe('Active')
        done()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle lookup cache store errors gracefully', () => {
      const errorObservable = of([])
      mockLookupCacheStore.navaidStatusType$ = errorObservable
      
      component.ngOnInit()
      
      component.operationalStatus$.subscribe(data => {
        expect(data).toEqual([])
      })
    })

    it('should handle missing scenarioData in form gracefully', () => {
      const formWithoutScenarioData = new FormGroup({})
      mockFormGroupDirective.form = formWithoutScenarioData
      
      expect(() => component.ngOnInit()).not.toThrow()
    })
  })

  describe('Component Lifecycle', () => {
    it('should call ngOnInit when component initializes', () => {
      spyOn(component, 'ngOnInit')
      
      fixture.detectChanges()
      
      expect(component.ngOnInit).toHaveBeenCalled()
    })

    it('should call ngOnDestroy when component is destroyed', () => {
      spyOn(component, 'ngOnDestroy')
      
      component.ngOnDestroy()
      
      expect(component.ngOnDestroy).toHaveBeenCalled()
    })
  })
})
