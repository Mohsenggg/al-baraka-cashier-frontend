import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, throwError } from 'rxjs';
import { environment } from '../../shared/environment/developments';

export interface QuizQuestion {
  questionId: number;
  question: string;
  options: string[];
}

export interface QuizAnswerResponse {
  correct: boolean;
  nextStep: 'RETRY' | 'NEW_QUESTION' | 'GENERATE' | 'BLOCKED';
}

export interface InvitationGenerateResponse {
  code: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private http = inject(HttpClient);
  
  // Base URLs
  private readonly invitationsApi = `${environment.API_URL}/invitations`;
  private readonly authApi = `${environment.API_URL}/auth/invitation`;

  // Global Session Lock State
  private _isBlocked = signal<boolean>(false);
  public readonly isBlocked = this._isBlocked.asReadonly();

  private checkResponseForBlock(res: any): void {
    if (res && (res.nextStep === 'BLOCKED' || res.status === 'BLOCKED' || res.blocked === true)) {
      this._isBlocked.set(true);
    }
  }

  private handleError = (err: any) => {
    // Check if error response indicates blocked state (e.g. 403 or specific body)
    if (err.status === 403 || err.error?.nextStep === 'BLOCKED' || err.error?.status === 'BLOCKED' || err.error?.blocked === true) {
      this._isBlocked.set(true);
    }
    return throwError(() => err);
  };

  getQuestion(): Observable<QuizQuestion> {
    return this.http.get<QuizQuestion>(`${this.invitationsApi}/question`).pipe(
      tap(res => this.checkResponseForBlock(res)),
      catchError(this.handleError)
    );
  }

  answerQuestion(questionId: number, answer: string): Observable<QuizAnswerResponse> {
    return this.http.post<QuizAnswerResponse>(`${this.invitationsApi}/answer`, { questionId, answer }).pipe(
      tap(res => this.checkResponseForBlock(res)),
      catchError(this.handleError)
    );
  }

  generateInvitation(nodeId: number): Observable<InvitationGenerateResponse> {
    return this.http.post<InvitationGenerateResponse>(`${this.authApi}/generate`, { nodeId }).pipe(
      tap(res => this.checkResponseForBlock(res)),
      catchError(this.handleError)
    );
  }

  // Fallback dev mock data can be temporarily used if endpoints aren't strictly live:
  // (Left out for now, assuming endpoints exist)
}
