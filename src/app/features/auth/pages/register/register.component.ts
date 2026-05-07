import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';

function pastDateValidator(control: AbstractControl): ValidationErrors | null {
      if (!control.value) return null;
      const inputDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return inputDate >= today ? { futureDate: true } : null;
}
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { AddressService } from '../../../../core/services/address.service';
import { GovernorateDto, CityDto } from '../../../../core/model/interface/address.model';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
      selector: 'app-register',
      standalone: true,
      imports: [ReactiveFormsModule, CommonModule],
      templateUrl: './register.component.html',
      styleUrl: './register.component.css'
})
export class RegisterComponent {

      // Invitation State
      invitationForm: FormGroup;
      isCodeVerified = false;
      invitationStatus: 'INACTIVE' | 'PENDING' | 'ACTIVE' | null = null;
      isLoadingInvitation = false;
      invitationMessage: { text: string; type: 'success' | 'error' | 'info' } | null = null;

      // Registration State
      registrationForm: FormGroup;
      showPassword = false;

      // Address State
      governorates: GovernorateDto[] = [];
      filteredGovernorates: GovernorateDto[] = [];
      cities: CityDto[] = [];
      filteredCities: CityDto[] = [];
      searchGovernorateTerm = '';
      searchCityTerm = '';
      isGovDropdownOpen = false;
      isCityDropdownOpen = false;
      isLoadingCities = false;

      selectedGovName = '';
      selectedCityName = '';

      constructor(private fb: FormBuilder, private authService: AuthService, private addressService: AddressService, private router: Router, private eRef: ElementRef, private notificationService: NotificationService) {
            this.invitationForm = this.fb.group({
                  invitationCode: ['', Validators.required]
            });



            this.registrationForm = this.fb.group({
                  firstName: [''],
                  parentName: [''],
                  username: ['', [Validators.required, Validators.minLength(3)]],
                  email: ['', [Validators.required, Validators.email]],
                  password: ['', [Validators.required, Validators.minLength(6)]],
                  confirmPassword: ['', Validators.required],
                  phone: ['', [Validators.required, Validators.pattern(/^[0-9+\\-]+$/)]],
                  birthDate: ['', [Validators.required, pastDateValidator]],
                  gender: ['', Validators.required],
                  addressGroup: this.fb.group({
                        governorateId: [null, Validators.required],
                        cityId: [{ value: null, disabled: true }, Validators.required],
                        details: ['']
                  }),
                  agreeTerms: [false, Validators.requiredTrue]
            });
      }



      loadGovernorates(): void {
            this.addressService.getGovernorates().subscribe({
                  next: (response: any) => {
                        // Unpack nested response formats if present
                        let data = response;
                        if (response && !Array.isArray(response)) {
                              data = response.data || response.content || response.items || response.payload || [];
                        }

                        this.governorates = Array.isArray(data) ? data : [];
                        this.filteredGovernorates = [...this.governorates];
                  },
                  error: (err) => console.error('Failed to load governorates', err)
            });
      }

      toggleGovDropdown(isOpen?: boolean): void {
            this.isGovDropdownOpen = isOpen !== undefined ? isOpen : !this.isGovDropdownOpen;
            if (this.isGovDropdownOpen) {
                  this.isCityDropdownOpen = false;
                  this.searchGovernorateTerm = '';
                  this.filteredGovernorates = [...this.governorates];
            }
      }

      toggleCityDropdown(isOpen?: boolean): void {
            if (this.registrationForm.get('addressGroup.cityId')?.disabled) return;
            this.isCityDropdownOpen = isOpen !== undefined ? isOpen : !this.isCityDropdownOpen;
            if (this.isCityDropdownOpen) {
                  this.isGovDropdownOpen = false;
                  this.searchCityTerm = '';
                  this.filteredCities = [...this.cities];
            }
      }

      filterGovernorates(event: Event): void {
            const term = (event.target as HTMLInputElement).value;
            this.searchGovernorateTerm = term;
            this.filteredGovernorates = this.governorates.filter(g =>
                  g.nameEn.toLowerCase().includes(term.toLowerCase()) ||
                  g.nameAr.includes(term)
            );
      }

      filterCities(event: Event): void {
            const term = (event.target as HTMLInputElement).value;
            this.searchCityTerm = term;
            this.filteredCities = this.cities.filter(c =>
                  c.nameEn.toLowerCase().includes(term.toLowerCase()) ||
                  c.nameAr.includes(term)
            );
      }

