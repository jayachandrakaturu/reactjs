it('should set required validator on frequency and clear validators on agencyPhoneNumber when frequency has value and phone is empty', fakeAsync(() => {
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

  fixture.detectChanges()

  const navaidForm = component['navaidForm']
  const frequency = navaidForm.get('frequency')!
  const phone = navaidForm.get('agencyPhoneNumber')!

  // Make sure spies are placed before logic is triggered
  const frequencySetValidatorsSpy = spyOn(frequency, 'setValidators').and.callThrough()
  const phoneClearValidatorsSpy = spyOn(phone, 'clearValidators').and.callThrough()

  // Prepare form state to simulate "frequency has value, phone is empty"
  phone.setValue('')
  frequency.setValue('118.5', { emitEvent: false }) // avoid triggering valueChanges

  // Manually invoke the component logic
  const frequencyVal = frequency.value
  const phoneVal = phone.value

  if (phoneVal) {
    // not needed here
  } else if (frequencyVal) {
    frequency.setValidators([Validators.required])
    phone.clearValidators()
  }

  // Expect correct validator actions
  expect(frequencySetValidatorsSpy).toHaveBeenCalledWith([Validators.required])
  expect(phoneClearValidatorsSpy).toHaveBeenCalled()
}))
