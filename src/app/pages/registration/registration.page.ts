import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { UserService } from 'src/services/user.service';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.page.html',
  styleUrls: ['./registration.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule],
  providers: [UserService]
})

export class RegistrationPage implements OnInit
{ 
  form!: FormGroup;
  constructor(public formBuilder: FormBuilder, public userService: UserService) {}
  ngOnInit()
  {
    this.form = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      email: [
        '',
        [
          Validators.required,
          Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,3}$'),
        ],
      ],
    });
  }

  trySignUp()
  {
    if (this.form.valid) {
      console.log(this.form.value);
      this.userService.registerUser(this.form.get('username')!.value, this.form.get('email')!.value, this.form.get('password')!.value);
    } else {
      return console.log('Please provide all the required values!');
    }
  };
}
