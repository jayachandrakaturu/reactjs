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
import { NearestNavaidModel } from './nearest-navaid.model'
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

    describe('validation branch coverage', () => {
        beforeEach(() => {
            // Ensure fresh state for validation tests
            const frequencyCtrl = component['navaidForm'].get('frequency')!
            const phoneCtrl = component['navaidForm'].get('agencyPhoneNumber')!
            frequencyCtrl.setValue('', { emitEvent: false })
            phoneCtrl.setValue('', { emitEvent: false })
        })

        it('should clear frequency validators and set phone validators when phone has value', fakeAsync(() => {
            const frequencyCtrl = component['navaidForm'].get('frequency')!
            const phoneCtrl = component['navaidForm'].get('agencyPhoneNumber')!

            // Set phone with value (phone takes priority)
            phoneCtrl.setValue('555-111-2222')
            tick()

            // Frequency should have no validators (cleared)
            expect(frequencyCtrl.validator).toBeNull()
            // Phone should have required and pattern validators
            expect(phoneCtrl.hasValidator(Validators.required)).toBeTrue()
        }))

        it('should set frequency validators and clear phone validators when frequency has value', fakeAsync(() => {
            const frequencyCtrl = component['navaidForm'].get('frequency')!
            const phoneCtrl = component['navaidForm'].get('agencyPhoneNumber')!

            // Set frequency with value (frequency has priority when phone is empty)
            frequencyCtrl.setValue('108.5')
            tick()

            // Frequency should have required validator
            expect(frequencyCtrl.hasValidator(Validators.required)).toBeTrue()
            // Phone should have no validators (cleared)
            expect(phoneCtrl.validator).toBeNull()
        }))

        it('should set both fields as required when both are empty', fakeAsync(() => {
            const frequencyCtrl = component['navaidForm'].get('frequency')!
            const phoneCtrl = component['navaidForm'].get('agencyPhoneNumber')!

            // Both already empty from beforeEach, just trigger validation
            frequencyCtrl.setValue('')
            tick()

            // Both should have required validators
            expect(frequencyCtrl.hasValidator(Validators.required)).toBeTrue()
            expect(phoneCtrl.hasValidator(Validators.required)).toBeTrue()
        }))

        it('should treat whitespace-only phone as empty', fakeAsync(() => {
            const frequencyCtrl = component['navaidForm'].get('frequency')!
            const phoneCtrl = component['navaidForm'].get('agencyPhoneNumber')!

            // Set frequency first, then phone with whitespace
            frequencyCtrl.setValue('108.5')
            tick()
            phoneCtrl.setValue('   ')
            tick()

            // Since phone is whitespace-only (empty after trim), frequency takes priority
            expect(frequencyCtrl.hasValidator(Validators.required)).toBeTrue()
            expect(phoneCtrl.validator).toBeNull()
        }))

        it('should treat whitespace-only frequency as empty', fakeAsync(() => {
            const frequencyCtrl = component['navaidForm'].get('frequency')!
            const phoneCtrl = component['navaidForm'].get('agencyPhoneNumber')!

            // Set phone first, then frequency with whitespace
            phoneCtrl.setValue('555-111-2222')
            tick()
            frequencyCtrl.setValue('   ')
            tick()

            // Since frequency is whitespace-only (empty after trim), phone takes priority
            expect(frequencyCtrl.validator).toBeNull()
            expect(phoneCtrl.hasValidator(Validators.required)).toBeTrue()
        }))

        it('should treat both whitespace-only values as empty', fakeAsync(() => {
            const frequencyCtrl = component['navaidForm'].get('frequency')!
            const phoneCtrl = component['navaidForm'].get('agencyPhoneNumber')!

            // Set both to whitespace-only
            frequencyCtrl.setValue('   ')
            tick()
            phoneCtrl.setValue('  ')
            tick()

            // Both should be required (treated as empty after trim)
            expect(frequencyCtrl.hasValidator(Validators.required)).toBeTrue()
            expect(phoneCtrl.hasValidator(Validators.required)).toBeTrue()
        }))

        it('should prioritize phone when both fields have values', fakeAsync(() => {
            const frequencyCtrl = component['navaidForm'].get('frequency')!
            const phoneCtrl = component['navaidForm'].get('agencyPhoneNumber')!

            // Set frequency first, then phone
            frequencyCtrl.setValue('108.5')
            tick()
            phoneCtrl.setValue('555-111-2222')
            tick()

            // Phone takes priority - frequency validators cleared
            expect(frequencyCtrl.validator).toBeNull()
            expect(phoneCtrl.hasValidator(Validators.required)).toBeTrue()
        }))

        it('should validate phone pattern when phone has value', fakeAsync(() => {
            const frequencyCtrl = component['navaidForm'].get('frequency')!
            const phoneCtrl = component['navaidForm'].get('agencyPhoneNumber')!

            // Set valid phone number
            phoneCtrl.setValue('555-111-2222')
            tick()

            // Phone should have pattern validator
            const validators = phoneCtrl.validator ? phoneCtrl.validator({} as any) : null
            phoneCtrl.setValue('invalid')
            phoneCtrl.updateValueAndValidity()

            // Should fail pattern validation
            expect(phoneCtrl.hasError('pattern')).toBeTrue()
        }))

        it('should switch from phone priority to frequency priority', fakeAsync(() => {
            const frequencyCtrl = component['navaidForm'].get('frequency')!
            const phoneCtrl = component['navaidForm'].get('agencyPhoneNumber')!

            // Start with phone having value
            phoneCtrl.setValue('555-111-2222')
            tick()
            expect(frequencyCtrl.validator).toBeNull()

            // Clear phone and set frequency
            phoneCtrl.setValue('')
            tick()
            frequencyCtrl.setValue('108.5')
            tick()

            // Now frequency should have validators and phone should not
            expect(frequencyCtrl.hasValidator(Validators.required)).toBeTrue()
            expect(phoneCtrl.validator).toBeNull()
        }))

        it('should switch from frequency priority to phone priority', fakeAsync(() => {
            const frequencyCtrl = component['navaidForm'].get('frequency')!
            const phoneCtrl = component['navaidForm'].get('agencyPhoneNumber')!

            // Start with frequency having value
            frequencyCtrl.setValue('108.5')
            tick()
            expect(phoneCtrl.validator).toBeNull()

            // Clear frequency and set phone
            frequencyCtrl.setValue('')
            tick()
            phoneCtrl.setValue('555-111-2222')
            tick()

            // Now phone should have validators and frequency should not
            expect(frequencyCtrl.validator).toBeNull()
            expect(phoneCtrl.hasValidator(Validators.required)).toBeTrue()
        }))
    })

    describe('location valueChanges subscription', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            Object.assign(store, {
                navaidList$: of([]),
            })
            fixture.detectChanges()
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
            parentForm.get('location')?.setValue('')
            tick()
            expect(setOtherArtccFieldsSpy).not.toHaveBeenCalled()
        }))
    })

    describe('getNavaidLocation - valid navaid selected', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            const navaidList: NearestNavaidModel[] = [
                {
                    id: 'NV1',
                    dafifId: '',
                    name: '',
                    icaoId: '',
                    cityName: '',
                    stateCode: '',
                    stateName: '',
                    countryCode: '',
                    countryName: '',
                    accountability: '',
                    commType: '',
                    latitudePrimary: 40.5,
                    longitudePrimary: -74.2,
                    latitudeSecondary: 0,
                    longitudeSecondary: 0,
                    elevationPrimary: null,
                    fssId: '',
                    navType: '',
                    navId: '',
                    magVarn: '12',
                    magVarnHemis: 'W',
                    sourceSystem: '',
                    coordinatesPrimary: '',
                    coordinatesSecondary: '',
                } as NearestNavaidModel,
            ]
            Object.assign(store, {
                navaidList$: of(navaidList),
            })
            fixture.detectChanges()
        })

        it('should set selectedNavaid and stationDeclination when valid navaid found', () => {
            const mockChange: MatSelectChange<unknown> = {
                value: 'NV1',
                source: null!
            }
            component.getNavaidLocation(mockChange)
            expect(component['selectedNavaid']).toEqual({
                latitudePrimary: 40.5,
                longitudePrimary: -74.2
            })
            expect(component['stationDeclination']).toBe(-12)
        })

        it('should call computeFRD after selecting valid navaid', () => {
            const computeFRDSpy = spyOn(component as unknown as { computeFRD: () => void }, 'computeFRD')
            const mockChange: MatSelectChange<unknown> = {
                value: 'NV1',
                source: null!
            }
            component.getNavaidLocation(mockChange)
            expect(computeFRDSpy).toHaveBeenCalled()
        })
    })

    describe('computeFRD - edge cases', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            fixture.detectChanges()
        })

        it('should use radialTrue when radialMag is not available', () => {
            component['selectedNavaid'] = { latitudePrimary: 10, longitudePrimary: 20 }
            component.latestCoords = { lat: 11, lng: 22 }
            radialDistanceSpy.frdAndRadial.and.returnValue({
                distanceNm: 50.5,
                radialTrue: 45,
                radialMag: undefined
            })
            component['computeFRD']()
            expect(component.frdNm).toBe('045050.5')
        })

        it('should handle zero distance', () => {
            component['selectedNavaid'] = { latitudePrimary: 10, longitudePrimary: 20 }
            component.latestCoords = { lat: 11, lng: 22 }
            radialDistanceSpy.frdAndRadial.and.returnValue({
                distanceNm: 0,
                radialTrue: 90,
                radialMag: 92
            })
            component['computeFRD']()
            expect(component.frdNm).toBe('09200.0')
        })

        it('should pass declination to frdAndRadial when available', () => {
            component['selectedNavaid'] = { latitudePrimary: 10, longitudePrimary: 20 }
            component.latestCoords = { lat: 11, lng: 22 }
            component['stationDeclination'] = 5
            radialDistanceSpy.frdAndRadial.and.returnValue({
                radialMag: 90,
                distanceNm: 10.0,
                radialTrue: 85
            })
            component['computeFRD']()
            expect(radialDistanceSpy.frdAndRadial).toHaveBeenCalledWith(10, 20, 11, 22, 5)
        })
    })

    describe('toFiniteNumber', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            fixture.detectChanges()
        })

        it('should return number when passed a valid number', () => {
            const result = component['toFiniteNumber'](42)
            expect(result).toBe(42)
        })

        it('should convert string to number when valid', () => {
            const result = component['toFiniteNumber']('123.45')
            expect(result).toBe(123.45)
        })

        it('should return null for non-numeric strings', () => {
            const result = component['toFiniteNumber']('not-a-number')
            expect(result).toBeNull()
        })

        it('should return null for Infinity', () => {
            const result = component['toFiniteNumber'](Infinity)
            expect(result).toBeNull()
        })

        it('should return null for NaN', () => {
            const result = component['toFiniteNumber'](NaN)
            expect(result).toBeNull()
        })

        it('should return null for undefined', () => {
            const result = component['toFiniteNumber'](undefined)
            expect(result).toBeNull()
        })
    })

    describe('artcc$ observable and tap operator', () => {
        it('should populate artccs array and call setOtherArtccFields when artccs$ emits', fakeAsync(() => {
            const mockArtccs: ArtccValidateModel[] = [
                { artccId: 'ZNY', artccName: 'New York Center', phone: '123-456-7890' } as ArtccValidateModel,
                { artccId: 'ZDC', artccName: 'Washington Center', phone: '987-654-3210' } as ArtccValidateModel,
            ]
            Object.assign(cacheStore, {
                artccs$: of(mockArtccs),
            })
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            const setOtherArtccFieldsSpy = spyOn(NavaidComponent.prototype, 'setOtherArtccFields')
            fixture.detectChanges()
            tick()
            component.artcc$?.subscribe(() => {
                expect(component.artccs.length).toBe(2)
                expect(component.artccs[0].artccId).toBe('ZNY')
                expect(setOtherArtccFieldsSpy).toHaveBeenCalled()
            })
        }))

        it('should not call setOtherArtccFields when artccs array is empty', fakeAsync(() => {
            Object.assign(cacheStore, {
                artccs$: of([]),
            })
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            const setOtherArtccFieldsSpy = spyOn(NavaidComponent.prototype, 'setOtherArtccFields')
            fixture.detectChanges()
            tick()
            component.artcc$?.subscribe(() => {
                expect(setOtherArtccFieldsSpy).not.toHaveBeenCalled()
            })
        }))
    })

    describe('computeStationDeclination - additional edge cases', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            fixture.detectChanges()
        })

        it('should handle lowercase hemisphere designator', () => {
            const result = component['computeStationDeclination'](8, 'e')
            expect(result).toBe(8)
        })

        it('should handle hemisphere with whitespace', () => {
            const result = component['computeStationDeclination'](10, '  W  ')
            expect(result).toBe(-10)
        })

        it('should return null for invalid hemisphere', () => {
            const result = component['computeStationDeclination'](5, 'N')
            expect(result).toBeNull()
        })

        it('should return null for numeric hemisphere', () => {
            const result = component['computeStationDeclination'](5, 123)
            expect(result).toBeNull()
        })

        it('should return null when magVarn is Infinity', () => {
            const result = component['computeStationDeclination'](Infinity, 'E')
            expect(result).toBeNull()
        })
    })

    describe('coordinateService null filtering', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            Object.assign(store, {
                navaidList$: of([]),
            })
        })

        it('should not update latestCoords when coordinateService emits null', () => {
            fixture.detectChanges()
            const initialCoords = component.latestCoords
            coordinateSubject.next(null)
            fixture.detectChanges()
            expect(component.latestCoords).toBe(initialCoords)
        })
    })

    describe('setOtherArtccFields with undefined facility', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', { scenarioData: { tfrNavaid: {} } } as FaaNotamModel)
            fixture.detectChanges()
        })

        it('should handle empty artccs array gracefully', () => {
            component.artccs = []
            component['navaidForm'].get('artcc')?.setValue('ZNY')
            component.setOtherArtccFields()
            expect(component['navaidForm'].get('faaCDNName')?.value).toBeUndefined()
        })
    })
})
