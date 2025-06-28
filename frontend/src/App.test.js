import { render, screen } from '@testing-library/react';
import App from './App';
import { calculateChemistry } from './chemistry';

test('renders lineup positions', () => {
  render(<App />);
  const plusElements = screen.getAllByText('+');
  expect(plusElements.length).toBeGreaterThan(0);
});

test('chemistry zero for empty lineup', () => {
  const formation = [[null, null]];
  const result = calculateChemistry(formation);
  expect(result.flat().every(c => c === 0)).toBe(true);
});
