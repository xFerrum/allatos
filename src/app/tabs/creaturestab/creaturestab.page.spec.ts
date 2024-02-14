import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreaturesPage } from './creaturestab.page';

describe('CreaturesPage', () => {
  let component: CreaturesPage;
  let fixture: ComponentFixture<CreaturesPage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(CreaturesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
