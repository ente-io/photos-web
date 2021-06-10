import React from 'react';
import Select from 'react-select';
import styled from 'styled-components';

const Container = styled.div`
    margin: 0 auto; 
    display: flex;
    justify-content:flex-end;
    max-width: 100%;
    @media (min-width: 1000px) {
        width: 1000px;
    }
    @media (min-width: 450px) and (max-width: 1000px) {
        width: 600px;
    }
    @media (max-width: 450px) {
        width: 100%;
    }
    &>.select{
        width:150px;
    }
`;

interface Props {
    setSortBy: (sortBy: SortByVariant) => void;
}

type SortByOption = {
    label: string,
    value: SortByVariant,
};

export enum SortByVariant {
    ByCreationTime,
    ByModificationTime
}

const customStyles = {
    control: (style, { isFocused }) => ({
        ...style,
        'backgroundColor': '#282828',
        'color': '#d1d1d1',
        'borderColor': isFocused ? '#2dc262' : '#444',
        'boxShadow': 'none',
        ':hover': {
            'borderColor': '#2dc262',
            'cursor': 'pointer',
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
        color: '#fff',
        backgroundColor: isFocused && '#343434',
    }),
    singleValue: (style) => ({
        ...style,
        backgroundColor: '#282828',
        color: '#d1d1d1',
    }),
};
const sortByOptions: SortByOption[] = [{ label: 'last taken', value: SortByVariant.ByCreationTime }, { label: 'last modified', value: SortByVariant.ByModificationTime }];

export default function SortByButton(props: Props) {
    const updateSortBy = (selectedOption: SortByOption) => {
        if (!selectedOption) {
            return;
        }
        props.setSortBy(selectedOption.value);
    };
    return (
        <Container>
            <Select className={'select'} defaultValue={sortByOptions[0]} options={sortByOptions} styles={customStyles} isSearchable={false} onChange={updateSortBy} />
        </Container>
    );
}
