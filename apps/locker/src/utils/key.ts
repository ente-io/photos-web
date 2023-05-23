import { LS_KEYS, getData } from '@/services/storage/localStorage';

export const getToken = () => getData(LS_KEYS.USER)?.token;
export const getUserID = () => getData(LS_KEYS.USER)?.id;
