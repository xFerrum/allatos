import { Injectable } from "@angular/core";
import { AlertController } from "@ionic/angular";
import { LoadingController } from "@ionic/angular/standalone";
import { Notification } from "src/classes/notification";

@Injectable({
  providedIn: 'root',
})
 
export class PopUpService
{
  noti!: any;
  effect!: any;
  popup!: any;
  isLoading!: boolean; //needed in case popup needs to be dismissed before it has loaded, might get stuck otherwise
  notifications: Array<Notification> = [];
  
  constructor(private alertController: AlertController, private loadingController: LoadingController){}

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
    this.noti?.dismiss();
  }

  async showNotifications()
  {
    if (this.notifications.length > 1)
    {
      this.notifications.sort(function(a,b)
      {
        return (b.date.getTime() - b.date.getTime());
      });
    }
    let preparedNotis = [...this.notifications];
    this.clearNotifications();

    await this.showNextNotification(preparedNotis);
  }

  async showNextNotification(preparedNotis: Array<Notification>)
  {
    if (preparedNotis.length === 0) return;
  
    const noti = preparedNotis.shift(); // Get the first notification
    await this.notificationPopUp(noti!.description, noti!.title, preparedNotis);
  }

  async notificationPopUp(description: string, header: string, preparedNotis: Array<Notification>)
  {
    this.noti = await this.alertController.create
    ({
      header: header,
      message: description,
      buttons: ['Ok'],
    });
    await this.noti.present();
    this.noti.onDidDismiss().then(() => { this.showNextNotification(preparedNotis) });
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

  async loadNotifications(notis: Array<Notification>)
  {
    for (let noti of notis)
    {
      this.notifications.push(noti);
    }
    if (this.notifications.length > 0) await this.showNotifications();

  }

  clearNotifications()
  {
    this.notifications = [];
  }
}