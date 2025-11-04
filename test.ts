it('should set validators correctly based on frequency and phone values', () => {
  const frequency = component.navaidForm.controls['frequency'];
  const phone = component.navaidForm.controls['agencyPhoneNumber'];

  // ✅ Case A: both empty
  frequency.setValue('');
  phone.setValue('');
  frequency.updateValueAndValidity();
  phone.updateValueAndValidity();

  expect(frequency.hasValidator(Validators.required)).toBeTrue();
  expect(phone.hasValidator(Validators.required)).toBeFalse();

  // ✅ Case B: frequency has value
  frequency.setValue('123');
  phone.setValue('');
  frequency.updateValueAndValidity();
  phone.updateValueAndValidity();

  expect(phone.hasValidator(Validators.required)).toBeTrue();

  // ✅ Case C: phone has value
  frequency.setValue('');
  phone.setValue('9876543210');
  frequency.updateValueAndValidity();
  phone.updateValueAndValidity();

  expect(frequency.hasValidator(Validators.required)).toBeTrue();
  expect(phone.hasValidator(Validators.required)).toBeFalse();

  // ✅ Case D: both have values
  frequency.setValue('123');
  phone.setValue('9876543210');
  frequency.updateValueAndValidity();
  phone.updateValueAndValidity();

  expect(phone.hasValidator(Validators.pattern)).toBeTrue();
});
