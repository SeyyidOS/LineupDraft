import { render, screen } from '@testing-library/react';
import App from './App';

test('renders lineup positions', () => {
  render(<App />);
  const plusElements = screen.getAllByText('+');
  expect(plusElements.length).toBeGreaterThan(0);
});
