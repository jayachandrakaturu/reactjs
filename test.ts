import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms'
import { CommonModule } from '@angular/common'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatIconModule } from '@angular/material/icon'
import { MatCheckboxModule } from '@angular/material/checkbox'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { of, Subject } from 'rxjs'
import { RunwayLocationComponent } from './runway-location.component'
import { LookupCacheStore } from '../../store/lookup-cache-store'
import { FaaNotamModel, LocationLookupModel } from '../../models'

describe('RunwayLocationComponent', () => {
  let component: RunwayLocationComponent
  let fixture: ComponentFixture<RunwayLocationComponent>
  let mockFormGroupDirective: FormGroupDirective
  let mockLookupCacheStore: jasmine.SpyObj<LookupCacheStore>
  let parentForm: FormGroup
  let locationControl: FormControl
  let locationValueChanges: Subject<string>

  const mockLocationLookupData: LocationLookupModel[] = [
    { name: 'Runway 09L', code: '09L' } as LocationLookupModel,
    { name: 'Runway 27R', code: '27R' } as LocationLookupModel
  ]

  const mockFaaNotamModel: FaaNotamModel = {
    scenarioData: {
      runwayLocation: {
        lengthClosed: '1000',
        fromRunwayEnd: 'Runway 09L'
      }
    }
  } as FaaNotamModel

  beforeEach(async () => {
    locationValueChanges = new Subject<string>()
    locationControl = new FormControl('')
    
    Object.defineProperty(locationControl, 'valueChanges', {
      get: () => locationValueChanges.asObservable(),
      configurable: true
    })

    parentForm = new FormGroup({
      location: locationControl,
      scenarioData: new FormGroup({})
    })

    mockFormGroupDirective = {
      form: parentForm
    } as FormGroupDirective

    mockLookupCacheStore = jasmine.createSpyObj('LookupCacheStore', ['fetchAccountability'], {
      locationLookup$: of(mockLocationLookupData)
    })

    await TestBed.configureTestingModule({
      imports: [
        RunwayLocationComponent,
        CommonModule,
        ReactiveFormsModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        MatCheckboxModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: FormGroupDirective, useValue: mockFormGroupDirective },
        { provide: LookupCacheStore, useValue: mockLookupCacheStore }
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(RunwayLocationComponent)
    component = fixture.componentInstance
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  describe('ngOnInit', () => {
    it('should initialize form and build runwayLocationForm', () => {
      fixture.componentRef.setInput('model', null)
      fixture.detectChanges()

      expect(component.runwayLocationForm).toBeDefined()
      expect(component.runwayLocationForm.get('lengthClosed')).toBeDefined()
      expect(component.runwayLocationForm.get('fromRunwayEnd')).toBeDefined()
    })

    it('should add runwayLocation control to scenarioData', () => {
      fixture.componentRef.setInput('model', null)
      fixture.detectChanges()

      const scenarioData = parentForm.get('scenarioData') as FormGroup
      expect(scenarioData.get('runwayLocation')).toBe(component.runwayLocationForm)
    })

    it('should patch form values when model is provided', () => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()

      expect(component.runwayLocationForm.get('lengthClosed')?.value).toBe('1000')
      expect(component.runwayLocationForm.get('fromRunwayEnd')?.value).toBe('Runway 09L')
    })

    it('should not patch form values when model is null', () => {
      fixture.componentRef.setInput('model', null)
      fixture.detectChanges()

      expect(component.runwayLocationForm.get('lengthClosed')?.value).toBe('')
      expect(component.runwayLocationForm.get('fromRunwayEnd')?.value).toBe('')
    })

    it('should not patch form values when model scenarioData is undefined', () => {
      const modelWithoutRunwayLocation: FaaNotamModel = {
        scenarioData: {}
      } as FaaNotamModel
      
      fixture.componentRef.setInput('model', modelWithoutRunwayLocation)
      fixture.detectChanges()

      expect(component.runwayLocationForm.get('lengthClosed')?.value).toBe('')
      expect(component.runwayLocationForm.get('fromRunwayEnd')?.value).toBe('')
    })

    it('should subscribe to location control valueChanges', () => {
      fixture.componentRef.setInput('model', null)
      fixture.detectChanges()

      const testLocationValue = 'KJFK'
      locationValueChanges.next(testLocationValue)

      expect(mockLookupCacheStore.fetchAccountability).toHaveBeenCalledWith(testLocationValue)
      expect(component.fromRunwayEnd$).toBe(mockLookupCacheStore.locationLookup$)
    })

    it('should handle multiple location valueChanges', () => {
      fixture.componentRef.setInput('model', null)
      fixture.detectChanges()

      locationValueChanges.next('KJFK')
      locationValueChanges.next('KLAX')
      locationValueChanges.next('KORD')

      expect(mockLookupCacheStore.fetchAccountability).toHaveBeenCalledTimes(3)
      expect(mockLookupCacheStore.fetchAccountability).toHaveBeenCalledWith('KJFK')
      expect(mockLookupCacheStore.fetchAccountability).toHaveBeenCalledWith('KLAX')
      expect(mockLookupCacheStore.fetchAccountability).toHaveBeenCalledWith('KORD')
    })

    it('should assign locationLookup$ from lookupCacheStore', (done) => {
      fixture.componentRef.setInput('model', null)
      fixture.detectChanges()

      locationValueChanges.next('KJFK')

      component.fromRunwayEnd$.subscribe((data) => {
        expect(data).toEqual(mockLocationLookupData)
        done()
      })
    })
  })

  describe('ngOnDestroy', () => {
    it('should remove runwayLocation control from scenarioData', () => {
      fixture.componentRef.setInput('model', null)
      fixture.detectChanges()

      const scenarioData = parentForm.get('scenarioData') as FormGroup
      expect(scenarioData.get('runwayLocation')).toBeDefined()

      component.ngOnDestroy()

      expect(scenarioData.get('runwayLocation')).toBeNull()
    })

    it('should handle ngOnDestroy when scenarioData exists', () => {
      fixture.componentRef.setInput('model', null)
      fixture.detectChanges()

      expect(() => component.ngOnDestroy()).not.toThrow()
    })
  })

  describe('buildForm', () => {
    it('should create runwayLocationForm with lengthClosed and fromRunwayEnd controls', () => {
      fixture.componentRef.setInput('model', null)
      fixture.detectChanges()

      expect(component.runwayLocationForm).toBeInstanceOf(FormGroup)
      expect(component.runwayLocationForm.contains('lengthClosed')).toBe(true)
      expect(component.runwayLocationForm.contains('fromRunwayEnd')).toBe(true)
    })

    it('should initialize form controls with empty strings', () => {
      fixture.componentRef.setInput('model', null)
      fixture.detectChanges()

      expect(component.runwayLocationForm.get('lengthClosed')?.value).toBe('')
      expect(component.runwayLocationForm.get('fromRunwayEnd')?.value).toBe('')
    })
  })

  describe('Form Integration', () => {
    it('should update form values correctly', () => {
      fixture.componentRef.setInput('model', null)
      fixture.detectChanges()

      component.runwayLocationForm.patchValue({
        lengthClosed: '2000',
        fromRunwayEnd: 'Runway 27R'
      })

      expect(component.runwayLocationForm.get('lengthClosed')?.value).toBe('2000')
      expect(component.runwayLocationForm.get('fromRunwayEnd')?.value).toBe('Runway 27R')
    })

    it('should be part of parent form scenarioData', () => {
      fixture.componentRef.setInput('model', null)
      fixture.detectChanges()

      component.runwayLocationForm.patchValue({
        lengthClosed: '1500',
        fromRunwayEnd: 'Runway 09L'
      })

      const scenarioData = parentForm.get('scenarioData') as FormGroup
      const runwayLocation = scenarioData.get('runwayLocation') as FormGroup

      expect(runwayLocation.get('lengthClosed')?.value).toBe('1500')
      expect(runwayLocation.get('fromRunwayEnd')?.value).toBe('Runway 09L')
    })
  })

  describe('Observable behavior', () => {
    it('should update fromRunwayEnd$ when location changes', (done) => {
      fixture.componentRef.setInput('model', null)
      fixture.detectChanges()

      locationValueChanges.next('KJFK')

      component.fromRunwayEnd$.subscribe((data) => {
        expect(data).toEqual(mockLocationLookupData)
        expect(data.length).toBe(2)
        expect(data[0].name).toBe('Runway 09L')
        expect(data[1].name).toBe('Runway 27R')
        done()
      })
    })

    it('should handle empty location lookup data', (done) => {
      mockLookupCacheStore = jasmine.createSpyObj('LookupCacheStore', ['fetchAccountability'], {
        locationLookup$: of([])
      })

      TestBed.overrideProvider(LookupCacheStore, { useValue: mockLookupCacheStore })
      fixture = TestBed.createComponent(RunwayLocationComponent)
      component = fixture.componentInstance

      fixture.componentRef.setInput('model', null)
      fixture.detectChanges()

      locationValueChanges.next('KJFK')

      component.fromRunwayEnd$.subscribe((data) => {
        expect(data).toEqual([])
        expect(data.length).toBe(0)
        done()
      })
    })
  })

  describe('Component lifecycle', () => {
    it('should properly cleanup on destroy', () => {
      fixture.componentRef.setInput('model', mockFaaNotamModel)
      fixture.detectChanges()

      const scenarioData = parentForm.get('scenarioData') as FormGroup
      expect(scenarioData.get('runwayLocation')).toBeDefined()

      fixture.destroy()

      expect(scenarioData.get('runwayLocation')).toBeNull()
    })

    it('should handle subscription cleanup via DestroyRef', () => {
      fixture.componentRef.setInput('model', null)
      fixture.detectChanges()

      locationValueChanges.next('KJFK')
      expect(mockLookupCacheStore.fetchAccountability).toHaveBeenCalledWith('KJFK')

      fixture.destroy()

      // After destroy, no further calls should be made
      const callCount = mockLookupCacheStore.fetchAccountability.calls.count()
      locationValueChanges.next('KLAX')
      
      // Call count should remain the same after destroy
      expect(mockLookupCacheStore.fetchAccountability.calls.count()).toBe(callCount)
    })
  })

  describe('Edge cases', () => {
    it('should handle null values in model runwayLocation', () => {
      const modelWithNullValues: FaaNotamModel = {
        scenarioData: {
          runwayLocation: {
            lengthClosed: null,
            fromRunwayEnd: null
          }
        }
      } as unknown as FaaNotamModel

      fixture.componentRef.setInput('model', modelWithNullValues)
      fixture.detectChanges()

      expect(component.runwayLocationForm.get('lengthClosed')?.value).toBeNull()
      expect(component.runwayLocationForm.get('fromRunwayEnd')?.value).toBeNull()
    })

    it('should handle undefined location control in parent form', () => {
      const formWithoutLocation = new FormGroup({
        scenarioData: new FormGroup({})
      })

      mockFormGroupDirective.form = formWithoutLocation
      
      fixture.componentRef.setInput('model', null)
      
      expect(() => fixture.detectChanges()).not.toThrow()
    })

    it('should initialize with correct default values', () => {
      fixture.componentRef.setInput('model', null)
      fixture.detectChanges()

      expect(component.runwayLocationForm.get('lengthClosed')?.value).toBe('')
      expect(component.runwayLocationForm.get('fromRunwayEnd')?.value).toBe('')
    })
  })
})

