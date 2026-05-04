/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDialog } from '@/frontend/states/zustand.states';

// Integration test showing realistic usage patterns
describe('useDialog integration tests', () => {
  beforeEach(() => {
    useDialog.setState({
      isDialogOpen: false,
      content: null,
      resolvePromise: null,
      width: undefined,
      height: undefined,
      maxWidth: undefined,
      maxHeight: undefined,
    });
  });

  it('multiple dialogs can be opened sequentially', async () => {
    const { result } = renderHook(() => useDialog());

    // First dialog
    const content1 = React.createElement('div', null, 'Dialog 1');
    let promise1: Promise<any>;

    act(() => {
      promise1 = result.current.openDialog(content1);
    });

    expect(result.current.isDialogOpen).toBe(true);
    expect(result.current.content).toBe(content1);

    act(() => {
      result.current.closeDialog('result1');
    });

    await expect(promise1!).resolves.toBe('result1');
    expect(result.current.isDialogOpen).toBe(false);

    // Second dialog immediately after
    const content2 = React.createElement('div', null, 'Dialog 2');
    let promise2: Promise<any>;

    act(() => {
      promise2 = result.current.openDialog(content2);
    });

    expect(result.current.isDialogOpen).toBe(true);
    expect(result.current.content).toBe(content2);

    act(() => {
      result.current.closeDialog('result2');
    });

    await expect(promise2!).resolves.toBe('result2');
  });

  it('handles complex ReactNode content', async () => {
    const { result } = renderHook(() => useDialog());

    // Create a complex ReactNode structure
    const complexContent = React.createElement(
      'div',
      { className: 'dialog-content' },
      React.createElement('h1', null, 'Title'),
      React.createElement('p', null, 'Description'),
      React.createElement('button', { 'data-testid': 'action-btn' }, 'Action')
    );

    let dialogPromise: Promise<any>;

    act(() => {
      dialogPromise = result.current.openDialog(complexContent);
    });

    expect(result.current.isDialogOpen).toBe(true);
    expect(result.current.content).toBe(complexContent);

    act(() => {
      result.current.closeDialog({ action: 'completed', data: { id: 123 } });
    });

    await expect(dialogPromise!).resolves.toEqual({
      action: 'completed',
      data: { id: 123 }
    });
  });

  it('dialog state resets properly between uses', async () => {
    const { result } = renderHook(() => useDialog());

    // Open and close first dialog
    const content1 = React.createElement('div', null, 'Dialog 1');
    let promise1: Promise<any>;

    act(() => {
      promise1 = result.current.openDialog(content1);
    });

    act(() => {
      result.current.closeDialog('first');
    });

    await promise1!;

    // Verify state is clean
    expect(result.current.isDialogOpen).toBe(false);
    expect(result.current.content).toBe(null);
    expect(result.current.resolvePromise).toBe(null);

    // Open second dialog with different content
    const content2 = React.createElement('span', null, 'Dialog 2');
    let promise2: Promise<any>;

    act(() => {
      promise2 = result.current.openDialog(content2);
    });

    expect(result.current.isDialogOpen).toBe(true);
    expect(result.current.content).toBe(content2);
    expect(result.current.content).not.toBe(content1); // Different content

    act(() => {
      result.current.closeDialog('second');
    });

    await expect(promise2!).resolves.toBe('second');
  });
});
