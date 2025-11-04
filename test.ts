import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms'
import { MatSelectChange } from '@angular/material/select'
import { BehaviorSubject, of } from 'rxjs'
import { CoordinateService, Coordinates } from '../../../../services/coordinate.service'
import { RadialDistanceService } from '../../../../utils/components/notam-map/services/radial-distance.service'
import {
    ArtccValidateModel,
    FaaNotamModel,
    NearestNavaidModel,
} from '../../models'
import { LookupCacheStore } from '../../store/lookup-cache-store'
import { NotamHubStore } from '../../store/notam-hub.store'
import { NavaidComponent } from './navaid.component'

describe('NavaidComponent', () => {
    let component: NavaidComponent
    let fixture: ComponentFixture<NavaidComponent>
    let mockCoordinateService: jasmine.SpyObj<CoordinateService>
    let mockRadialDistanceService: jasmine.SpyObj<RadialDistanceService>
    let mockLookupCacheStore: jasmine.SpyObj<LookupCacheStore>
    let mockNotamHubStore: jasmine.SpyObj<NotamHubStore>
    let mockFormGroupDirective: FormGroupDirective
    let parentForm: FormGroup
    let coordsSubject: BehaviorSubject<Coordinates | null>
    let artccsSubject: BehaviorSubject<ArtccValidateModel[]>
    let navaidListSubject: BehaviorSubject<NearestNavaidModel[]>

    const mockArtccs: ArtccValidateModel[] = [
        {
            artccId: 'ZDC',
            artccName: 'Washington ARTCC',
            phone: '123-456-7890',
        } as ArtccValidateModel,
        {
            artccId: 'ZNY',
            artccName: 'New York ARTCC',
            phone: '987-654-3210',
        } as ArtccValidateModel,
    ]

    const mockNavaids: NearestNavaidModel[] = [
        {
            id: 'nav1',
            latitudePrimary: 38.8512,
            longitudePrimary: -77.0402,
            magVarn: 10,
            magVarnHemis: 'W',
        } as NearestNavaidModel,
        {
            id: 'nav2',
            latitudePrimary: 40.7128,
            longitudePrimary: -74.0060,
            magVarn: 12,
            magVarnHemis: 'E',
        } as NearestNavaidModel,
    ]

    const mockFaaNotamModel: FaaNotamModel = {
        scenarioData: {
            tfrNavaid: {
                navaid: 'NAV1',
                artcc: 'ZDC',
                faaCDNName: 'Washington ARTCC',
                facilityNumber: '123-456-7890',
                agencyincharge: 'FAA',
                agencyPhoneNumber: '111-222-3333',
                frequency: '118.5',
                operationRestrictions: 'Test restrictions',
                fixedRadialDistance: '090005.5',
            },
        },
    } as FaaNotamModel

    beforeEach(async () => {
        coordsSubject = new BehaviorSubject<Coordinates | null>(null)
        artccsSubject = new BehaviorSubject<ArtccValidateModel[]>([])
        navaidListSubject = new BehaviorSubject<NearestNavaidModel[]>([])

        mockCoordinateService = jasmine.createSpyObj('CoordinateService', [], {
            coords$: coordsSubject.asObservable(),
        })

        mockRadialDistanceService = jasmine.createSpyObj('RadialDistanceService', [
            'frdAndRadial',
        ])

        mockLookupCacheStore = jasmine.createSpyObj(
            'LookupCacheStore',
            ['fetchArtccs'],
            {
                artccs$: artccsSubject.asObservable(),
            }
        )

        mockNotamHubStore = jasmine.createSpyObj('NotamHubStore', [], {
            navaidList$: navaidListSubject.asObservable(),
        })

        parentForm = new FormGroup({
            location: new FormControl(''),
            scenarioData: new FormGroup({}),
        })

        mockFormGroupDirective = new FormGroupDirective([], [])
        mockFormGroupDirective.form = parentForm

        await TestBed.configureTestingModule({
            imports: [NavaidComponent, ReactiveFormsModule],
            providers: [
                { provide: CoordinateService, useValue: mockCoordinateService },
                { provide: RadialDistanceService, useValue: mockRadialDistanceService },
                { provide: FormGroupDirective, useValue: mockFormGroupDirective },
                { provide: LookupCacheStore, useValue: mockLookupCacheStore },
                { provide: NotamHubStore, useValue: mockNotamHubStore },
            ],
        }).compileComponents()

        fixture = TestBed.createComponent(NavaidComponent)
        component = fixture.componentInstance
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    describe('ngOnInit', () => {
        it('should initialize without model', () => {
            fixture.componentRef.setInput('model', undefined)
            fixture.detectChanges()

            expect(mockLookupCacheStore.fetchArtccs).toHaveBeenCalled()
            expect(component.navaidList$).toBeDefined()
            expect(component.navaidForm).toBeDefined()
        })

        it('should initialize with model and patch form values', () => {
            fixture.componentRef.setInput('model', mockFaaNotamModel)
            fixture.detectChanges()

            expect(component.navaidForm.get('navaid')?.value).toBe('NAV1')
            expect(component.navaidForm.get('artcc')?.value).toBe('ZDC')
            expect(component.navaidForm.get('faaCDNName')?.value).toBe('Washington ARTCC')
            expect(component.navaidForm.get('facilityNumber')?.value).toBe('123-456-7890')
            expect(component.navaidForm.get('agencyincharge')?.value).toBe('FAA')
            expect(component.navaidForm.get('agencyPhoneNumber')?.value).toBe('111-222-3333')
            expect(component.navaidForm.get('frequency')?.value).toBe('118.5')
            expect(component.navaidForm.get('operationRestrictions')?.value).toBe('Test restrictions')
            expect(component.navaidForm.get('fixedRadialDistance')?.value).toBe('090005.5')
        })

        it('should subscribe to navaidList$ and update cache', () => {
            fixture.componentRef.setInput('model', undefined)
            fixture.detectChanges()

            navaidListSubject.next(mockNavaids)

            expect(component['navaidsCache']).toEqual(mockNavaids)
        })

        it('should subscribe to coords$ and compute FRD when coordinates change', () => {
            fixture.componentRef.setInput('model', undefined)
            fixture.detectChanges()

            // First select a navaid
            const mockNavaid = mockNavaids[0]
            component['selectedNavaid'] = {
                latitudePrimary: mockNavaid.latitudePrimary,
                longitudePrimary: mockNavaid.longitudePrimary,
            }
            component['stationDeclination'] = -10

            mockRadialDistanceService.frdAndRadial.and.returnValue({
                radialMag: 90,
                radialTrue: 100,
                distanceNm: 5.5,
            })

            const coords: Coordinates = { lat: 39.0, lng: -77.5 }
            coordsSubject.next(coords)

            expect(component.latestCoords).toEqual(coords)
            expect(mockRadialDistanceService.frdAndRadial).toHaveBeenCalled()
            expect(component.frdNm).toBe('090005.5')
        })

        it('should not compute FRD when coordinates are null', () => {
            fixture.componentRef.setInput('model', undefined)
            fixture.detectChanges()

            coordsSubject.next(null)

            expect(component.latestCoords).toBeNull()
        })

        it('should update artcc when location changes', () => {
            fixture.componentRef.setInput('model', undefined)
            fixture.detectChanges()

            artccsSubject.next(mockArtccs)

            parentForm.get('location')?.setValue('ZDC')

            expect(parentForm.get('scenarioData.tfrNavaid.artcc')?.value).toBe('ZDC')
        })

        it('should set frequency as required when agencyPhoneNumber is empty', () => {
            fixture.componentRef.setInput('model', undefined)
            fixture.detectChanges()

            const frequency = component.navaidForm.get('frequency')!
            const agencyPhoneNumber = component.navaidForm.get('agencyPhoneNumber')!

            agencyPhoneNumber.setValue('')
            frequency.setValue('')

            expect(frequency.hasError('required')).toBe(true)
            expect(agencyPhoneNumber.hasError('required')).toBe(true)
        })

        it('should clear frequency validators when agencyPhoneNumber has value', () => {
            fixture.componentRef.setInput('model', undefined)
            fixture.detectChanges()

            const frequency = component.navaidForm.get('frequency')!
            const agencyPhoneNumber = component.navaidForm.get('agencyPhoneNumber')!

            agencyPhoneNumber.setValue('123-456-7890')

            expect(frequency.hasError('required')).toBe(false)
        })

        it('should clear agencyPhoneNumber validators when frequency has value', () => {
            fixture.componentRef.setInput('model', undefined)
            fixture.detectChanges()

            const frequency = component.navaidForm.get('frequency')!
            const agencyPhoneNumber = component.navaidForm.get('agencyPhoneNumber')!

            frequency.setValue('118.5')

            expect(agencyPhoneNumber.hasError('required')).toBe(false)
        })

        it('should set ARTCC fields when artccs are fetched', () => {
            fixture.componentRef.setInput('model', mockFaaNotamModel)
            fixture.detectChanges()

            spyOn(component, 'setOtherArtccFields')

            artccsSubject.next(mockArtccs)

            expect(component.artccs).toEqual(mockArtccs)
            expect(component.setOtherArtccFields).toHaveBeenCalled()
        })

        it('should not call setOtherArtccFields when artccs array is empty', () => {
            fixture.componentRef.setInput('model', undefined)
            fixture.detectChanges()

            spyOn(component, 'setOtherArtccFields')

            artccsSubject.next([])

            expect(component.setOtherArtccFields).not.toHaveBeenCalled()
        })
    })

    describe('ngOnDestroy', () => {
        it('should remove tfrNavaid control from form', () => {
            fixture.componentRef.setInput('model', undefined)
            fixture.detectChanges()

            expect(parentForm.get('scenarioData.tfrNavaid')).toBeDefined()

            component.ngOnDestroy()

            expect(parentForm.get('scenarioData.tfrNavaid')).toBeNull()
        })
    })

    describe('getNavaidLocation', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', undefined)
            fixture.detectChanges()
            navaidListSubject.next(mockNavaids)
        })

        it('should set selectedNavaid and compute FRD when valid navaid is selected', () => {
            mockRadialDistanceService.frdAndRadial.and.returnValue({
                radialMag: 90,
                radialTrue: 100,
                distanceNm: 5.5,
            })

            const coords: Coordinates = { lat: 39.0, lng: -77.5 }
            coordsSubject.next(coords)

            const event = {
                value: 'nav1',
            } as MatSelectChange

            component.getNavaidLocation(event)

            expect(component['selectedNavaid']).toEqual({
                latitudePrimary: 38.8512,
                longitudePrimary: -77.0402,
            })
            expect(component['stationDeclination']).toBe(-10)
            expect(component.frdNm).toBe('090005.5')
        })

        it('should handle East hemisphere declination', () => {
            const coords: Coordinates = { lat: 41.0, lng: -74.5 }
            coordsSubject.next(coords)

            mockRadialDistanceService.frdAndRadial.and.returnValue({
                radialMag: 180,
                radialTrue: 192,
                distanceNm: 10.3,
            })

            const event = {
                value: 'nav2',
            } as MatSelectChange

            component.getNavaidLocation(event)

            expect(component['stationDeclination']).toBe(12)
        })

        it('should reset values when navaid is not found', () => {
            component['selectedNavaid'] = {
                latitudePrimary: 38.8512,
                longitudePrimary: -77.0402,
            }
            component.frdNm = '090005.5'
            component['stationDeclination'] = -10

            const event = {
                value: 'nonexistent',
            } as MatSelectChange

            component.getNavaidLocation(event)

            expect(component['selectedNavaid']).toBeNull()
            expect(component.frdNm).toBe('')
            expect(component['stationDeclination']).toBeNull()
        })

        it('should compute FRD with radialTrue when radialMag is not available', () => {
            mockRadialDistanceService.frdAndRadial.and.returnValue({
                radialMag: undefined,
                radialTrue: 270,
                distanceNm: 15.7,
            })

            const coords: Coordinates = { lat: 39.0, lng: -77.5 }
            coordsSubject.next(coords)

            const event = {
                value: 'nav1',
            } as MatSelectChange

            component.getNavaidLocation(event)

            expect(component.frdNm).toBe('270015.7')
        })

        it('should handle NaN radial value', () => {
            mockRadialDistanceService.frdAndRadial.and.returnValue({
                radialMag: undefined,
                radialTrue: undefined,
                distanceNm: 5.5,
            })

            const coords: Coordinates = { lat: 39.0, lng: -77.5 }
            coordsSubject.next(coords)

            const event = {
                value: 'nav1',
            } as MatSelectChange

            component.getNavaidLocation(event)

            expect(component.frdNm).toContain('NaN')
        })
    })

    describe('setOtherArtccFields', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', undefined)
            fixture.detectChanges()
            component.artccs = mockArtccs
        })

        it('should set faaCDNName and facilityNumber when ARTCC is found', () => {
            component.navaidForm.get('artcc')?.setValue('ZDC')

            component.setOtherArtccFields()

            expect(component.navaidForm.get('faaCDNName')?.value).toBe('Washington ARTCC')
            expect(component.navaidForm.get('facilityNumber')?.value).toBe('123-456-7890')
        })

        it('should set default phone number when facility phone is not available', () => {
            component.artccs = [
                {
                    artccId: 'ZDC',
                    artccName: 'Washington ARTCC',
                    phone: undefined,
                } as ArtccValidateModel,
            ]

            component.navaidForm.get('artcc')?.setValue('ZDC')

            component.setOtherArtccFields()

            expect(component.navaidForm.get('facilityNumber')?.value).toBe('555-555-5555')
        })

        it('should handle undefined facility', () => {
            component.navaidForm.get('artcc')?.setValue('UNKNOWN')

            component.setOtherArtccFields()

            expect(component.navaidForm.get('faaCDNName')?.value).toBeUndefined()
            expect(component.navaidForm.get('facilityNumber')?.value).toBe('555-555-5555')
        })
    })

    describe('computeFRD', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', undefined)
            fixture.detectChanges()
        })

        it('should not compute FRD when selectedNavaid is null', () => {
            component['selectedNavaid'] = null
            component.latestCoords = { lat: 39.0, lng: -77.5 }

            component['computeFRD']()

            expect(mockRadialDistanceService.frdAndRadial).not.toHaveBeenCalled()
        })

        it('should not compute FRD when latestCoords is null', () => {
            component['selectedNavaid'] = {
                latitudePrimary: 38.8512,
                longitudePrimary: -77.0402,
            }
            component.latestCoords = null

            component['computeFRD']()

            expect(mockRadialDistanceService.frdAndRadial).not.toHaveBeenCalled()
        })

        it('should compute FRD with declination', () => {
            component['selectedNavaid'] = {
                latitudePrimary: 38.8512,
                longitudePrimary: -77.0402,
            }
            component.latestCoords = { lat: 39.0, lng: -77.5 }
            component['stationDeclination'] = -10

            mockRadialDistanceService.frdAndRadial.and.returnValue({
                radialMag: 90,
                radialTrue: 100,
                distanceNm: 5.5,
            })

            component['computeFRD']()

            expect(mockRadialDistanceService.frdAndRadial).toHaveBeenCalledWith(
                38.8512,
                -77.0402,
                39.0,
                -77.5,
                -10
            )
            expect(component.frdNm).toBe('090005.5')
            expect(component.navaidForm.get('fixedRadialDistance')?.value).toBe('090005.5')
        })

        it('should compute FRD without declination', () => {
            component['selectedNavaid'] = {
                latitudePrimary: 38.8512,
                longitudePrimary: -77.0402,
            }
            component.latestCoords = { lat: 39.0, lng: -77.5 }
            component['stationDeclination'] = null

            mockRadialDistanceService.frdAndRadial.and.returnValue({
                radialMag: 45,
                radialTrue: 55,
                distanceNm: 2.3,
            })

            component['computeFRD']()

            expect(mockRadialDistanceService.frdAndRadial).toHaveBeenCalledWith(
                38.8512,
                -77.0402,
                39.0,
                -77.5,
                undefined
            )
            expect(component.frdNm).toBe('045002.3')
        })

        it('should pad radial with leading zeros', () => {
            component['selectedNavaid'] = {
                latitudePrimary: 38.8512,
                longitudePrimary: -77.0402,
            }
            component.latestCoords = { lat: 39.0, lng: -77.5 }

            mockRadialDistanceService.frdAndRadial.and.returnValue({
                radialMag: 5,
                radialTrue: 15,
                distanceNm: 1.2,
            })

            component['computeFRD']()

            expect(component.frdNm).toBe('005001.2')
        })

        it('should pad distance with leading zeros', () => {
            component['selectedNavaid'] = {
                latitudePrimary: 38.8512,
                longitudePrimary: -77.0402,
            }
            component.latestCoords = { lat: 39.0, lng: -77.5 }

            mockRadialDistanceService.frdAndRadial.and.returnValue({
                radialMag: 270,
                radialTrue: 280,
                distanceNm: 0.5,
            })

            component['computeFRD']()

            expect(component.frdNm).toBe('270000.5')
        })

        it('should handle zero distance', () => {
            component['selectedNavaid'] = {
                latitudePrimary: 38.8512,
                longitudePrimary: -77.0402,
            }
            component.latestCoords = { lat: 38.8512, lng: -77.0402 }

            mockRadialDistanceService.frdAndRadial.and.returnValue({
                radialMag: 0,
                radialTrue: 0,
                distanceNm: 0,
            })

            component['computeFRD']()

            expect(component.frdNm).toBe('000000.0')
        })

        it('should handle undefined distanceNm', () => {
            component['selectedNavaid'] = {
                latitudePrimary: 38.8512,
                longitudePrimary: -77.0402,
            }
            component.latestCoords = { lat: 39.0, lng: -77.5 }

            mockRadialDistanceService.frdAndRadial.and.returnValue({
                radialMag: 90,
                radialTrue: 100,
                distanceNm: undefined,
            })

            component['computeFRD']()

            expect(component.frdNm).toBe('090000.0')
        })
    })

    describe('toFiniteNumber', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', undefined)
            fixture.detectChanges()
        })

        it('should convert valid number to finite number', () => {
            const result = component['toFiniteNumber'](42)
            expect(result).toBe(42)
        })

        it('should convert valid number string to finite number', () => {
            const result = component['toFiniteNumber']('42.5')
            expect(result).toBe(42.5)
        })

        it('should return null for NaN', () => {
            const result = component['toFiniteNumber']('not a number')
            expect(result).toBeNull()
        })

        it('should return null for Infinity', () => {
            const result = component['toFiniteNumber'](Infinity)
            expect(result).toBeNull()
        })

        it('should return null for -Infinity', () => {
            const result = component['toFiniteNumber'](-Infinity)
            expect(result).toBeNull()
        })

        it('should handle negative numbers', () => {
            const result = component['toFiniteNumber'](-42.5)
            expect(result).toBe(-42.5)
        })

        it('should handle zero', () => {
            const result = component['toFiniteNumber'](0)
            expect(result).toBe(0)
        })

        it('should handle null', () => {
            const result = component['toFiniteNumber'](null)
            expect(result).toBeNull()
        })

        it('should handle undefined', () => {
            const result = component['toFiniteNumber'](undefined)
            expect(result).toBeNull()
        })
    })

    describe('computeStationDeclination', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', undefined)
            fixture.detectChanges()
        })

        it('should compute positive declination for East hemisphere', () => {
            const result = component['computeStationDeclination'](10, 'E')
            expect(result).toBe(10)
        })

        it('should compute negative declination for West hemisphere', () => {
            const result = component['computeStationDeclination'](10, 'W')
            expect(result).toBe(-10)
        })

        it('should handle lowercase hemisphere', () => {
            const resultE = component['computeStationDeclination'](15, 'e')
            expect(resultE).toBe(15)

            const resultW = component['computeStationDeclination'](15, 'w')
            expect(resultW).toBe(-15)
        })

        it('should handle hemisphere with whitespace', () => {
            const result = component['computeStationDeclination'](12, '  E  ')
            expect(result).toBe(12)
        })

        it('should return null for invalid hemisphere', () => {
            const result = component['computeStationDeclination'](10, 'N')
            expect(result).toBeNull()
        })

        it('should return null for empty hemisphere', () => {
            const result = component['computeStationDeclination'](10, '')
            expect(result).toBeNull()
        })

        it('should return null for non-string hemisphere', () => {
            const result = component['computeStationDeclination'](10, 123)
            expect(result).toBeNull()
        })

        it('should return null for null magVarn', () => {
            const result = component['computeStationDeclination'](null, 'E')
            expect(result).toBeNull()
        })

        it('should return null for invalid magVarn', () => {
            const result = component['computeStationDeclination']('invalid', 'E')
            expect(result).toBeNull()
        })

        it('should return null for Infinity magVarn', () => {
            const result = component['computeStationDeclination'](Infinity, 'E')
            expect(result).toBeNull()
        })

        it('should handle zero declination', () => {
            const result = component['computeStationDeclination'](0, 'E')
            expect(result).toBe(0)
        })

        it('should handle negative magVarn with East hemisphere', () => {
            const result = component['computeStationDeclination'](-5, 'E')
            expect(result).toBe(-5)
        })

        it('should handle negative magVarn with West hemisphere', () => {
            const result = component['computeStationDeclination'](-5, 'W')
            expect(result).toBe(5)
        })
    })

    describe('buildForm', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', undefined)
            fixture.detectChanges()
        })

        it('should create navaidForm with all required controls', () => {
            expect(component.navaidForm.get('navaid')).toBeDefined()
            expect(component.navaidForm.get('artcc')).toBeDefined()
            expect(component.navaidForm.get('faaCDNName')).toBeDefined()
            expect(component.navaidForm.get('facilityNumber')).toBeDefined()
            expect(component.navaidForm.get('agencyincharge')).toBeDefined()
            expect(component.navaidForm.get('agencyPhoneNumber')).toBeDefined()
            expect(component.navaidForm.get('frequency')).toBeDefined()
            expect(component.navaidForm.get('operationRestrictions')).toBeDefined()
            expect(component.navaidForm.get('fixedRadialDistance')).toBeDefined()
        })

        it('should add tfrNavaid control to parent form scenarioData', () => {
            const scenarioData = parentForm.get('scenarioData') as FormGroup
            expect(scenarioData.get('tfrNavaid')).toBe(component.navaidForm)
        })

        it('should set required validators on navaid field', () => {
            const navaid = component.navaidForm.get('navaid')!
            navaid.setValue('')
            expect(navaid.hasError('required')).toBe(true)
        })

        it('should set required validators on artcc field', () => {
            const artcc = component.navaidForm.get('artcc')!
            artcc.setValue('')
            expect(artcc.hasError('required')).toBe(true)
        })

        it('should set pattern validators on facilityNumber field', () => {
            const facilityNumber = component.navaidForm.get('facilityNumber')!
            facilityNumber.setValue('invalid')
            expect(facilityNumber.hasError('pattern')).toBe(true)

            facilityNumber.setValue('123-456-7890')
            expect(facilityNumber.hasError('pattern')).toBe(false)
        })

        it('should set pattern validators on agencyPhoneNumber field', () => {
            const agencyPhoneNumber = component.navaidForm.get('agencyPhoneNumber')!
            agencyPhoneNumber.setValue('invalid')
            expect(agencyPhoneNumber.hasError('pattern')).toBe(true)

            agencyPhoneNumber.setValue('123-456-7890')
            expect(agencyPhoneNumber.hasError('pattern')).toBe(false)
        })
    })

    describe('Form Validation', () => {
        beforeEach(() => {
            fixture.componentRef.setInput('model', undefined)
            fixture.detectChanges()
        })

        it('should accept valid phone numbers with different formats', () => {
            const facilityNumber = component.navaidForm.get('facilityNumber')!

            facilityNumber.setValue('123-456-7890')
            expect(facilityNumber.valid).toBe(true)

            facilityNumber.setValue('1234567890')
            expect(facilityNumber.valid).toBe(true)

            facilityNumber.setValue('+11234567890')
            expect(facilityNumber.valid).toBe(true)
        })

        it('should reject invalid phone numbers', () => {
            const facilityNumber = component.navaidForm.get('facilityNumber')!

            facilityNumber.setValue('12345')
            expect(facilityNumber.valid).toBe(false)

            facilityNumber.setValue('abc-def-ghij')
            expect(facilityNumber.valid).toBe(false)
        })
    })
})

