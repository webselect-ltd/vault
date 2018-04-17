import '../legacy/passpack-v1.1.js';
import { ICredential, IPasswordSpecification } from '../types/all';

// Bit value below which password is deemed weak
export const weakPasswordThreshold = 40;

export function base64ToUtf8(str: string) {
    return unescape(decodeURIComponent(atob(str)));
}

export function utf8ToBase64(str: string) {
    return btoa(encodeURIComponent(escape(str)));
}

export function getPasswordBits(password: string) {
    return Passpack.utils.getBits(password);
}

export function hash(str: string) {
    return Passpack.utils.hashx(str);
}

export function generatePassword(specification: IPasswordSpecification) {
    if (specification.length === 0) {
        return null;
    }

    if (specification.lowercase === false
        && specification.uppercase === false
        && specification.numbers === false
        && specification.symbols === false) {
        return null;
    }

    const options: IPasspackCharOptions = {};

    if (specification.lowercase) {
        options.lcase = 1;
    }

    if (specification.uppercase) {
        options.ucase = 1;
    }

    if (specification.numbers) {
        options.nums = 1;
    }

    if (specification.symbols) {
        options.symb = 1;
    }

    return Passpack.utils.passGenerator(options, specification.length);
}

export function generateMasterKey(password: string) {
    return Passpack.utils.hashx(password + Passpack.utils.hashx(password, true, true), true, true);
}

export function decryptCredential(credential: ICredential, masterKey: string, excludes: string[]) {
    return crypt(Passpack.decode, credential, masterKey, excludes);
}

export function decryptCredentials(credentials: ICredential[], masterKey: string, excludes: string[]) {
    return credentials.map(item => decryptCredential(item, masterKey, excludes));
}

export function encryptCredential(credential: ICredential, masterKey: string, excludes: string[]) {
    return crypt(Passpack.encode, credential, masterKey, excludes);
}

export function encryptCredentials(credentials: ICredential[], masterKey: string, excludes: string[]) {
    return credentials.map(item => encryptCredential(item, masterKey, excludes));
}

export function isWeakPassword(password: string) {
    return password && getPasswordBits(password) <= weakPasswordThreshold;
}

function crypt(action: PasspackCryptoFunction, obj: ICredential, masterKey: string, excludes: string[]) {
    const newCredential: any = {};
    Object.keys(obj).forEach((k: string) => {
        if (excludes.indexOf(k) === -1) {
            newCredential[k] = action('AES', obj[k], base64ToUtf8(masterKey));
        } else {
            newCredential[k] = obj[k];
        }
    });
    return (newCredential as ICredential);
}
