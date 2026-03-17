import { TestBed } from '@angular/core/testing';

import { FinanceDataService } from './finance-data.service';

describe('FinanceDataService', () => {
  let service: FinanceDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FinanceDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
