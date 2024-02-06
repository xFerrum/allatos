import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLinkWithHref } from '@angular/router';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from 'src/services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLinkWithHref, ReactiveFormsModule],
  providers: [UserService]
})
export class LoginPage
{
  form!: FormGroup;
  constructor(public formBuilder: FormBuilder, public userService: UserService, public router: Router)
  {
    this.form = this.formBuilder.group({
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

  async tryLogIn()
  {
    if (this.form.valid)
    {
      if (await this.userService.logUserIn(this.form.get('email')!.value, this.form.get('password')!.value))
      {
        this.router.navigate(['tabs/profile'])
      }
      else
      {
        console.log("Login failed.")
      }
    }
    else
    {
      return console.log('Please provide all the required values!');
    }
  };
}
