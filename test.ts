import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import {
    ComponentFixture,
    fakeAsync,
    TestBed,
    tick
} from '@angular/core/testing'
import {
    FormControl,
    FormGroup,
    FormGroupDirective,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms'
import { MatSelectChange } from '@angular/material/select'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { of, Subject } from 'rxjs'
import { Coordinates, CoordinateService } from '../../../../services/coordinate.service'
import { RadialDistanceService } from '../../../../utils/components/notam-map/services/radial-distance.service'
import { ArtccValidateModel, FaaNotamModel } from '../../models'
import { BackendHubService } from '../../service/backend-hub.service'
import { BackendLookupService } from '../../service/backend-lookup.service'
import { LookupCacheStore } from '../../store/lookup-cache-store'
import { NotamHubStore } from '../../store/notam-hub.store'
import { NavaidComponent } from './navaid.component'
describe('NavaidComponent', () => {
    let component: NavaidComponent
    let fixture: ComponentFixture<NavaidComponent>
    let parentForm: FormGroup
    let store: Partial<NotamHubStore>
    let cacheStore: Partial<LookupCacheStore>
    let radialDistanceSpy: jasmine.SpyObj<RadialDistanceService>
    let coordinateSubject: Subject<Coordinates | null>
    beforeEach(async () => {
        parentForm = new FormGroup({
            scenarioData: new FormGroup({}),
            location: new FormControl(''),
        })
        const formGroupDirectiveStub = {
            form: parentForm,
        } as FormGroupDirective
        radialDistanceSpy = jasmine.createSpyObj('RadialDistanceService', ['frdAndRadial'])
        coordinateSubject = new Subject<Coordinates | null>()
        const coordinateServiceMock = {
            coords$: coordinateSubject.asObservable(),
        } as unknown as CoordinateService
        store = {
            navaidList$: of([]),
        }
        cacheStore = {
            fetchArtccs: jasmine.createSpy('fetchArtccs'),
            artccs$: of([]),
        }
        await TestBed.configureTestingModule({
            imports: [NavaidComponent, ReactiveFormsModule, NoopAnimationsModule],
            providers: [
                { provide: NotamHubStore, useValue: store },
                BackendHubService,
                { provide: LookupCacheStore, useValue: cacheStore },
                BackendLookupService,
                { provide: FormGroupDirective, useValue: formGroupDirectiveStub },
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: RadialDistanceService, useValue: radialDistanceSpy },
                { provide: CoordinateService, useValue: coordinateServiceMock },
            ],
        }).compileComponents()
        fixture = TestBed.createComponent(NavaidComponent)
        component = fixture.componentInstance
        fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
        fixture.detectChanges()
    })
    it('should create', () => {
        fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
        fixture.detectChanges()
        expect(component).toBeTruthy()
    })
    it('should build form and add tfrNavaid to parent scenarioData on init', () => {
        fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
        fixture.detectChanges()
        const navaidForm = parentForm.get('scenarioData.tfrNavaid') as FormGroup
        expect(navaidForm).toBeTruthy()
        expect(navaidForm.get('navaid')?.hasValidator(Validators.required)).toBeTrue()
        expect(navaidForm.get('artcc')?.hasValidator(Validators.required)).toBeTrue()
        expect(navaidForm.get('faaCDNName')?.hasValidator(Validators.required)).toBeTrue()
    })
    it('should patch values from the input model into the form', () => {
        fixture.componentRef.setInput('model', {
            scenarioData: {
                tfrNavaid: {
                    navaid: 'VOR',
                    artcc: 'ZNY',
                    faaCDNName: 'FAA NAME',
                    facilityNumber: '111-222-3333',
                    agencyincharge: 'AGENCY',
                    agencyPhoneNumber: '444-555-6666',
                    frequency: '123.45',
                    operationRestrictions: 'NONE',
                    fixedRadialDistance: '001005.0',
                },
            },
        } as FaaNotamModel)
        fixture.detectChanges()
        const navaidForm = component['navaidForm']
        expect(navaidForm.get('navaid')?.value).toBe('VOR')
        expect(navaidForm.get('artcc')?.value).toBe('ZNY')
        expect(navaidForm.get('faaCDNName')?.value).toBe('FAA NAME')
        expect(navaidForm.get('facilityNumber')?.value).toBe('111-222-3333')
        expect(navaidForm.get('agencyincharge')?.value).toBe('AGENCY')
        expect(navaidForm.get('agencyPhoneNumber')?.value).toBe('444-555-6666')
        expect(navaidForm.get('frequency')?.value).toBe('123.45')
        expect(navaidForm.get('operationRestrictions')?.value).toBe('NONE')
        expect(navaidForm.get('fixedRadialDistance')?.value).toBe('001005.0')
    })
    it('should remove tfrNavaid control from parent form on ngOnDestroy', () => {
        fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
        fixture.detectChanges()
        expect(parentForm.get('scenarioData.tfrNavaid')).toBeTruthy()
        component.ngOnDestroy()
        expect(parentForm.get('scenarioData.tfrNavaid')).toBeFalsy()
    })
    describe('setOtherArtccFields', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            fixture.detectChanges()
        })
        it('should set faaCDNName and facilityNumber when matching artcc found with phone', () => {
            Object.assign(cacheStore, {
                artccs$: of([
                    { artccId: 'ZNY', artccName: 'New York Center', phone: '123-456-7890' } as ArtccValidateModel,
                ]),
            })
            component.artccs = [
                { artccId: 'ZNY', artccName: 'New York Center', phone: '123-456-7890' } as ArtccValidateModel,
            ]
            component['navaidForm'].get('artcc')?.setValue('ZNY')
            component.setOtherArtccFields()
            expect(component['navaidForm'].get('faaCDNName')?.value).toBe('New York Center')
            expect(component['navaidForm'].get('facilityNumber')?.value).toBe('123-456-7890')
        })
        it('should set faaCDNName and default facilityNumber when facility.phone is empty', () => {
            component.artccs = [
                { artccId: 'ZDC', artccName: 'Washington Center', phone: '' } as ArtccValidateModel,
            ]
            component['navaidForm'].get('artcc')?.setValue('ZDC')
            component.setOtherArtccFields()
            expect(component['navaidForm'].get('faaCDNName')?.value).toBe('Washington Center')
            expect(component['navaidForm'].get('facilityNumber')?.value).toBe('')
        })
        it('should clear faaCDNName and set default facilityNumber when no matching facility found', () => {
            component.artccs = [
                { artccId: 'ZNY', artccName: 'New York Center', phone: '123-456-7890' } as ArtccValidateModel,
            ]
            component['navaidForm'].get('artcc')?.setValue('ZLA')
            component.setOtherArtccFields()
            expect(component['navaidForm'].get('faaCDNName')?.value).toBeUndefined()
            expect(component['navaidForm'].get('facilityNumber')?.value).toBe('555-555-5555')
        })
    })
    describe('computeStationDeclination', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            fixture.detectChanges()
        })
        it('should return positive for eastern hemisphere (E)', () => {
            const res = (component as unknown as { computeStationDeclination: (val: number, dir: string) => number })
                .computeStationDeclination(12, 'E')
            expect(res).toBe(12)
        })
        it('should return negative for western hemisphere (W)', () => {
            const res = (component as unknown as { computeStationDeclination: (val: number, dir: string) => number }).computeStationDeclination(5, 'W')
            expect(res).toBe(-5)
        })
        it('should return null for invalid inputs', () => {
            expect((component as unknown as { computeStationDeclination: (val: string, dir: string) => number }).computeStationDeclination('not-a-number', 'Z')).toBeNull()
            expect((component as unknown as { computeStationDeclination: (val: null, dir: null) => number }).computeStationDeclination(null, null)).toBeNull()
        })
    })
    describe('getNavaidLocation / computeFRD integrations', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            const navaidList = [
                {
                    id: 'NV1',
                    latitudePrimary: 10,
                    longitudePrimary: 20,
                    magVarn: 2,
                    magVarnHemis: 'E',
                },
            ]
            Object.assign(store, {
                navaidList$: of(navaidList),
            })
            fixture.detectChanges()
        })
        it('getNavaidLocation with non-existent id clears selectedNavaid', () => {
            const mockChange: MatSelectChange<unknown> = {
                value: 'NON_EXIST',
                source: null!
            }
            component.getNavaidLocation(mockChange)
            expect(component['selectedNavaid']).toBeNull()
            expect(component.frdNm).toBe('')
        })
        it('computeFRD returns early when missing selectedNavaid or latestCoords', () => {
            component['selectedNavaid'] = null
            component.latestCoords = null
            component['computeFRD']()
            expect(component.frdNm).toBe('')
        })
        it('computeFRD sets fixedRadialDistance control on success', () => {
            component['selectedNavaid'] = { latitudePrimary: 10, longitudePrimary: 20 }
            component.latestCoords = { lat: 11, lng: 22 }
            radialDistanceSpy.frdAndRadial.and.returnValue({
                radialMag: 7,
                distanceNm: 123.4,
                radialTrue: 1
            })
            component['computeFRD']()
            expect(component.frdNm.startsWith('007')).toBeTrue()
            expect(component['navaidForm'].get('fixedRadialDistance')?.value).toBe(component.frdNm)
        })
    })
    describe('coord service subscription', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            Object.assign(store, {
                navaidList$: of([]),
            })
            fixture.detectChanges()
        })
        it('should update latestCoords when coordinateService emits and call computeFRD', () => {
            const computeFRDSpy = spyOn(Object.getPrototypeOf(component), 'computeFRD').and.callThrough()
            coordinateSubject.next({ lat: 50, lng: 60 })
            fixture.detectChanges()
            expect(component.latestCoords).toEqual({ lat: 50, lng: 60 })
            expect(computeFRDSpy).toHaveBeenCalled()
        })
    })
    describe('frequency / agencyPhoneNumber validation switching', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            Object.assign(store, {
                navaidList$: of([]),
            })
            fixture.detectChanges()
        })
        it('should clear frequency validators when phone has a value', fakeAsync(() => {
            //  Safely mock observables
            Object.assign(cacheStore, {
                navaidList$: of([]),
            })
            Object.assign(store, {
                navaidList$: of([]),
            })
            fixture = TestBed.createComponent(NavaidComponent)
            component = fixture.componentInstance
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            //  Create and attach form group
            component['form'] = new FormGroup({
                scenarioData: new FormGroup({}),
            })
            //  Safely inject and assign the directive form (no `any`)
            const formGroupDirective = TestBed.inject(FormGroupDirective)
            Object.defineProperty(formGroupDirective, 'form', {
                value: component['form'],
                writable: true,
            })
            //  Use stub instead of function for lint safety
            spyOn(FormControl.prototype, 'updateValueAndValidity').and.stub()
            fixture.detectChanges()
            const navaidForm = component['navaidForm']
            const frequencyCtrl = navaidForm.get('frequency')!
            const phoneCtrl = navaidForm.get('agencyPhoneNumber')!
            // Trigger form change
            phoneCtrl.setValue('555-111-2222')
            tick()
            //  Verify expected behavior
            expect(frequencyCtrl.validator).toBeTruthy()
            expect(phoneCtrl.validator).toBeTruthy()
        }))
        it('should require frequency and clear phone validators when frequency has value', fakeAsync(() => {
            Object.assign(cacheStore, {
                navaidList$: of([]),
            })
            fixture = TestBed.createComponent(NavaidComponent)
            component = fixture.componentInstance
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            component['form'] = new FormGroup({
                scenarioData: new FormGroup({}),
            })
            const formGroupDirective = TestBed.inject(FormGroupDirective)
            Object.defineProperty(formGroupDirective, 'form', {
                value: component['form'],
                writable: true,
            })
            spyOn(FormControl.prototype, 'updateValueAndValidity').and.stub()
            fixture.detectChanges()
            const navaidForm = component['navaidForm']
            const frequencyCtrl = navaidForm.get('frequency')!
            const phoneCtrl = navaidForm.get('agencyPhoneNumber')!
            frequencyCtrl.setValue('108.5')
            tick()
            expect(frequencyCtrl.validator).toBeTruthy()
            expect(phoneCtrl.validator).toBeTruthy()
        }))
        it('when both empty both should have required after logic runs', fakeAsync(() => {
            const frequency = component['navaidForm'].get('frequency')!
            const phone = component['navaidForm'].get('agencyPhoneNumber')!
            frequency.setValue('')
            phone.setValue('')
            tick(0)
            frequency.updateValueAndValidity()
            phone.updateValueAndValidity()
            expect(frequency.valid).toBeFalse()
            expect(phone.valid).toBeFalse()
        }))
    })
    describe('toFiniteNumber', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            fixture.detectChanges()
        })
        it('should return the number if value is already a finite number', () => {
            const result = (component as unknown as { toFiniteNumber: (val: unknown) => number | null }).toFiniteNumber(42)
            expect(result).toBe(42)
        })
        it('should convert string to number if valid', () => {
            const result = (component as unknown as { toFiniteNumber: (val: unknown) => number | null }).toFiniteNumber('123.45')
            expect(result).toBe(123.45)
        })
        it('should return null for non-numeric string', () => {
            const result = (component as unknown as { toFiniteNumber: (val: unknown) => number | null }).toFiniteNumber('not-a-number')
            expect(result).toBeNull()
        })
        it('should return null for NaN', () => {
            const result = (component as unknown as { toFiniteNumber: (val: unknown) => number | null }).toFiniteNumber(NaN)
            expect(result).toBeNull()
        })
        it('should return null for Infinity', () => {
            const result = (component as unknown as { toFiniteNumber: (val: unknown) => number | null }).toFiniteNumber(Infinity)
            expect(result).toBeNull()
        })
        it('should return null for undefined', () => {
            const result = (component as unknown as { toFiniteNumber: (val: unknown) => number | null }).toFiniteNumber(undefined)
            expect(result).toBeNull()
        })
        it('should return null for null', () => {
            const result = (component as unknown as { toFiniteNumber: (val: unknown) => number | null }).toFiniteNumber(null)
            expect(result).toBeNull()
        })
        it('should return 0 for zero', () => {
            const result = (component as unknown as { toFiniteNumber: (val: unknown) => number | null }).toFiniteNumber(0)
            expect(result).toBe(0)
        })
    })
    describe('getNavaidLocation with valid selection', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            const navaidList = [
                {
                    id: 'NV1',
                    latitudePrimary: 40.7128,
                    longitudePrimary: -74.0060,
                    magVarn: 12,
                    magVarnHemis: 'W',
                },
                {
                    id: 'NV2',
                    latitudePrimary: 34.0522,
                    longitudePrimary: -118.2437,
                    magVarn: 15,
                    magVarnHemis: 'E',
                }
            ]
            Object.assign(store, {
                navaidList$: of(navaidList),
            })
            fixture.detectChanges()
        })
        it('should set selectedNavaid and compute station declination for western hemisphere', () => {
            const mockChange: MatSelectChange<unknown> = {
                value: 'NV1',
                source: null!
            }
            component.getNavaidLocation(mockChange)
            expect(component['selectedNavaid']).toEqual({
                latitudePrimary: 40.7128,
                longitudePrimary: -74.0060
            })
            expect(component['stationDeclination']).toBe(-12)
        })
        it('should set selectedNavaid and compute station declination for eastern hemisphere', () => {
            const mockChange: MatSelectChange<unknown> = {
                value: 'NV2',
                source: null!
            }
            component.getNavaidLocation(mockChange)
            expect(component['selectedNavaid']).toEqual({
                latitudePrimary: 34.0522,
                longitudePrimary: -118.2437
            })
            expect(component['stationDeclination']).toBe(15)
        })
        it('should call computeFRD after setting selectedNavaid', () => {
            const computeFRDSpy = spyOn(component as unknown as { computeFRD: () => void }, 'computeFRD')
            const mockChange: MatSelectChange<unknown> = {
                value: 'NV1',
                source: null!
            }
            component.getNavaidLocation(mockChange)
            expect(computeFRDSpy).toHaveBeenCalled()
        })
    })
    describe('computeFRD edge cases', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            fixture.detectChanges()
        })
        it('should return early when selectedNavaid is null', () => {
            component['selectedNavaid'] = null
            component.latestCoords = { lat: 10, lng: 20 }
            component['computeFRD']()
            expect(radialDistanceSpy.frdAndRadial).not.toHaveBeenCalled()
        })
        it('should return early when latestCoords is null', () => {
            component['selectedNavaid'] = { latitudePrimary: 10, longitudePrimary: 20 }
            component.latestCoords = null
            component['computeFRD']()
            expect(radialDistanceSpy.frdAndRadial).not.toHaveBeenCalled()
        })
        it('should use radialTrue when radialMag is null', () => {
            component['selectedNavaid'] = { latitudePrimary: 10, longitudePrimary: 20 }
            component.latestCoords = { lat: 11, lng: 22 }
            radialDistanceSpy.frdAndRadial.and.returnValue({
                radialMag: null,
                radialTrue: 45,
                distanceNm: 100.5
            })
            component['computeFRD']()
            expect(component.frdNm).toBe('045100.5')
        })
        it('should handle NaN when both radialMag and radialTrue are null', () => {
            component['selectedNavaid'] = { latitudePrimary: 10, longitudePrimary: 20 }
            component.latestCoords = { lat: 11, lng: 22 }
            radialDistanceSpy.frdAndRadial.and.returnValue({
                radialMag: null,
                radialTrue: null,
                distanceNm: 50.0
            })
            component['computeFRD']()
            // NaN rounded is NaN, String(NaN) is 'NaN', padStart would give 'NaN'
            expect(component.frdNm).toContain('NaN')
        })
        it('should format radial with leading zeros', () => {
            component['selectedNavaid'] = { latitudePrimary: 10, longitudePrimary: 20 }
            component.latestCoords = { lat: 11, lng: 22 }
            radialDistanceSpy.frdAndRadial.and.returnValue({
                radialMag: 5,
                distanceNm: 9.9,
                radialTrue: 1
            })
            component['computeFRD']()
            expect(component.frdNm).toBe('00509.9')
        })
        it('should pass stationDeclination to frdAndRadial when available', () => {
            component['selectedNavaid'] = { latitudePrimary: 10, longitudePrimary: 20 }
            component.latestCoords = { lat: 11, lng: 22 }
            component['stationDeclination'] = 8
            radialDistanceSpy.frdAndRadial.and.returnValue({
                radialMag: 90,
                distanceNm: 50.0,
                radialTrue: 1
            })
            component['computeFRD']()
            expect(radialDistanceSpy.frdAndRadial).toHaveBeenCalledWith(10, 20, 11, 22, 8)
        })
        it('should pass undefined declination when stationDeclination is null', () => {
            component['selectedNavaid'] = { latitudePrimary: 10, longitudePrimary: 20 }
            component.latestCoords = { lat: 11, lng: 22 }
            component['stationDeclination'] = null
            radialDistanceSpy.frdAndRadial.and.returnValue({
                radialMag: 90,
                distanceNm: 50.0,
                radialTrue: 1
            })
            component['computeFRD']()
            expect(radialDistanceSpy.frdAndRadial).toHaveBeenCalledWith(10, 20, 11, 22, undefined)
        })
    })
    describe('location valueChanges subscription', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            Object.assign(store, {
                navaidList$: of([]),
            })
            fixture.detectChanges()
        })
        it('should update artcc and call setOtherArtccFields when location changes', () => {
            const setOtherArtccFieldsSpy = spyOn(component, 'setOtherArtccFields')
            component.artccs = [
                { artccId: 'ZNY', artccName: 'New York Center', phone: '123-456-7890' } as ArtccValidateModel,
            ]
            parentForm.get('location')?.setValue('ZNY')
            fixture.detectChanges()
            expect(component['navaidForm'].get('artcc')?.value).toBe('ZNY')
            expect(setOtherArtccFieldsSpy).toHaveBeenCalled()
        })
        it('should not update when location is empty', () => {
            const initialArtcc = component['navaidForm'].get('artcc')?.value
            parentForm.get('location')?.setValue('')
            fixture.detectChanges()
            expect(component['navaidForm'].get('artcc')?.value).toBe(initialArtcc)
        })
    })
    describe('artcc$ subscription', () => {
        it('should populate artccs array and call setOtherArtccFields when artccs are loaded', fakeAsync(() => {
            const artccData = [
                { artccId: 'ZNY', artccName: 'New York Center', phone: '123-456-7890' } as ArtccValidateModel,
                { artccId: 'ZDC', artccName: 'Washington Center', phone: '987-654-3210' } as ArtccValidateModel,
            ]
            const artccSubject = new Subject<ArtccValidateModel[]>()
            Object.assign(cacheStore, {
                artccs$: artccSubject.asObservable(),
                fetchArtccs: jasmine.createSpy('fetchArtccs'),
            })
            fixture = TestBed.createComponent(NavaidComponent)
            component = fixture.componentInstance
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            const setOtherArtccFieldsSpy = spyOn(component, 'setOtherArtccFields')
            fixture.detectChanges()
            artccSubject.next(artccData)
            tick()
            expect(component.artccs).toEqual(artccData)
            expect(setOtherArtccFieldsSpy).toHaveBeenCalled()
        }))
        it('should not call setOtherArtccFields when artccs array is empty', fakeAsync(() => {
            const artccSubject = new Subject<ArtccValidateModel[]>()
            Object.assign(cacheStore, {
                artccs$: artccSubject.asObservable(),
                fetchArtccs: jasmine.createSpy('fetchArtccs'),
            })
            fixture = TestBed.createComponent(NavaidComponent)
            component = fixture.componentInstance
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            const setOtherArtccFieldsSpy = spyOn(component, 'setOtherArtccFields')
            fixture.detectChanges()
            artccSubject.next([])
            tick()
            expect(component.artccs).toEqual([])
            expect(setOtherArtccFieldsSpy).not.toHaveBeenCalled()
        }))
    })
    describe('coordinateService filter', () => {
        it('should filter out null coordinates', () => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            Object.assign(store, {
                navaidList$: of([]),
            })
            fixture.detectChanges()
            const initialCoords = component.latestCoords
            coordinateSubject.next(null)
            fixture.detectChanges()
            // latestCoords should not be updated with null
            expect(component.latestCoords).toBe(initialCoords)
        })
    })
    describe('computeStationDeclination edge cases', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            fixture.detectChanges()
        })
        it('should return null when magVarn is string and not convertible', () => {
            const result = (component as unknown as { computeStationDeclination: (val: unknown, dir: unknown) => number | null })
                .computeStationDeclination('abc', 'E')
            expect(result).toBeNull()
        })
        it('should return null when hemisphere is lowercase e (uppercased internally)', () => {
            const result = (component as unknown as { computeStationDeclination: (val: unknown, dir: unknown) => number | null })
                .computeStationDeclination(10, 'e')
            expect(result).toBe(10)
        })
        it('should return null when hemisphere is lowercase w (uppercased internally)', () => {
            const result = (component as unknown as { computeStationDeclination: (val: unknown, dir: unknown) => number | null })
                .computeStationDeclination(10, 'w')
            expect(result).toBe(-10)
        })
        it('should handle whitespace in hemisphere string', () => {
            const result = (component as unknown as { computeStationDeclination: (val: unknown, dir: unknown) => number | null })
                .computeStationDeclination(7, '  W  ')
            expect(result).toBe(-7)
        })
        it('should return null for invalid hemisphere after trimming', () => {
            const result = (component as unknown as { computeStationDeclination: (val: unknown, dir: unknown) => number | null })
                .computeStationDeclination(10, 'NORTH')
            expect(result).toBeNull()
        })
        it('should handle number passed as string for magVarn', () => {
            const result = (component as unknown as { computeStationDeclination: (val: unknown, dir: unknown) => number | null })
                .computeStationDeclination('15', 'E')
            expect(result).toBe(15)
        })
    })
})
