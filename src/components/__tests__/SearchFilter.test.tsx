import { render, screen, fireEvent } from '@testing-library/react';
import { SearchFilter } from '../SearchFilter';

describe('SearchFilter', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('should render with placeholder', () => {
    render(
      <SearchFilter
        value=""
        onChange={mockOnChange}
        placeholder="Search..."
      />
    );

    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeInTheDocument();
  });

  it('should display current value', () => {
    render(
      <SearchFilter
        value="test value"
        onChange={mockOnChange}
        placeholder="Search..."
      />
    );

    const input = screen.getByDisplayValue('test value');
    expect(input).toBeInTheDocument();
  });

  it('should call onChange when typing', () => {
    render(
      <SearchFilter
        value=""
        onChange={mockOnChange}
        placeholder="Search..."
      />
    );

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'new search' } });

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('new search');
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <SearchFilter
        value=""
        onChange={mockOnChange}
        placeholder="Search..."
        disabled={true}
      />
    );

    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeDisabled();
  });

  it('should not call onChange when disabled', () => {
    render(
      <SearchFilter
        value=""
        onChange={mockOnChange}
        placeholder="Search..."
        disabled={true}
      />
    );

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(mockOnChange).not.toHaveBeenCalled();
  });
});
