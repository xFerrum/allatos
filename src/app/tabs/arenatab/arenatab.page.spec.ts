import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArenaPage } from './arenatab.page';

describe('ArenaPage', () => {
  let component: ArenaPage;
  let fixture: ComponentFixture<ArenaPage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ArenaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
