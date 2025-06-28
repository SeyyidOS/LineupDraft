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

test('club chemistry reaches 3 at seven players', () => {
  const players = [
    Array.from({ length: 7 }, (_, i) => ({
      name: `p${i}`,
      club: 'A',
      league: `L${i}`,
      nationality: `N${i}`,
    }))
  ];
  const result = calculateChemistry(players);
  expect(result[0].every(c => c === 3)).toBe(true);
});
