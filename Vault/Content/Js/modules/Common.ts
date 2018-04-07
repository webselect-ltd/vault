import { Credential } from '../types/all';

const rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;

export function trim(str: string): string {
    return str == null ? '' : (str + '').replace(rtrim, '');
}

export function truncate(str: string, len: number): string {
    return str.length > len ? str.substring(0, len - 3) + '...' : str;
}
