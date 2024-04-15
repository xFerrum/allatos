import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLinkWithHref } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from 'src/services/user.service';
import { Router } from '@angular/router';
import { PopUpService } from 'src/services/popup.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLinkWithHref, ReactiveFormsModule],
})

export class LoginPage implements OnInit
{
  loadingDone = false;
  form!: FormGroup;
  constructor(public formBuilder: FormBuilder, public userService: UserService, public router: Router, public popUpService: PopUpService)
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
  
  ngOnInit(): void
  {
    if (this.userService.isLoggedIn()) this.router.navigate(["tabs"]);
    else this.loadingDone = true;
  }

  async tryLogIn()
  {
    this.popUpService.loadingPopUp("Logging in");

    if (this.form.valid)
    {
      if (await this.userService.logUserIn(this.form.get('email')!.value, this.form.get('password')!.value))
      {
        this.router.navigate(['tabs']);
      }
      else
      {
        console.error("Login failed.")
      }
    }
    else
    {
      console.log('Please provide all the required values!');
    }

    await this.popUpService.dismissPopUp();
  };
}
