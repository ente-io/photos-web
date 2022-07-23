export interface TimeDelta {
    hours?: number;
    days?: number;
    months?: number;
    years?: number;
}

interface DateComponent<T = number> {
    year: T;
    month: T;
    day: T;
    hour: T;
    minute: T;
    second: T;
}

export function dateStringWithMMH(unixTimeInMicroSeconds: number): string {
    return new Date(unixTimeInMicroSeconds / 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatDateShort(date: number | Date) {
    const dateTimeFormat = new Intl.DateTimeFormat('en-IN', {
        year: '2-digit',
        month: 'short',
        day: 'numeric',
    });
    return dateTimeFormat.format(date);
}

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

export function getUnixTimeInMicroSeconds(dateTime: Date) {
    if (!dateTime || isNaN(dateTime.getTime())) {
        return null;
    }
    const unixTime = dateTime.getTime() * 1000;
    if (unixTime <= 0) {
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

/*
generates data component for date in format YYYYMMDD-HHMMSS
 */
export function parseDateFromFusedDateString(dateTime: string) {
    const dateComponent: DateComponent<string> = {
        year: dateTime.slice(0, 4),
        month: dateTime.slice(4, 6),
        day: dateTime.slice(6, 8),
        hour: dateTime.slice(9, 11),
        minute: dateTime.slice(11, 13),
        second: dateTime.slice(13, 15),
    };
    return getDateFromComponents(dateComponent);
}

/* sample date format = 2018-08-19 12:34:45
 the date has six symbol separated number values
 which we would extract and use to form the date
 */
export function tryToParseDateTime(dateTime: string): Date {
    const dateComponent = getDateComponentsFromSymbolJoinedString(dateTime);
    if (isDateComponentValid(dateComponent)) {
        return getDateFromComponents(dateComponent);
    } else if (
        dateComponent.year?.length === 8 &&
        dateComponent.month?.length === 6
    ) {
        // the filename has size 8 consecutive and then 6 consecutive digits
        // high possibility that the it is some unhandled date time encoding
        const possibleDateTime = dateComponent.year + '-' + dateComponent.month;
        return parseDateFromFusedDateString(possibleDateTime);
    } else {
        return null;
    }
}

function getDateComponentsFromSymbolJoinedString(
    dateTime: string
): DateComponent<string> {
    const [year, month, day, hour, minute, second] =
        dateTime.match(/\d+/g) ?? [];

    return { year, month, day, hour, minute, second };
}

//  has length number of digits in the components
function isDateComponentValid(dateComponent: DateComponent<string>) {
    return (
        dateComponent.year?.length === 4 &&
        dateComponent.month?.length === 2 &&
        dateComponent.day?.length === 2
    );
}

function parseDateComponentToNumber(
    dateComponent: DateComponent<string>
): DateComponent<number> {
    return {
        year: parseInt(dateComponent.year),
        // https://stackoverflow.com/questions/2552483/why-does-the-month-argument-range-from-0-to-11-in-javascripts-date-constructor
        month: parseInt(dateComponent.month) - 1,
        day: parseInt(dateComponent.day),
        hour: parseInt(dateComponent.hour),
        minute: parseInt(dateComponent.minute),
        second: parseInt(dateComponent.second),
    };
}

function getDateFromComponents(dateComponent: DateComponent<string>) {
    const { year, month, day, hour, minute, second } =
        parseDateComponentToNumber(dateComponent);
    const hasTimeValues = hour && minute && second;

    return hasTimeValues
        ? new Date(year, month, day, hour, minute, second)
        : new Date(year, month, day);
}
