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
        searchTerm=""
        onSearchChange={mockOnChange}
        placeholder="Search..."
      />
    );

    const input = screen.getByPlaceholderText('Search...');
    expect(input).toBeInTheDocument();
  });

  it('should display current value', () => {
    render(
      <SearchFilter
        searchTerm="test value"
        onSearchChange={mockOnChange}
        placeholder="Search..."
      />
    );

    const input = screen.getByDisplayValue('test value');
    expect(input).toBeInTheDocument();
  });

  it('should call onChange when typing', () => {
    render(
      <SearchFilter
        searchTerm=""
        onSearchChange={mockOnChange}
        placeholder="Search..."
      />
    );

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'new search' } });

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('new search');
  });

  it('should render optional filters content', () => {
    render(
      <SearchFilter
        searchTerm=""
        onSearchChange={mockOnChange}
        placeholder="Search..."
        filters={<button type="button">Filtro</button>}
      />
    );

    expect(screen.getByText('Filtro')).toBeInTheDocument();
  });

  it('should keep the default placeholder when none is provided', () => {
    render(
      <SearchFilter searchTerm="" onSearchChange={mockOnChange} />
    );

    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
  });
});
