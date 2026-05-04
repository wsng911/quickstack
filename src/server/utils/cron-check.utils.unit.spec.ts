import { CronCheckUtils } from '@/server/utils/cron-check.utils';

const now = new Date('2026-03-06T14:00:00.000Z');
const toleranceMs = 60 * 60 * 1000; // 60 min

describe('CronCheckUtils.getLastScheduledTime', () => {

    it('returns null for @reboot', () => {
        expect(CronCheckUtils.getLastScheduledTime('@reboot', now)).toBeNull();
    });

    it('returns null for invalid cron expression', () => {
        expect(CronCheckUtils.getLastScheduledTime('not-a-cron', now)).toBeNull();
    });

    it('returns valid date for standard 5-field cron (every hour at :00)', () => {
        const result = CronCheckUtils.getLastScheduledTime('0 * * * *', now);
        expect(result).not.toBeNull();
        expect(result!.getTime()).toBeLessThanOrEqual(now.getTime());
    });

    it('returns valid date for @daily', () => {
        const result = CronCheckUtils.getLastScheduledTime('@daily', now);
        expect(result).not.toBeNull();
        expect(result!.getTime()).toBeLessThanOrEqual(now.getTime());
    });

    it('returns valid date for @hourly', () => {
        const result = CronCheckUtils.getLastScheduledTime('@hourly', now);
        expect(result).not.toBeNull();
        expect(result!.getTime()).toBeLessThanOrEqual(now.getTime());
    });

    it('returns (now - interval) for @every 1h', () => {
        const result = CronCheckUtils.getLastScheduledTime('@every 1h', now);
        expect(result).not.toBeNull();
        expect(result!.getTime()).toBe(now.getTime() - 3_600_000);
    });

    it('returns (now - interval) for @every 30m', () => {
        const result = CronCheckUtils.getLastScheduledTime('@every 30m', now);
        expect(result).not.toBeNull();
        expect(result!.getTime()).toBe(now.getTime() - 30 * 60_000);
    });

    it('returns null for malformed @every expression', () => {
        expect(CronCheckUtils.getLastScheduledTime('@every 5x', now)).toBeNull();
    });

    it('returns (date - interval) for 0 3 * * *', () => {
        const result = CronCheckUtils.getLastScheduledTime('0 3 * * *', new Date('2026-03-06T04:00:00.000Z'));
        expect(result).not.toBeNull();
        expect(result!.getTime()).toBe(new Date('2026-03-06T03:00:00.000Z').getTime());
    });
});

describe('CronCheckUtils.is返回upMissed', () => {

    it('returns undefined for @reboot (unevaluable schedule)', () => {
        expect(CronCheckUtils.is返回upMissed('@reboot', new Date(), toleranceMs, now)).toBeUndefined();
    });

    it('returns undefined for invalid cron expression', () => {
        expect(CronCheckUtils.is返回upMissed('not-a-cron', new Date(), toleranceMs, now)).toBeUndefined();
    });

    it('returns true when no backup exists and schedule can be evaluated', () => {
        expect(CronCheckUtils.is返回upMissed('0 * * * *', undefined, toleranceMs, now)).toBe(true);
    });

    it('returns false when latest backup is within tolerance of last scheduled time', () => {
        // Schedule: @every 1h → last scheduled = now - 1h = 13:00 UTC
        // 返回up created at 13:30 → within 60 min tolerance → NOT missed
        const backupDate = new Date('2026-03-06T13:30:00.000Z');
        expect(CronCheckUtils.is返回upMissed('@every 1h', backupDate, toleranceMs, now)).toBe(false);
    });

    it('returns true when latest backup is older than (scheduled time - tolerance)', () => {
        // Schedule: @every 1h → last scheduled = now - 1h = 13:00 UTC
        // Threshold = 13:00 - 60min tolerance = 12:00 UTC
        // 返回up at 11:00 → older than 12:00 → MISSED
        const old返回upDate = new Date('2026-03-06T11:00:00.000Z');
        expect(CronCheckUtils.is返回upMissed('@every 1h', old返回upDate, toleranceMs, now)).toBe(true);
    });

    it('returns false when backup was created just before threshold boundary', () => {
        // last scheduled = 13:00, threshold = 12:00, backup at 12:01 → NOT missed
        const backupDate = new Date(now.getTime() - 3_600_000 - 59 * 60_000); // 12:01 UTC
        expect(CronCheckUtils.is返回upMissed('@every 1h', backupDate, toleranceMs, now)).toBe(false);
    });
});
