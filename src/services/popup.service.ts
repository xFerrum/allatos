import { Injectable } from "@angular/core";
import { AlertController } from "@ionic/angular";
import { LoadingController } from "@ionic/angular/standalone";

@Injectable({
  providedIn: 'root',
})
 
export class PopUpService
{
  effect!: any;
  popup!: any;
  isLoading!: boolean; //needed in case popup needs to be dismissed before it has loaded, might get stuck otherwise
  
  constructor(public alertController: AlertController, public loadingController: LoadingController) {}

  async loadingPopUp(message: string)
  {
    this.isLoading = true;
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
    this.popup?.dismiss();
    this.effect?.dismiss();
  }

  async effectPopUp(description: string, cssClass: string, header?: string)
  {
    this.effect?.dismiss();
    this.effect = await this.alertController.create
    ({
      header: header,
      message: description,
      cssClass: cssClass
    });

    await this.effect.present();
  }

  async traitPopUp(description: string, cssClass: string, header?: string)
  {
    this.effect?.dismiss();
    this.effect = await this.alertController.create
    ({
      header: header,
      message: description,
      cssClass: cssClass
    });

    await this.effect.present();
  }
}