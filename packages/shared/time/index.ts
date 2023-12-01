import { logError } from '../sentry';

export interface TimeDelta {
    hours?: number;
    days?: number;
    months?: number;
    years?: number;
}

const currentYear = new Date().getFullYear();

export function getUnixTimeInMicroSecondsWithDelta(delta: TimeDelta): number {
    let currentDate = new Date();
    if (delta?.hours) {
        currentDate = _addHours(currentDate, delta.hours);
    }
    if (delta?.days) {
        currentDate = _addDays(currentDate, delta.days);
    }
    if (delta?.months) {
        currentDate = _addMonth(currentDate, delta.months);
    }
    if (delta?.years) {
        currentDate = _addYears(currentDate, delta.years);
    }
    return currentDate.getTime() * 1000;
}

export function validateAndGetCreationUnixTimeInMicroSeconds(dateTime: Date) {
    if (!dateTime || isNaN(dateTime.getTime())) {
        return null;
    }
    const unixTime = dateTime.getTime() * 1000;
    //ignoring dateTimeString = "0000:00:00 00:00:00"
    if (unixTime === Date.UTC(0, 0, 0, 0, 0, 0, 0) || unixTime === 0) {
        return null;
    } else if (unixTime > Date.now() * 1000) {
        return null;
    } else {
        return unixTime;
    }
}

function _addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(date.getDate() + days);
    return result;
}

function _addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setHours(date.getHours() + hours);
    return result;
}

function _addMonth(date: Date, months: number) {
    const result = new Date(date);
    result.setMonth(date.getMonth() + months);
    return result;
}

function _addYears(date: Date, years: number) {
    const result = new Date(date);
    result.setFullYear(date.getFullYear() + years);
    return result;
}

const exp = RegExp('/[.A-Za-z]*/g');

// tries to extract date from file name if available else returns null
export function parseDateTimeFromFile(filename: string): number {
    try {
        const maxYear = currentYear + 1;
        const minYear = 1990;
        let value = filename.replaceAll(exp, '');
        if (value?.length > 0 && !isNumeric(value[0])) {
            value = value.slice(1);
        }
        if (value?.length > 0 && !isNumeric(value[value.length - 1])) {
            value = value.slice(0, -1);
        }
        const countOfHyphen = value.split('-').length - 1;
        const countUnderScore = value.split('_').length - 1;
        let valueForParser = value;
        if (countOfHyphen === 1) {
            value = value.replaceAll('-', 'T');
        } else if (countUnderScore === 1 || countUnderScore === 2) {
            valueForParser = valueForParser.replaceAll('_', 'T');
            if (countUnderScore === 2) {
                value = valueForParser.split('_')[0];
            }
        } else if (countOfHyphen === 2) {
            valueForParser = value.replaceAll('.', ':');
        } else if (countOfHyphen === 6) {
            const splits = value.split('-');
            valueForParser = `${splits[0]}-${splits[1]}-${splits[2]}T${splits[3]}:${splits[4]}:${splits[5]}`;
        }
        console.log('valueForParser', valueForParser);
        const result = Date.parse(valueForParser);
        if (result && result > minYear && result < maxYear) {
            return result * 1000;
        }
        return null;
    } catch (e) {
        logError(e, 'failed to extract date From FileName ');
        return null;
    }
}

function isNumeric(s?: string) {
    if (!s) {
        return false;
    }
    return Number.isNaN(Number.parseInt(s));
}
