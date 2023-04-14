import * as chrono from 'chrono-node';
import { getAllPeople } from 'utils/machineLearning';
import { t } from 'i18next';

import mlIDbStorage from 'utils/storage/mlIDbStorage';
import { getMLSyncConfig } from 'utils/machineLearning/config';
import { Collection } from 'types/collection';
import { EnteFile } from 'types/file';
import { logError } from 'utils/sentry';
import {
    Bbox,
    DateValue,
    LocationSearchResponse,
    Search,
    SearchOption,
    Suggestion,
    SuggestionType,
} from 'types/search';
import ObjectService from './machineLearning/objectService';
import { getFormattedDate, isInsideBox, isSameDayAnyYear } from 'utils/search';
import { Person, Thing } from 'types/machineLearning';
import { getUniqueFiles } from 'utils/file';
import { User } from 'types/user';
import { getData, LS_KEYS } from 'utils/storage/localStorage';

const DIGITS = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);

export const getDefaultOptions = async (files: EnteFile[]) => {
    return [
        await getIndexStatusSuggestion(),
        ...convertSuggestionsToOptions(await getAllPeopleSuggestion(), files),
    ];
};

export const getAutoCompleteSuggestions =
    (files: EnteFile[], collections: Collection[]) =>
    async (searchPhrase: string): Promise<SearchOption[]> => {
        searchPhrase = searchPhrase.trim().toLowerCase();
        if (!searchPhrase?.length) {
            return [];
        }
        const suggestions: Suggestion[] = [
            ...getHolidaySuggestion(searchPhrase),
            ...getYearSuggestion(searchPhrase),
            ...getDateSuggestion(searchPhrase),
            ...getCollectionSuggestion(searchPhrase, collections),
            getFileNameSuggestion(searchPhrase, files),
            getFileCaptionSuggestion(searchPhrase, files),
            ...(await getThingSuggestion(searchPhrase)),
        ];

        return convertSuggestionsToOptions(suggestions, files);
    };

function convertSuggestionsToOptions(
    suggestions: Suggestion[],
    files: EnteFile[]
) {
    const user = getData(LS_KEYS.USER) as User;
    const previewImageAppendedOptions: SearchOption[] = suggestions
        .map((suggestion) => ({
            suggestion,
            searchQuery: convertSuggestionToSearchQuery(suggestion),
        }))
        .map(({ suggestion, searchQuery }) => {
            const resultFiles = getUniqueFiles(
                files.filter((file) => isSearchedFile(user, file, searchQuery))
            );
            return {
                ...suggestion,
                fileCount: resultFiles.length,
                previewFiles: resultFiles.slice(0, 3),
            };
        })
        .filter((option) => option.fileCount);

    return previewImageAppendedOptions;
}

function getHolidaySuggestion(searchPhrase: string): Suggestion[] {
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

function getYearSuggestion(searchPhrase: string): Suggestion[] {
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
            logError(e, 'getYearSuggestion failed');
        }
    }
    return [];
}

export async function getAllPeopleSuggestion(): Promise<Array<Suggestion>> {
    try {
        const people = await getAllPeople(200);
        return people.map((person) => ({
            label: person.name,
            type: SuggestionType.PERSON,
            value: person,
            hide: true,
        }));
    } catch (e) {
        logError(e, 'getAllPeopleSuggestion failed');
        return [];
    }
}

export async function getIndexStatusSuggestion(): Promise<Suggestion> {
    const config = await getMLSyncConfig();
    const indexStatus = await mlIDbStorage.getIndexStatus(config.mlVersion);

    let label;
    if (!indexStatus.localFilesSynced) {
        label = t('INDEXING_SCHEDULED');
    } else if (indexStatus.outOfSyncFilesExists) {
        label = t('ANALYZING_PHOTOS', {
            indexStatus,
        });
    } else if (!indexStatus.peopleIndexSynced) {
        label = t('INDEXING_PEOPLE', { indexStatus });
    } else {
        label = t('INDEXING_DONE', { indexStatus });
    }

    return {
        label,
        type: SuggestionType.INDEX_STATUS,
        value: indexStatus,
        hide: true,
    };
}

function getDateSuggestion(searchPhrase: string): Suggestion[] {
    const searchedDates = parseHumanDate(searchPhrase);

    return searchedDates.map((searchedDate) => ({
        type: SuggestionType.DATE,
        value: searchedDate,
        label: getFormattedDate(searchedDate),
    }));
}

