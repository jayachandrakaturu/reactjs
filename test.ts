import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnDestroy,
  OnInit,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms'
import { MatCardModule } from '@angular/material/card'
import { MatOptionModule } from '@angular/material/core'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectChange, MatSelectModule } from '@angular/material/select'
import { distinctUntilChanged, filter, merge, Observable, tap } from 'rxjs'
import { Coordinates, CoordinateService } from '../../../../services/coordinate.service'
import { RadialDistanceService } from '../../../../utils/components/notam-map/services/radial-distance.service'
import { AlphaNumFormatDirective } from '../../../../utils/directive/alpha-num-formatter.directive'
import {
  ArtccValidateModel,
  FaaNotamModel,
  NearestNavaidModel,
} from '../../models'
import { LookupCacheStore } from '../../store/lookup-cache-store'
import { NotamHubStore } from '../../store/notam-hub.store'
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  selector: 'app-navaid',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    AlphaNumFormatDirective,
  ],
  templateUrl: './navaid.component.html'
})
export class NavaidComponent implements OnInit, OnDestroy {
  protected navaidForm!: FormGroup
  public model = input<FaaNotamModel>()
  public artcc$?: Observable<ArtccValidateModel[]>
  public artccs: ArtccValidateModel[] = []
  public navaidList$?: Observable<NearestNavaidModel[]>
  public latestCoords: Coordinates | null = null
  public frdNm = ''
  private selectedNavaid:
    | { latitudePrimary: number, longitudePrimary: number }
    | null = null
  private destroyRef = inject(DestroyRef)
  private form!: FormGroup
  private navaidsCache: NearestNavaidModel[] = []
  private stationDeclination: number | null = null
  public constructor(
    private readonly coordinateService: CoordinateService,
    private readonly radialDistance: RadialDistanceService,
    private readonly formGroupDirective: FormGroupDirective,
    private readonly lookupCacheStore: LookupCacheStore,
    private readonly notamHubStore: NotamHubStore
  ) { }
  public ngOnInit(): void {
    this.lookupCacheStore.fetchArtccs()
    this.navaidList$ = this.notamHubStore.navaidList$
    const navaid = this.model()?.scenarioData.tfrNavaid
    this.form = this.formGroupDirective.form
    this.buildForm()
    this.navaidList$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((list) => {
        this.navaidsCache = list
      })
    this.coordinateService.coords$
      .pipe(
        filter((c): c is Coordinates => c !== null),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((c) => {
        this.latestCoords = c
        this.computeFRD()
      })
    this.form
      .get('location')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value) {
          this.form
            .get('scenarioData.tfrNavaid.artcc')
            ?.setValue(value, { emitEvent: false })
          this.setOtherArtccFields()
        }
      })
    const { frequency, agencyPhoneNumber } = this.navaidForm?.controls ?? {}
    merge(frequency?.valueChanges, agencyPhoneNumber?.valueChanges).pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!frequency || !agencyPhoneNumber) {
          return
        }
        const phoneNumberVal = agencyPhoneNumber.value?.trim() ?? ''
        const frequencyVal = frequency.value?.trim() ?? ''
        if (phoneNumberVal) {
          frequency.clearValidators()
          agencyPhoneNumber.setValidators([Validators.required, Validators.pattern(/\+?[0-9]?[0-9]{3}-?[0-9]{3}-?[0-9]{4}/)])
        }
        else if (frequencyVal) {
          frequency.setValidators([Validators.required])
          agencyPhoneNumber.clearValidators()
        }
        else {
          frequency.setValidators([Validators.required])
          agencyPhoneNumber.setValidators([Validators.required])
        }
        frequency.updateValueAndValidity()
        agencyPhoneNumber.updateValueAndValidity()
      })
    this.artcc$ = this.lookupCacheStore.artccs$.pipe(
      tap((types: ArtccValidateModel[]) => {
        this.artccs = types
        if (types.length > 0) {
          this.setOtherArtccFields()
        }
      })
    )
    if (this.navaidForm) {
      this.navaidForm.patchValue({
        navaid: navaid?.navaid ?? '',
        artcc: navaid?.artcc ?? '',
        faaCDNName: navaid?.faaCDNName ?? '',
        facilityNumber: navaid?.facilityNumber ?? '',
        agencyincharge: navaid?.agencyincharge ?? '',
        agencyPhoneNumber: navaid?.agencyPhoneNumber ?? '',
        frequency: navaid?.frequency ?? '',
        operationRestrictions: navaid?.operationRestrictions ?? '',
        fixedRadialDistance: navaid?.fixedRadialDistance ?? '',
      })
    }
  }
  public ngOnDestroy(): void {
    if (!this.form) {
      return
    }
    const scenarioData = this.form.get('scenarioData') as FormGroup
    if (scenarioData) {
      scenarioData.removeControl('tfrNavaid')
    }
  }
  public getNavaidLocation(event: MatSelectChange): void {
    const selectedId = event.value as string
    const selected = this.navaidsCache.find((n) => n.id === selectedId)
    if (!selected) {
      this.selectedNavaid = null
      this.frdNm = ''
      this.stationDeclination = null
      return
    }
    const magVarn = selected.magVarn
    const magVarnHemis = selected.magVarnHemis
    this.stationDeclination = this.computeStationDeclination(magVarn, magVarnHemis)
    this.selectedNavaid = {
      latitudePrimary: selected.latitudePrimary,
      longitudePrimary: selected.longitudePrimary
    }
    this.computeFRD()
  }
  public setOtherArtccFields(): void {
    if (!this.navaidForm) {
      return
    }
    const selectedArtcc = this.navaidForm.get('artcc')?.value
    const facility = this.artccs.find((f) => f.artccId === selectedArtcc)
    this.navaidForm.get('faaCDNName')?.setValue(facility?.artccName)
    const phoneNumber = facility?.phone ?? '555-555-5555'
    this.navaidForm.get('facilityNumber')?.setValue(phoneNumber)
  }
  private computeFRD(): void {
    if (!this.selectedNavaid || !this.latestCoords || !this.navaidForm) {
      return
    }
    const declination: number | undefined = this.stationDeclination ?? undefined
    const radialCalculation = this.radialDistance.frdAndRadial(
      this.selectedNavaid.latitudePrimary,
      this.selectedNavaid.longitudePrimary,
      this.latestCoords.lat,
      this.latestCoords.lng,
      declination
    )
    const rawRadial = radialCalculation.radialMag ?? radialCalculation.radialTrue ?? NaN
    const rawDistance = radialCalculation.distanceNm ?? 0
    const radial = String(Math.round(rawRadial)).padStart(3, '0')
    const distance = rawDistance.toFixed(1).padStart(5, '0')
    const radialDistanceString = `${radial}${distance}`
    this.frdNm = radialDistanceString
    this.navaidForm.get('fixedRadialDistance')?.setValue(this.frdNm, { emitEvent: false })
  }
  private buildForm(): void {
    this.navaidForm = new FormGroup(
      {
        navaid: new FormControl('', Validators.required),
        artcc: new FormControl('', Validators.required),
        faaCDNName: new FormControl('', Validators.required),
        facilityNumber: new FormControl('', [
          Validators.pattern(/\+?[0-9]?[0-9]{3}-?[0-9]{3}-?[0-9]{4}/),
          Validators.required,
        ]),
        agencyincharge: new FormControl('', Validators.required),
        agencyPhoneNumber: new FormControl('', [
          Validators.pattern(/\+?[0-9]?[0-9]{3}-?[0-9]{3}-?[0-9]{4}/),
        ]),
        frequency: new FormControl(''),
        operationRestrictions: new FormControl(''),
        fixedRadialDistance: new FormControl('',)
      }
    )
    const scenarioData = this.form.get('scenarioData') as FormGroup
    scenarioData.addControl('tfrNavaid', this.navaidForm)
  }
  private toFiniteNumber(value: unknown): number | null {
    const n = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(n) ? n : null
  }
  private computeStationDeclination(magVarn: unknown, hemis: unknown): number | null {
    const mag = this.toFiniteNumber(magVarn)
    const h = typeof hemis === 'string' ? hemis.trim().toUpperCase() : ''
    if (mag === null || (h !== 'E' && h !== 'W')) return null
    return h === 'E' ? mag : -mag
  }
}
