import { Search, SearchStats, SetCollections } from 'pages/gallery';
import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import AsyncSelect from 'react-select/async';
import { components } from 'react-select';
import debounce from 'debounce-promise';
import { File } from 'services/fileService';
import {
    Bbox,
    getHolidaySuggestion,
    getYearSuggestion,
    parseHumanDate,
    searchLocation,
} from 'services/searchService';
import { getFormattedDate } from 'utils/search';
import constants from 'utils/strings/constants';
import LocationIcon from './icons/LocationIcon';
import DateIcon from './icons/DateIcon';
import SearchIcon from './icons/SearchIcon';
import CrossIcon from './icons/CrossIcon';

const Wrapper = styled.div<{ isDisabled: boolean; isOpen: boolean }>`
    position: fixed;
    top: 0;
    z-index: 1000;
    display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
    width: 100%;
    background: #111;
    @media (min-width: 625px) {
        display: flex;
        width: calc(100vw - 140px);
        margin: 0 70px;
    }
    align-items: center;
    min-height: 64px;
    transition: opacity 1s ease;
    opacity: ${(props) => (props.isDisabled ? 0 : 1)};
    margin-bottom: 10px;
`;

const SearchButton = styled.div<{ isOpen: boolean }>`
    display: none;
    @media (max-width: 624px) {
        display: ${({ isOpen }) => (!isOpen ? 'flex' : 'none')};
        right: 80px;
        cursor: pointer;
        position: fixed;
        top: 0;
        z-index: 1000;
        align-items: center;
        min-height: 64px;
    }
`;

const SearchStatsContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    color: #979797;
    margin-bottom: 8px;
`;

const SearchInput = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    max-width: 484px;
    margin: auto;
`;

