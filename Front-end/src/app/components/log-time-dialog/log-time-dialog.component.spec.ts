import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogTimeDialogComponent } from './log-time-dialog.component';

describe('LogTimeDialogComponent', () => {
  let component: LogTimeDialogComponent;
  let fixture: ComponentFixture<LogTimeDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LogTimeDialogComponent]
    });
    fixture = TestBed.createComponent(LogTimeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
