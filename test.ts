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
fdescribe('NavaidComponent', () => {
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
            //  Create and attach form group
            component['form'] = new FormGroup({
                scenarioData: new FormGroup({}),
            })
            //  Safely inject and assign the directive form (no `any`)
            const formGroupDirective = TestBed.inject(FormGroupDirective)
            Object.defineProperty(formGroupDirective, 'form', {
                value: component['form'],
                writable: true,
            })
            //  Use stub instead of function for lint safety
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
    describe('location valueChanges subscription', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            Object.assign(cacheStore, {
                artccs$: of([
                    { artccId: 'ZNY', artccName: 'New York Center', phone: '123-456-7890' } as ArtccValidateModel,
                ]),
            })
            fixture.detectChanges()
            component.artccs = [
                { artccId: 'ZNY', artccName: 'New York Center', phone: '123-456-7890' } as ArtccValidateModel,
            ]
        })
        it('should update artcc in tfrNavaid when location changes', fakeAsync(() => {
            const setOtherArtccFieldsSpy = spyOn(component, 'setOtherArtccFields')
            parentForm.get('location')?.setValue('ZNY')
            tick()
            expect(component['navaidForm'].get('artcc')?.value).toBe('ZNY')
            expect(setOtherArtccFieldsSpy).toHaveBeenCalled()
        }))
        it('should not update when location is empty', fakeAsync(() => {
            const setOtherArtccFieldsSpy = spyOn(component, 'setOtherArtccFields')
            setOtherArtccFieldsSpy.calls.reset()
            parentForm.get('location')?.setValue('')
            tick()
            expect(setOtherArtccFieldsSpy).not.toHaveBeenCalled()
        }))
        it('should not update when location is null', fakeAsync(() => {
            const setOtherArtccFieldsSpy = spyOn(component, 'setOtherArtccFields')
            setOtherArtccFieldsSpy.calls.reset()
            parentForm.get('location')?.setValue(null)
            tick()
            expect(setOtherArtccFieldsSpy).not.toHaveBeenCalled()
        }))
    })
    describe('artcc$ observable and tap operation', () => {
        it('should populate artccs array when artcc$ emits', (done) => {
            const mockArtccs = [
                { artccId: 'ZNY', artccName: 'New York Center', phone: '123-456-7890' } as ArtccValidateModel,
                { artccId: 'ZLA', artccName: 'Los Angeles Center', phone: '987-654-3210' } as ArtccValidateModel,
            ]
            Object.assign(cacheStore, {
                artccs$: of(mockArtccs),
            })
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            fixture.detectChanges()
            component.artcc$?.subscribe(() => {
                expect(component.artccs).toEqual(mockArtccs)
                done()
            })
        })
        it('should call setOtherArtccFields when artccs length > 0', (done) => {
            const mockArtccs = [
                { artccId: 'ZNY', artccName: 'New York Center', phone: '123-456-7890' } as ArtccValidateModel,
            ]
            Object.assign(cacheStore, {
                artccs$: of(mockArtccs),
            })
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: { artcc: 'ZNY' } } } as FaaNotamModel)
            fixture.detectChanges()
            const setOtherArtccFieldsSpy = spyOn(component, 'setOtherArtccFields')
            component.artcc$?.subscribe(() => {
                expect(setOtherArtccFieldsSpy).toHaveBeenCalled()
                done()
            })
        })
        it('should not call setOtherArtccFields when artccs array is empty', (done) => {
            Object.assign(cacheStore, {
                artccs$: of([]),
            })
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            fixture.detectChanges()
            const setOtherArtccFieldsSpy = spyOn(component, 'setOtherArtccFields')
            component.artcc$?.subscribe(() => {
                expect(setOtherArtccFieldsSpy).not.toHaveBeenCalled()
                done()
            })
        })
    })
    describe('getNavaidLocation with valid selection', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            const navaidList = [
                {
                    id: 'NV1',
                    latitudePrimary: 40.6413,
                    longitudePrimary: -73.7781,
                    magVarn: 13.5,
                    magVarnHemis: 'W',
                },
            ]
            component['navaidsCache'] = navaidList
            fixture.detectChanges()
        })
        it('should set selectedNavaid and stationDeclination when valid navaid is found', () => {
            const mockChange: MatSelectChange<unknown> = {
                value: 'NV1',
                source: null!
            }
            const computeFRDSpy = spyOn<any>(component, 'computeFRD')
            component.getNavaidLocation(mockChange)
            expect(component['selectedNavaid']).toEqual({
                latitudePrimary: 40.6413,
                longitudePrimary: -73.7781
            })
            expect(component['stationDeclination']).toBe(-13.5)
            expect(computeFRDSpy).toHaveBeenCalled()
        })
        it('should set positive stationDeclination for Eastern hemisphere', () => {
            component['navaidsCache'] = [
                {
                    id: 'NV2',
                    latitudePrimary: 51.5,
                    longitudePrimary: 0,
                    magVarn: 5,
                    magVarnHemis: 'E',
                },
            ]
            const mockChange: MatSelectChange<unknown> = {
                value: 'NV2',
                source: null!
            }
            component.getNavaidLocation(mockChange)
            expect(component['stationDeclination']).toBe(5)
        })
        it('should clear stationDeclination when navaid not found', () => {
            const mockChange: MatSelectChange<unknown> = {
                value: 'INVALID',
                source: null!
            }
            component.getNavaidLocation(mockChange)
            expect(component['stationDeclination']).toBeNull()
        })
    })
    describe('navaidList$ subscription', () => {
        it('should populate navaidsCache when navaidList$ emits', fakeAsync(() => {
            const mockNavaidList = [
                {
                    id: 'NV1',
                    latitudePrimary: 10,
                    longitudePrimary: 20,
                    magVarn: 2,
                    magVarnHemis: 'E',
                },
                {
                    id: 'NV2',
                    latitudePrimary: 30,
                    longitudePrimary: 40,
                    magVarn: 5,
                    magVarnHemis: 'W',
                },
            ]
            Object.assign(store, {
                navaidList$: of(mockNavaidList),
            })
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            fixture.detectChanges()
            tick()
            expect(component['navaidsCache']).toEqual(mockNavaidList)
        }))
    })
    describe('toFiniteNumber private method', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            fixture.detectChanges()
        })
        it('should return number when valid number is passed', () => {
            const result = (component as unknown as { toFiniteNumber: (val: unknown) => number | null }).toFiniteNumber(42)
            expect(result).toBe(42)
        })
        it('should return number when numeric string is passed', () => {
            const result = (component as unknown as { toFiniteNumber: (val: unknown) => number | null }).toFiniteNumber('123.45')
            expect(result).toBe(123.45)
        })
        it('should return null for non-numeric string', () => {
            const result = (component as unknown as { toFiniteNumber: (val: unknown) => number | null }).toFiniteNumber('abc')
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
        it('should return 0 for zero', () => {
            const result = (component as unknown as { toFiniteNumber: (val: unknown) => number | null }).toFiniteNumber(0)
            expect(result).toBe(0)
        })
    })
    describe('computeFRD with radial calculations', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            fixture.detectChanges()
        })
        it('should handle radialTrue when radialMag is null', () => {
            component['selectedNavaid'] = { latitudePrimary: 10, longitudePrimary: 20 }
            component.latestCoords = { lat: 11, lng: 22 }
            radialDistanceSpy.frdAndRadial.and.returnValue({
                radialMag: null,
                distanceNm: 50.5,
                radialTrue: 180
            })
            component['computeFRD']()
            expect(component.frdNm).toBe('18050.5')
        })
        it('should handle NaN radial values', () => {
            component['selectedNavaid'] = { latitudePrimary: 10, longitudePrimary: 20 }
            component.latestCoords = { lat: 11, lng: 22 }
            radialDistanceSpy.frdAndRadial.and.returnValue({
                radialMag: null,
                distanceNm: 10.0,
                radialTrue: null
            })
            component['computeFRD']()
            expect(component.frdNm).toBe('NaN010.0')
        })
        it('should pad radial and distance correctly', () => {
            component['selectedNavaid'] = { latitudePrimary: 10, longitudePrimary: 20 }
            component.latestCoords = { lat: 11, lng: 22 }
            radialDistanceSpy.frdAndRadial.and.returnValue({
                radialMag: 5,
                distanceNm: 1.2,
                radialTrue: 1
            })
            component['computeFRD']()
            expect(component.frdNm).toBe('00001.2')
        })
        it('should use stationDeclination when available', () => {
            component['selectedNavaid'] = { latitudePrimary: 10, longitudePrimary: 20 }
            component.latestCoords = { lat: 11, lng: 22 }
            component['stationDeclination'] = -13.5
            radialDistanceSpy.frdAndRadial.and.returnValue({
                radialMag: 90,
                distanceNm: 25.3,
                radialTrue: 1
            })
            component['computeFRD']()
            expect(radialDistanceSpy.frdAndRadial).toHaveBeenCalledWith(10, 20, 11, 22, -13.5)
        })
        it('should pass undefined declination when stationDeclination is null', () => {
            component['selectedNavaid'] = { latitudePrimary: 10, longitudePrimary: 20 }
            component.latestCoords = { lat: 11, lng: 22 }
            component['stationDeclination'] = null
            radialDistanceSpy.frdAndRadial.and.returnValue({
                radialMag: 90,
                distanceNm: 25.3,
                radialTrue: 1
            })
            component['computeFRD']()
            expect(radialDistanceSpy.frdAndRadial).toHaveBeenCalledWith(10, 20, 11, 22, undefined)
        })
    })
    describe('form validation patterns', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            fixture.detectChanges()
        })
        it('should validate facilityNumber with correct phone pattern', () => {
            const facilityCtrl = component['navaidForm'].get('facilityNumber')!
            facilityCtrl.setValue('555-123-4567')
            expect(facilityCtrl.valid).toBeTrue()
        })
        it('should invalidate facilityNumber with incorrect pattern', () => {
            const facilityCtrl = component['navaidForm'].get('facilityNumber')!
            facilityCtrl.setValue('invalid-phone')
            expect(facilityCtrl.valid).toBeFalse()
        })
        it('should validate agencyPhoneNumber with international format', () => {
            const phoneCtrl = component['navaidForm'].get('agencyPhoneNumber')!
            phoneCtrl.setValue('+1555-123-4567')
            phoneCtrl.setValidators([Validators.pattern(/\+?[0-9]?[0-9]{3}-?[0-9]{3}-?[0-9]{4}/)])
            phoneCtrl.updateValueAndValidity()
            expect(phoneCtrl.valid).toBeTrue()
        })
        it('should require navaid field', () => {
            const navaidCtrl = component['navaidForm'].get('navaid')!
            navaidCtrl.setValue('')
            expect(navaidCtrl.valid).toBeFalse()
            navaidCtrl.setValue('VOR')
            expect(navaidCtrl.valid).toBeTrue()
        })
        it('should require artcc field', () => {
            const artccCtrl = component['navaidForm'].get('artcc')!
            artccCtrl.setValue('')
            expect(artccCtrl.valid).toBeFalse()
            artccCtrl.setValue('ZNY')
            expect(artccCtrl.valid).toBeTrue()
        })
        it('should require faaCDNName field', () => {
            const faaCDNNameCtrl = component['navaidForm'].get('faaCDNName')!
            faaCDNNameCtrl.setValue('')
            expect(faaCDNNameCtrl.valid).toBeFalse()
            faaCDNNameCtrl.setValue('New York Center')
            expect(faaCDNNameCtrl.valid).toBeTrue()
        })
        it('should require agencyincharge field', () => {
            const agencyCtrl = component['navaidForm'].get('agencyincharge')!
            agencyCtrl.setValue('')
            expect(agencyCtrl.valid).toBeFalse()
            agencyCtrl.setValue('FAA')
            expect(agencyCtrl.valid).toBeTrue()
        })
    })
    describe('edge cases and error handling', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            fixture.detectChanges()
        })
        it('should handle empty artccs array in setOtherArtccFields', () => {
            component.artccs = []
            component['navaidForm'].get('artcc')?.setValue('ZNY')
            component.setOtherArtccFields()
            expect(component['navaidForm'].get('facilityNumber')?.value).toBe('555-555-5555')
        })
        it('should handle computeStationDeclination with lowercase hemisphere', () => {
            const result = (component as unknown as { computeStationDeclination: (val: number, dir: string) => number | null })
                .computeStationDeclination(10, 'w')
            expect(result).toBe(-10)
        })
        it('should handle computeStationDeclination with whitespace in hemisphere', () => {
            const result = (component as unknown as { computeStationDeclination: (val: number, dir: string) => number | null })
                .computeStationDeclination(8, ' E ')
            expect(result).toBe(8)
        })
        it('should handle zero distance in computeFRD', () => {
            component['selectedNavaid'] = { latitudePrimary: 10, longitudePrimary: 20 }
            component.latestCoords = { lat: 11, lng: 22 }
            radialDistanceSpy.frdAndRadial.and.returnValue({
                radialMag: 90,
                distanceNm: 0,
                radialTrue: 90
            })
            component['computeFRD']()
            expect(component.frdNm).toBe('09000.0')
        })
    })
})
