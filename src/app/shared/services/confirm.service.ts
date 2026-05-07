import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  private _show = signal(false);
  private _message = signal('');
  
  public readonly show = this._show.asReadonly();
  public readonly message = this._message.asReadonly();

  private resolvePromise!: (value: boolean) => void;

  confirm(message: string): Promise<boolean> {
    this._message.set(message);
    this._show.set(true);
    
    return new Promise((resolve) => {
      this.resolvePromise = resolve;
    });
  }

  respond(value: boolean): void {
    this._show.set(false);
    if (this.resolvePromise) {
      this.resolvePromise(value);
    }
  }
}
