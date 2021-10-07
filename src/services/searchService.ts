import * as chrono from 'chrono-node';
import { getEndpoint } from 'utils/common/apiUtil';
import { getToken } from 'utils/common/key';
import { DateValue, Suggestion, SuggestionType } from 'components/SearchBar';
import HTTPService from './HTTPService';
import { File } from './fileService';
import { User } from './userService';
import { getData, LS_KEYS } from 'utils/storage/localStorage';
import { Collection } from './collectionService';
import constants from 'utils/strings/constants';
import {
    ALL_SECTION,
    ARCHIVE_SECTION,
} from 'components/pages/gallery/Collections';

const ENDPOINT = getEndpoint();
const DIGITS = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
export type Bbox = [number, number, number, number];
export interface LocationSearchResponse {
    place: string;
    bbox: Bbox;
}
export const getMapboxToken = () => process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function parseHumanDate(humanDate: string): DateValue[] {
    const date = chrono.parseDate(humanDate);
    const date1 = chrono.parseDate(`${humanDate} 1`);
    if (date !== null) {
        const dates = [
            { month: date.getMonth() },
            { date: date.getDate(), month: date.getMonth() },
        ];
        let reverse = false;
        humanDate.split('').forEach((c) => {
            if (DIGITS.has(c)) {
                reverse = true;
            }
        });
        if (reverse) {
            return dates.reverse();
        }
        return dates;
    }
    if (date1) {
        return [{ month: date1.getMonth() }];
    }
    return [];
}

export async function searchLocation(
    searchPhrase: string
): Promise<LocationSearchResponse[]> {
    const resp = await HTTPService.get(
        `${ENDPOINT}/search/location`,
        {
            query: searchPhrase,
            limit: 4,
        },
        {
            'X-Auth-Token': getToken(),
        }
    );
    return resp.data.results;
}

export function getHolidaySuggestion(searchPhrase: string): Suggestion[] {
    return [
        {
            label: 'Christmas',
            value: { month: 11, date: 25 },
            type: SuggestionType.DATE,
        },
        {
            label: 'Christmas Eve',
            value: { month: 11, date: 24 },
            type: SuggestionType.DATE,
        },
        {
            label: 'New Year',
            value: { month: 0, date: 1 },
            type: SuggestionType.DATE,
        },
        {
            label: 'New Year Eve',
            value: { month: 11, date: 31 },
            type: SuggestionType.DATE,
        },
    ].filter((suggestion) =>
        suggestion.label.toLowerCase().includes(searchPhrase)
    );
}

export function getYearSuggestion(searchPhrase: string): Suggestion[] {
    if (searchPhrase.length === 4) {
        try {
            const year = parseInt(searchPhrase);
            if (year >= 1970 && year <= new Date().getFullYear()) {
                return [
                    {
                        label: searchPhrase,
                        value: { year },
                        type: SuggestionType.DATE,
                    },
                ];
            }
        } catch (e) {
            // ignore
        }
    }
    return [];
}

export function searchCollection(
    searchPhrase: string,
    collections: Collection[]
): { id: number; name: string }[] {
    return [
        ...collections,
        { id: ALL_SECTION, name: constants.ALL },
        { id: ARCHIVE_SECTION, name: constants.ARCHIVE },
    ]
        .filter((collection) =>
            collection.name.toLowerCase().includes(searchPhrase)
        )
        .map((collection) => ({ id: collection.id, name: collection.name }));
}

export function searchFiles(searchPhrase: string, files: File[]) {
    const user: User = getData(LS_KEYS.USER) ?? {};
    const idSet = new Set();
    return files
        .map((file, idx) => ({
            title: file.metadata.title,
            index: idx,
            type: file.metadata.fileType,
            ownerID: file.ownerID,
            id: file.id,
        }))
        .filter((file) => {
            if (file.ownerID === user.id && !idSet.has(file.id)) {
                idSet.add(file.id);
                return true;
            }
            return false;
        })
        .filter(({ title }) => title.toLowerCase().includes(searchPhrase))
        .slice(0, 4);
}
