import { LS_KEYS, getData } from '@/utils/storage/localStorage';

export const getToken = () => getData(LS_KEYS.USER)?.token;
export const getUserID = () => getData(LS_KEYS.USER)?.id;
