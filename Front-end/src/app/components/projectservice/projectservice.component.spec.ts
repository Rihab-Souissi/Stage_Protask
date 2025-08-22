import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectserviceComponent } from './Projectservice.component';

describe('ProjectserviceComponent', () => {
  let component: ProjectserviceComponent;
  let fixture: ComponentFixture<ProjectserviceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProjectserviceComponent]
    });
    fixture = TestBed.createComponent(ProjectserviceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
