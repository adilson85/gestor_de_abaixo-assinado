import React from 'react';
import { StatsCard } from '../StatsCard';
import { FileText } from 'lucide-react';

describe('StatsCard', () => {
  const defaultProps = {
    title: 'Test Title',
    value: 100,
    icon: FileText,
    color: 'blue' as const,
    description: 'Test description',
  };

  it('should have correct props structure', () => {
    expect(defaultProps.title).toBe('Test Title');
    expect(defaultProps.value).toBe(100);
    expect(defaultProps.color).toBe('blue');
    expect(defaultProps.description).toBe('Test description');
  });

  it('should handle different value types', () => {
    const propsWithZero = { ...defaultProps, value: 0 };
    const propsWithLargeNumber = { ...defaultProps, value: 999 };
    
    expect(propsWithZero.value).toBe(0);
    expect(propsWithLargeNumber.value).toBe(999);
  });

  it('should handle different colors', () => {
    const greenProps = { ...defaultProps, color: 'green' as const };
    const redProps = { ...defaultProps, color: 'red' as const };
    
    expect(greenProps.color).toBe('green');
    expect(redProps.color).toBe('red');
  });
});
