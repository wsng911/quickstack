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

    // Close the dialog with a result
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

    // Close without result
    act(() => {
      result.current.closeDialog();
    });

    expect(result.current.isDialogOpen).toBe(false);
    expect(result.current.content).toBe(null);

    // Verify the promise resolves with undefined
    await expect(dialogPromise!).resolves.toBeUndefined();
  });
});
