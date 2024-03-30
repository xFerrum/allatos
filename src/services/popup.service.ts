import { Injectable } from "@angular/core";
import { AlertController } from "@ionic/angular";
import { LoadingController } from "@ionic/angular/standalone";

@Injectable({
  providedIn: 'root',
})
 
export class PopUpService
{
  skill!: any;
  popup!: any;
  isLoading: boolean = true; //needed in case popup needs to be dismissed before it has loaded, might get stuck otherwise
  
  constructor(public alertController: AlertController, public loadingController: LoadingController) {}

  async loadingPopUp(message: string)
  {
    this.popup = await this.loadingController.create
    ({
      message: message,
    });

    await this.popup.present();
    if (!this.isLoading) this.popup.dismiss();
  }

  async dismissPopUp()
  {
    this.isLoading = false;
    this.popup.dismiss();
    this.skill.dismiss;
  }

  async skillPopUp(name: string, description: string)
  {
    this.skill = await this.alertController.create
    ({
      header: name,
      message: description,
      buttons: ['Close']
    });

    await this.skill.present();
  }
}