      selectGovernorate(gov: GovernorateDto): void {
            this.registrationForm.get('addressGroup.governorateId')?.setValue(gov.id);
            this.selectedGovName = gov.nameAr;
            this.isGovDropdownOpen = false;

            // Reset city
            this.registrationForm.get('addressGroup.cityId')?.setValue(null);
            this.registrationForm.get('addressGroup.cityId')?.disable();
            this.selectedCityName = '';
            this.cities = [];
            this.filteredCities = [];

            // Fetch cities
            this.isLoadingCities = true;
            this.addressService.getCities(gov.id).subscribe({
                  next: (response: any) => {
                        this.isLoadingCities = false;

                        // Unpack nested response formats if present
                        let data = response;
                        if (response && !Array.isArray(response)) {
                              data = response.data || response.content || response.items || response.payload || [];
                        }

                        const citiesArray = Array.isArray(data) ? data : [];
                        this.cities = citiesArray;
                        this.filteredCities = [...citiesArray];
                        this.registrationForm.get('addressGroup.cityId')?.enable();

                        // Auto-select if only 1 city
                        if (citiesArray.length === 1) {
                              this.selectCity(citiesArray[0]);
                        }
                  },
                  error: (err) => {
                        this.isLoadingCities = false;
                        console.error('Failed to load cities', err);
                  }
            });
      }

      selectCity(city: CityDto): void {
            this.registrationForm.get('addressGroup.cityId')?.setValue(city.id);
            this.selectedCityName = city.nameAr;
            this.isCityDropdownOpen = false;
      }

      @HostListener('document:click', ['$event'])
      clickout(event: Event) {
            this.isGovDropdownOpen = false;
            this.isCityDropdownOpen = false;
      }

      trackById(index: number, item: any): number {
            return item.id;
      }

      togglePassword(): void {
            this.showPassword = !this.showPassword;
      }

      checkInvitation(): void {
            if (this.invitationForm.invalid) {
                  this.invitationForm.markAllAsTouched();
                  return;
            }

            this.isLoadingInvitation = true;
            this.invitationMessage = null;
            const invitationCode = this.invitationForm.value.invitationCode;

            this.authService.checkInvitationCode(invitationCode).subscribe({
                  next: (response) => {
                        this.isLoadingInvitation = false;
                        this.invitationStatus = response.status;

                        if (response.status === 'INACTIVE') {
                              this.isCodeVerified = true;
                              this.invitationMessage = { text: 'Register Now', type: 'success' };
                              this.loadGovernorates();

                              // Pre-fill full name
                              // const fullName = [response.firstName, response.familyName].filter(Boolean).join(' ');
                              const firstName = response.firstName;
                              // const parentName = response.parentName;

                              if (firstName) {
                                    this.registrationForm.patchValue({ firstName: firstName });
                              }
                              // if (parentName) {
                              //       this.registrationForm.patchValue({ parentName: parentName });
                              // }
                        } else if (response.status === 'PENDING') {
                              this.invitationMessage = { text: 'Your registration is waiting for approval.', type: 'info' };
                        } else if (response.status === 'ACTIVE') {
                              this.invitationMessage = { text: 'Your profile is already activated. Please login.', type: 'info' };
                        }
                  },
                  error: (err) => {
                        this.isLoadingInvitation = false;
                        console.error('❌ Check Invitation failed:', err);

                        // Extract error message from response if available, else generic message
                        const errorMessage = err?.error?.message || 'Invalid invitation code or an error occurred. Please try again.';
                        this.invitationMessage = { text: errorMessage, type: 'error' };
                  }
            });
      }

      resetInvitation(): void {
            this.isCodeVerified = false;
            this.invitationStatus = null;
            this.invitationMessage = null;
            this.invitationForm.reset();
            this.registrationForm.reset();
      }
      onSubmit(): void {
            if (this.registrationForm.invalid) {
                  this.registrationForm.markAllAsTouched(); // Show validation errors
                  return;
            }

            const formValue = this.registrationForm.value;

            // ✅ Validate password and confirm password
            if (formValue.password !== formValue.confirmPassword) {
                  this.registrationForm.get('confirmPassword')?.setErrors({ mismatch: true });
                  return;
            }

            // Construct final address string
            const details = this.registrationForm.get('addressGroup.details')?.value || '';
            const fullAddress = `${this.selectedGovName} - ${this.selectedCityName}${details ? ' - ' + details : ''}`;

            // Map data to precisely fit backend expectations
            const newUser = {
                  username: formValue.username,
                  email: formValue.email,
                  password: formValue.password,
                  phone: formValue.phone,
                  birthDate: formValue.birthDate,
                  gender: formValue.gender,
                  address: fullAddress
            };

            this.authService.register(newUser).subscribe({
                  next: (response) => {
                        console.log('✅ Registration successful:', response);
                        this.notificationService.success('تم التسجيل بنجاح! يمكنك الآن تسجيل الدخول.');
                        this.registrationForm.reset();
                        this.router.navigate(['/home']);

                  },
                  error: (err) => {
                        console.error('❌ Registration failed:', err);
                        this.notificationService.error('فشل التسجيل. يرجى المحاولة مرة أخرى.');
                  }
            });
      }

}