function getCollectionSuggestion(
    searchPhrase: string,
    collections: Collection[]
): Suggestion[] {
    const collectionResults = searchCollection(searchPhrase, collections);

    return collectionResults.map(
        (searchResult) =>
            ({
                type: SuggestionType.COLLECTION,
                value: searchResult.id,
                label: searchResult.name,
            } as Suggestion)
    );
}

function getFileNameSuggestion(
    searchPhrase: string,
    files: EnteFile[]
): Suggestion {
    const matchedFiles = searchFilesByName(searchPhrase, files);
    return {
        type: SuggestionType.FILE_NAME,
        value: matchedFiles.map((file) => file.id),
        label: searchPhrase,
    };
}

function getFileCaptionSuggestion(
    searchPhrase: string,
    files: EnteFile[]
): Suggestion {
    const matchedFiles = searchFilesByCaption(searchPhrase, files);
    return {
        type: SuggestionType.FILE_CAPTION,
        value: matchedFiles.map((file) => file.id),
        label: searchPhrase,
    };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getLocationSuggestions(searchPhrase: string) {
    const locationResults = await searchLocation(searchPhrase);

    return locationResults.map(
        (searchResult) =>
            ({
                type: SuggestionType.LOCATION,
                value: searchResult.bbox,
                label: searchResult.place,
            } as Suggestion)
    );
}

async function getThingSuggestion(searchPhrase: string): Promise<Suggestion[]> {
    const thingResults = await searchThing(searchPhrase);

    return thingResults.map(
        (searchResult) =>
            ({
                type: SuggestionType.THING,
                value: searchResult,
                label: searchResult.name,
            } as Suggestion)
    );
}

function searchCollection(
    searchPhrase: string,
    collections: Collection[]
): Collection[] {
    return collections.filter((collection) =>
        collection.name.toLowerCase().includes(searchPhrase)
    );
}

function searchFilesByName(searchPhrase: string, files: EnteFile[]) {
    const user = getData(LS_KEYS.USER) as User;
    if (!user) return [];
    return files.filter(
        (file) =>
            file.ownerID === user.id &&
            file.metadata.title.toLowerCase().includes(searchPhrase)
    );
}

function searchFilesByCaption(searchPhrase: string, files: EnteFile[]) {
    const user = getData(LS_KEYS.USER) as User;
    if (!user) return [];
    return files.filter(
        (file) =>
            file.ownerID === user.id &&
            file.pubMagicMetadata &&
            file.pubMagicMetadata.data.caption
                ?.toLowerCase()
                .includes(searchPhrase)
    );
}

function parseHumanDate(humanDate: string): DateValue[] {
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

async function searchLocation(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    searchPhrase: string
): Promise<LocationSearchResponse[]> {
    logError(Error(), 'attempting to use unimplemented search API');
    return [];
}

async function searchThing(searchPhrase: string) {
    const things = await ObjectService.getAllThings();
    return things.filter((thing) =>
        thing.name.toLocaleLowerCase().includes(searchPhrase)
    );
}

function isSearchedFile(user: User, file: EnteFile, search: Search) {
    if (search?.collection) {
        return search.collection === file.collectionID;
    }
    if (file.ownerID !== user.id) {
        return false;
    }

    if (search?.date) {
        return isSameDayAnyYear(search.date)(
            new Date(file.metadata.creationTime / 1000)
        );
    }
    if (search?.location) {
        return isInsideBox(
            {
                latitude: file.metadata.latitude,
                longitude: file.metadata.longitude,
            },
            search.location
        );
    }
    if (search?.files) {
        return search.files.indexOf(file.id) !== -1;
    }
    if (search?.person) {
        return search.person.files.indexOf(file.id) !== -1;
    }

    if (search?.thing) {
        return search.thing.files.indexOf(file.id) !== -1;
    }

    if (search?.text) {
        return search.text.files.indexOf(file.id) !== -1;
    }
    return false;
}

function convertSuggestionToSearchQuery(option: Suggestion): Search {
    switch (option.type) {
        case SuggestionType.DATE:
            return {
                date: option.value as DateValue,
            };

        case SuggestionType.LOCATION:
            return {
                location: option.value as Bbox,
            };

        case SuggestionType.COLLECTION:
            return { collection: option.value as number };

        case SuggestionType.FILE_NAME:
            return { files: option.value as number[] };

        case SuggestionType.FILE_CAPTION:
            return { files: option.value as number[] };

        case SuggestionType.PERSON:
            return { person: option.value as Person };

        case SuggestionType.THING:
            return { thing: option.value as Thing };
    }
}