export enum SuggestionType {
    DATE,
    LOCATION,
}
export interface DateValue {
    date?: number;
    month?: number;
    year?: number;
}
export interface Suggestion {
    type: SuggestionType;
    label: string;
    value: Bbox | DateValue;
}
interface Props {
    isOpen: boolean;
    isFirstFetch: boolean;
    setOpen: (value) => void;
    loadingBar: any;
    setCollections: SetCollections;
    setSearch: (search: Search) => void;
    files: File[];
    searchStats: SearchStats;
}
export default function SearchBar(props: Props) {
    const selectRef = useRef(null);
    useEffect(() => {
        if (props.isOpen) {
            setTimeout(() => {
                selectRef.current?.focus();
            }, 250);
        }
    }, [props.isOpen]);

    // = =========================
    // Functionality
    // = =========================
    const getAutoCompleteSuggestions = async (searchPhrase: string) => {
        searchPhrase = searchPhrase.trim();
        if (!searchPhrase?.length) {
            return [];
        }
        const option = [
            ...getHolidaySuggestion(searchPhrase),
            ...getYearSuggestion(searchPhrase),
        ];

        const searchedDates = parseHumanDate(searchPhrase);

        option.push(
            ...searchedDates.map((searchedDate) => ({
                type: SuggestionType.DATE,
                value: searchedDate,
                label: getFormattedDate(searchedDate),
            }))
        );

        const searchResults = await searchLocation(searchPhrase);
        option.push(
            ...searchResults.map(
                (searchResult) =>
                    ({
                        type: SuggestionType.LOCATION,
                        value: searchResult.bbox,
                        label: searchResult.place,
                    } as Suggestion)
            )
        );
        return option;
    };

    const getOptions = debounce(getAutoCompleteSuggestions, 250);

    const filterFiles = (selectedOption: Suggestion) => {
        if (!selectedOption) {
            return;
        }
        // const startTime = Date.now();
        props.setOpen(true);

        switch (selectedOption.type) {
            case SuggestionType.DATE:
                props.setSearch({
                    date: selectedOption.value as DateValue,
                });
                break;
            case SuggestionType.LOCATION:
                props.setSearch({
                    location: selectedOption.value as Bbox,
                });
                break;
        }
    };
    const resetSearch = () => {
        if (props.isOpen) {
            selectRef.current.select.state.value = null;
            props.loadingBar.current?.continuousStart();
            // props.setFiles(allFiles);
            props.setSearch({});
            setTimeout(() => {
                props.loadingBar.current?.complete();
            }, 10);
            props.setOpen(false);
        }
    };

    // = =========================
    // UI
    // = =========================

    const getIconByType = (type: SuggestionType) =>
        type === SuggestionType.DATE ? <DateIcon /> : <LocationIcon />;

    const LabelWithIcon = (props: { type: SuggestionType; label: string }) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ paddingRight: '10px', paddingBottom: '4px' }}>
                {getIconByType(props.type)}
            </span>
            <span>{props.label}</span>
        </div>
    );
    const { Option, Control } = components;

    const OptionWithIcon = (props) => (
        <Option {...props}>
            <LabelWithIcon type={props.data.type} label={props.data.label} />
        </Option>
    );
    const ControlWithIcon = (props) => (
        <Control {...props}>
            <span
                className="icon"
                style={{
                    paddingLeft: '10px',
                    paddingBottom: '4px',
                }}>
                {props.getValue().length === 0 || props.menuIsOpen ? (
                    <SearchIcon />
                ) : props.getValue()[0].type === SuggestionType.DATE ? (
                    <DateIcon />
                ) : (
                    <LocationIcon />
                )}
            </span>
            {props.children}
        </Control>
    );

    const customStyles = {
        control: (style, { isFocused }) => ({
            ...style,
            backgroundColor: '#282828',
            color: '#d1d1d1',
            borderColor: isFocused ? '#2dc262' : '#444',
            boxShadow: 'none',
            ':hover': {
                borderColor: '#2dc262',
                cursor: 'text',
                '&>.icon': { color: '#2dc262' },
            },
        }),
        input: (style) => ({
            ...style,
            color: '#d1d1d1',
        }),
        menu: (style) => ({
            ...style,
            marginTop: '10px',
            backgroundColor: '#282828',
        }),
        option: (style, { isFocused }) => ({
            ...style,
            backgroundColor: isFocused && '#343434',
        }),
        dropdownIndicator: (style) => ({
            ...style,
            display: 'none',
        }),
        indicatorSeparator: (style) => ({
            ...style,
            display: 'none',
        }),
        clearIndicator: (style) => ({
            ...style,
            display: 'none',
        }),
        singleValue: (style, state) => ({
            ...style,
            backgroundColor: '#282828',
            color: '#d1d1d1',
            display: state.selectProps.menuIsOpen ? 'none' : 'block',
        }),
        placeholder: (style) => ({
            ...style,
            color: '#686868',
            wordSpacing: '2px',
            whiteSpace: 'nowrap',
        }),
    };
    return (
        <>
            {props.searchStats && (
                <SearchStatsContainer>
                    {constants.SEARCH_STATS(props.searchStats)}
                </SearchStatsContainer>
            )}
            <Wrapper isDisabled={props.isFirstFetch} isOpen={props.isOpen}>
                <SearchInput>
                    <div
                        style={{
                            flex: 1,
                            margin: '10px',
                        }}>
                        <AsyncSelect
                            components={{
                                Option: OptionWithIcon,
                                Control: ControlWithIcon,
                            }}
                            ref={selectRef}
                            placeholder={constants.SEARCH_HINT()}
                            loadOptions={getOptions}
                            onChange={filterFiles}
                            isClearable
                            escapeClearsValue
                            styles={customStyles}
                            noOptionsMessage={() => null}
                        />
                    </div>
                    <div style={{ width: '24px' }}>
                        {props.isOpen && (
                            <div
                                style={{ cursor: 'pointer' }}
                                onClick={resetSearch}>
                                <CrossIcon />
                            </div>
                        )}
                    </div>
                </SearchInput>
            </Wrapper>
            <SearchButton
                isOpen={props.isOpen}
                onClick={() => !props.isFirstFetch && props.setOpen(true)}>
                <SearchIcon />
            </SearchButton>
        </>
    );
}
