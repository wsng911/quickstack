
import { FormUtils } from "@/frontend/utils/form.utilts";
import { ServerActionResult } from "@/shared/model/server-action-error-return.model";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

describe('FormUtils', () => {
    describe('mapValidationErrorsToForm', () => {
        it('should clear existing errors and set new errors from state', () => {
            const mockForm: UseFormReturn<any> = {
                clearErrors: vi.fn(),
                setError: vi.fn(),
            } as any;

            const state = {
                data: undefined,
                message: undefined,
                status: 'error',
                errors: {
                    name: ['名称 is required'],
                    email: ['邮箱 is invalid']
                }
            } as ServerActionResult<any, any>;

            FormUtils.mapValidationErrorsToForm(state, mockForm);

            expect(mockForm.clearErrors).toHaveBeenCalled();
            expect(mockForm.setError).toHaveBeenCalledWith('name', { type: 'manual', message: '名称 is required' });
            expect(mockForm.setError).toHaveBeenCalledWith('email', { type: 'manual', message: '邮箱 is invalid' });
        });

        it('should not set errors if state has no errors', () => {
            const mockForm: UseFormReturn<any> = {
                clearErrors: vi.fn(),
                setError: vi.fn(),
            } as any;

            const state = {
                data: undefined,
                message: undefined,
                status: 'error',
                errors: {}
            } as ServerActionResult<any, any>;

            FormUtils.mapValidationErrorsToForm(state, mockForm);

            expect(mockForm.clearErrors).toHaveBeenCalled();
            expect(mockForm.setError).not.toHaveBeenCalled();
        });
    });
});