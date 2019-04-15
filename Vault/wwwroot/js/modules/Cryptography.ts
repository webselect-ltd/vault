import { ICredential, PasswordCharacterMatrix, PasswordSpecification } from '../types/all';

const charMatrix: PasswordCharacterMatrix = {
    lowercase: [97, 122],
    uppercase: [65, 90],
    numbers: [48, 57],
    symbols: [33, 33, 35, 47, 58, 64, 91, 96, 123, 126],
    spaces: [161, 254]
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Bit value below which password is deemed weak
export const weakPasswordThreshold = 40;

// TODO: Refactoring and cleanup
export function getPasswordBits(password: string) {
    if (!password) {
        return 0;
    }

    const cset: any = {};

    const ci: number[] = [0, 32, 33, 47, 48, 57, 58, 64, 65, 90, 91, 96, 97, 122, 123, 126, 126, 255, 256, 65535];

    let t: number;
    let ok: number;
    let factor: number;
    let df: number;
    const vdf: number[] = [];
    const vcc: number[] = [];
    let el: number = 0;
    let ext: number;
    let exdf: number;

    for (let i = 0; i < password.length; i++) {
        factor = 1;
        ok = 0;
        t = password.charCodeAt(i);
        for (let j = 0; j < ci.length; j += 2) {
            if (t >= ci[j] && t <= ci[j + 1]) {
                cset['' + j] = ci[j + 1] - ci[j];
                ok = 1;
                break;
            }
        }
        if (!ok) {
            cset.x = 65280;
        }
        if (i >= 1) {
            df = t - ext;
            if (exdf === df) {
                vdf[df] = 1;
            } else {
                vdf[df] = (vdf[df] ? vdf[df] : 0) + 1;
                factor /= vdf[df];
            }
        }
        if (!vcc[t]) {
            vcc[t] = 1;
            el += factor;
        } else {
            el += factor * (1 / ++vcc[t]);
        }
        exdf = df;
        ext = t;
    }
    let tot = 0;
    for (const k in cset) {
        if (!isNaN(parseInt(k, 10))) {
            tot += cset[k];
        }
    }
    if (!tot) {
        return 0;
    }
    return Math.ceil(el * Math.log(tot) / Math.log(2));
}

export function hex(buffer: ArrayBuffer) {
    return Array.from(new Uint8Array(buffer)).map(b => ('0' + b.toString(16)).slice(-2)).join('');
}

export function plain(buffer: ArrayBuffer) {
    return decoder.decode(buffer);
}

export async function hash(s: string) {
    return await crypto.subtle.digest('SHA-256', encoder.encode(s));
}

// TODO: Refactoring and cleanup
export function generatePassword(specification: PasswordSpecification) {
    if (specification.length === 0) {
        return null;
    }

    const charTypes = specification.getCharacterTypes();

    if (!charTypes.length) {
        return null;
    }

    let str = '';

    charTypes.forEach(t => {
        const M = charMatrix[t];
        for (let u = 0; u < M.length; u += 2) {
            for (let y = M[u]; y <= M[u + 1]; y++) {
                str += String.fromCharCode(y);
            }
        }
    });

    let pass = '';

    if (str) {
        const l = str.length;
        let v = 0;
        for (let p = 0; p < specification.length;) {
            v = Math.floor(Math.random() * l);
            if (v === l) {
                continue;
            }
            pass += str.substring(v, v + 1);
            p++;
        }
    }
    return pass;
}

export async function generateMasterKey(password: string) {
    const inner = await hash(password);
    const outer = await hash(password + plain(inner));
    return plain(outer);
}

export async function decryptCredential(credential: ICredential, masterKey: string, excludes: string[]) {
    return forPropertiesOf(credential, async val => await aesGcmDecrypt(val, masterKey), excludes);
}

export async function decryptCredentials(credentials: ICredential[], masterKey: string, excludes: string[]) {
    return await Promise.all(credentials.map(async item => await decryptCredential(item, masterKey, excludes)));
}

export async function encryptCredential(credential: ICredential, masterKey: string, excludes: string[]) {
    return forPropertiesOf(credential, async val => await aesGcmEncrypt(val, masterKey), excludes);
}

export async function encryptCredentials(credentials: ICredential[], masterKey: string, excludes: string[]) {
    return await Promise.all(credentials.map(async item => await encryptCredential(item, masterKey, excludes)));
}

export function isWeakPassword(password: string) {
    if (!password) {
        return true;
    }
    return getPasswordBits(password) <= weakPasswordThreshold;
}

async function forPropertiesOf(credential: ICredential, action: (val: string) => Promise<string>, excludes: string[]) {
    const encrypted: any = {};

    const properties = Object.keys(credential);

    const isExcluded = (k: string) => excludes.indexOf(k) !== -1;
    const isNotExcluded = (k: string) => !isExcluded(k);

    // Map the excluded properties directly
    properties.filter(isExcluded).forEach(k => encrypted[k] = credential[k]);

    const encryptedMappings = properties.filter(isNotExcluded)
        .map(async k => { encrypted[k] = await action(credential[k]); });

    await Promise.all(encryptedMappings);

    return (encrypted as ICredential);
}

// The following functions were adapted from:
// https://gist.github.com/chrisveness/43bcda93af9f646d083fad678071b90a

async function aesGcmEncrypt(plaintext: string, password: string) {
    const pwHash = await hash(password);

    const iv = crypto.getRandomValues(new Uint8Array(12));

    const algorithm: AesGcmParams = {
        name: 'AES-GCM',
        iv: iv
    };

    const key = await crypto.subtle.importKey('raw', pwHash, algorithm.name, false, ['encrypt']);

    const buffer = await crypto.subtle.encrypt(algorithm, key, encoder.encode(plaintext));

    const cipherText = Array.from(new Uint8Array(buffer))
        .map(byte => String.fromCharCode(byte))
        .join('');

    const ivHex = Array.from(iv)
        .map(b => ('00' + b.toString(16)).slice(-2))
        .join('');

    return ivHex + btoa(cipherText);
}

async function aesGcmDecrypt(cipherTextBase64: string, password: string) {
    const pwHash = await hash(password);

    const iv = cipherTextBase64.slice(0, 24)
        .match(/.{2}/g)
        .map(byte => parseInt(byte, 16));

    const algorithm: AesGcmParams = {
        name: 'AES-GCM',
        iv: new Uint8Array(iv)
    };

    const key = await crypto.subtle.importKey('raw', pwHash, algorithm.name, false, ['decrypt']);

    const cipherText = atob(cipherTextBase64.slice(24))
        .match(/[\s\S]/g)
        .map(ch => ch.charCodeAt(0));

    const buffer = await crypto.subtle.decrypt(algorithm, key, new Uint8Array(cipherText));

    return decoder.decode(buffer);
}
