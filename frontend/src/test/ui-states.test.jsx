import { render, screen } from '@testing-library/react';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';

describe('UI state components', () => {
  test('renders loading label', () => {
    render(<LoadingState label="Đang đồng bộ dữ liệu" />);
    expect(screen.getByText('Đang đồng bộ dữ liệu')).toBeInTheDocument();
  });

  test('renders empty state title and description', () => {
    render(<EmptyState title="Không có dữ liệu" description="Vui lòng tạo mới" />);
    expect(screen.getByText('Không có dữ liệu')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng tạo mới')).toBeInTheDocument();
  });

  test('renders error state', () => {
    render(<ErrorState message="Mất kết nối" />);
    expect(screen.getByText('Mất kết nối')).toBeInTheDocument();
  });
});
