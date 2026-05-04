import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDialog } from './zustand.states';

describe('useDialog hook', () => {
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

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useDialog());

    expect(result.current.isDialogOpen).toBe(false);
    expect(result.current.content).toBe(null);
    expect(result.current.resolvePromise).toBe(null);
  });

  it('opens dialog with content and returns promise', async () => {
    const { result } = renderHook(() => useDialog());
    const testContent = React.createElement('div', null, 'Test Content');

    let dialogPromise: Promise<any>;

    act(() => {
      dialogPromise = result.current.openDialog(testContent);
    });

    expect(result.current.isDialogOpen).toBe(true);
    expect(result.current.content).toBe(testContent);
    expect(result.current.resolvePromise).toBeTruthy();

    // 关闭 the dialog with a result
    act(() => {
      result.current.closeDialog('test-result');
    });

    expect(result.current.isDialogOpen).toBe(false);
    expect(result.current.content).toBe(null);
    expect(result.current.resolvePromise).toBe(null);

    // Verify the promise resolves with the correct result
    await expect(dialogPromise!).resolves.toBe('test-result');
  });

  it('closes dialog without result', async () => {
    const { result } = renderHook(() => useDialog());
    const testContent = React.createElement('div', null, 'Test Content');

    let dialogPromise: Promise<any>;

    act(() => {
      dialogPromise = result.current.openDialog(testContent);
    });

    expect(result.current.isDialogOpen).toBe(true);

    // 关闭 without result
    act(() => {
      result.current.closeDialog();
    });

    expect(result.current.isDialogOpen).toBe(false);
    expect(result.current.content).toBe(null);

    // Verify the promise resolves with undefined
    await expect(dialogPromise!).resolves.toBeUndefined();
  });

  it('opens dialog with positional size constraints', () => {
    const { result } = renderHook(() => useDialog());
    const testContent = React.createElement('div', null, 'Test Content');

    act(() => {
      result.current.openDialog(testContent, '90vw', '80vh', '760px', '640px');
    });

    expect(result.current.width).toBe('90vw');
    expect(result.current.height).toBe('80vh');
    expect(result.current.maxWidth).toBe('760px');
    expect(result.current.maxHeight).toBe('640px');
  });

  it('opens dialog with object size constraints', () => {
    const { result } = renderHook(() => useDialog());
    const testContent = React.createElement('div', null, 'Test Content');

    act(() => {
      result.current.openDialog(testContent, {
        width: '90vw',
        height: '80vh',
        maxWidth: '760px',
        maxHeight: '640px',
      });
    });

    expect(result.current.width).toBe('90vw');
    expect(result.current.height).toBe('80vh');
    expect(result.current.maxWidth).toBe('760px');
    expect(result.current.maxHeight).toBe('640px');
  });
});
