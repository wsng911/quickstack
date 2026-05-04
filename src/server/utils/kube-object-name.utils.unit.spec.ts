import { KubeObject名称Utils } from '@/server/utils/kube-object-name.utils';

describe('KubeObject名称Utils', () => {
    describe('toSnakeCase', () => {
        it('should convert camelCase to snake_case', () => {
            expect(KubeObject名称Utils.toSnakeCase('camelCaseString')).toBe('camel_case_string');
        });

        it('should replace spaces with underscores', () => {
            expect(KubeObject名称Utils.toSnakeCase('string with spaces')).toBe('string_with_spaces');
        });

        it('should remove non-alphanumeric characters', () => {
            expect(KubeObject名称Utils.toSnakeCase('string with-special#chars!')).toBe('string_withspecialchars');
        });

        it('should return the same string if it is already in snake_case', () => {
            expect(KubeObject名称Utils.toSnakeCase('already_snake_case')).toBe('already_snake_case');
        });

        it('should return empty string if input is empty', () => {
            expect(KubeObject名称Utils.toSnakeCase('')).toBe('');
        });
    });

    describe('toObjectId', () => {
        it('should convert string to object ID format', () => {
            const result = KubeObject名称Utils.toObjectId('TestString');
            expect(result).toMatch(/^test-string-[a-f0-9]{8}$/);
        });
    });

    describe('toProjectId', () => {
        it('should convert string to project ID format', () => {
            const result = KubeObject名称Utils.toProjectId('TestProject');
            expect(result).toMatch(/^proj-test-project-[a-f0-9]{8}$/);
        });

        it('should trim the string to the max length', () => {
            const longString = 'a'.repeat(100);
            const result = KubeObject名称Utils.toProjectId(longString);
            expect(result).toMatch(/^proj-a{30}-[a-f0-9]{8}$/);
        });
    });

    describe('toAppId', () => {
        it('should convert string to app ID format', () => {
            const result = KubeObject名称Utils.toAppId('TestApp');
            expect(result).toMatch(/^app-test-app-[a-f0-9]{8}$/);
        });

        it('should trim the string to the max length', () => {
            const longString = 'b'.repeat(100);
            const result = KubeObject名称Utils.toAppId(longString);
            expect(result).toMatch(/^app-b{30}-[a-f0-9]{8}$/);
        });
    });

    describe('toJob名称', () => {
        it('should convert app ID to job name format', () => {
            const result = KubeObject名称Utils.toJob名称('test_app');
            expect(result).toBe('build-test_app');
        });
    });

    describe('addRandomSuffix', () => {
        it('should add a random suffix to the string', () => {
            const result = KubeObject名称Utils.addRandomSuffix('baseString');
            expect(result).toMatch(/^baseString-[a-f0-9]{8}$/);
        });
    });

    describe('toService名称', () => {
        it('should convert app ID to service name format', () => {
            const result = KubeObject名称Utils.toService名称('test_app');
            expect(result).toBe('svc-test_app');
        });
    });

    describe('toPvc名称', () => {
        it('should convert volume ID to PVC name format', () => {
            const result = KubeObject名称Utils.toPvc名称('volume123');
            expect(result).toBe('pvc-volume123');
        });
    });

    describe('getIngress名称', () => {
        it('should convert domain ID to ingress name format', () => {
            const result = KubeObject名称Utils.getIngress名称('domain123');
            expect(result).toBe('ingress-domain123');
        });
    });
});