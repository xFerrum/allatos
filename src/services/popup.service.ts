import { Injectable } from "@angular/core";
import { AlertController } from "@ionic/angular";
import { LoadingController } from "@ionic/angular/standalone";

@Injectable({
  providedIn: 'root',
})
 
export class PopUpService
{
  popup!: any;
  constructor(public alertController: AlertController, public loadingController: LoadingController) {}

  async loadingPopUp(message: string)
  {
    this.popup = await this.loadingController.create
    ({
      message: message,
    });

    this.popup.present();
  }

  async dismissPopUp()
  {
    this.popup.dismiss();
  }
}